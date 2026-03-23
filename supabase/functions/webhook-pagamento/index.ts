import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')  ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const payload = await req.json();
    console.log('Webhook recebido:', JSON.stringify(payload));

    const event = payload?.event as string;

    // Aceita billing.paid (v1)
    if (event !== 'billing.paid') {
      return new Response(JSON.stringify({ ok: true, ignored: event }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Extrair dados do billing ─────────────────────────────────────
    const billing  = (payload?.data?.billing ?? payload?.data ?? {}) as Record<string, unknown>;
    const metadata = (billing?.metadata ?? {}) as Record<string, string>;
    const customer = (billing?.customer ?? {}) as Record<string, string>;

    const email      = metadata?.email  || customer?.email  || '';
    const ref        = metadata?.ref    || '';
    const billingId  = billing?.id as string || '';
    const valorCents = billing?.amount  as number || 0;
    const valorReal  = valorCents / 100;

    if (!email) {
      console.error('Email não encontrado no webhook');
      return new Response(JSON.stringify({ error: 'email ausente' }), { status: 400, headers: CORS });
    }

    // ── Supabase service role (bypass RLS) ───────────────────────────
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Código de acesso único
    const cod = 'RX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Buscar user_id pelo email (tabela perfis)
    let userId: string | null = null;
    try {
      const { data: perfil } = await sb
        .from('perfis')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      userId = perfil?.id ?? null;

      // Fallback: buscar via listUsers da API admin
      if (!userId) {
        const { data: usersData } = await sb.auth.admin.listUsers({ perPage: 1000 });
        const found = usersData?.users?.find((u: { email: string; id: string }) => u.email === email);
        userId = found?.id ?? null;
      }
    } catch(e) {
      console.warn('Erro ao buscar userId:', e);
    }

    // ── Evita duplicata: verifica se billing_id já existe ────────────
    if (billingId) {
      const { data: existente } = await sb
        .from('pedidos')
        .select('id')
        .eq('billing_id', billingId)
        .eq('status', 'pago')
        .maybeSingle();
      if (existente) {
        console.log(`Billing ${billingId} já processado — ignorando`);
        return new Response(JSON.stringify({ ok: true, duplicated: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Atualiza pedido pendente existente OU insere novo ────────────
    let pedido = null;
    let pedErr = null;

    // Tenta atualizar registro pendente pelo billing_id
    if (billingId) {
      const { data: upd, error: updE } = await sb
        .from('pedidos')
        .update({ status: 'pago', codigo_acesso: cod, ...(userId ? { user_id: userId } : {}) })
        .eq('billing_id', billingId)
        .eq('status', 'pendente')
        .select()
        .maybeSingle();
      pedido = upd;
      pedErr = updE;
    }

    // Se não havia pendente, insere novo
    if (!pedido) {
      const { data: ins, error: insE } = await sb.from('pedidos').insert({
        email,
        valor_pago:    valorReal,
        metodo_pag:    'pix',
        status:        'pago',
        codigo_acesso: cod,
        billing_id:    billingId,
        ...(userId ? { user_id: userId } : {}),
      }).select().single();
      pedido = ins;
      pedErr = insE;
    }

    if (pedErr) {
      console.error('Erro ao salvar pedido:', pedErr.message);
    }

    // ── Atualiza perfis com plano vitalicio ──────────────────────────
    if (userId) {
      try {
        const { error: pErr } = await sb
          .from('perfis')
          .update({ plano: 'vitalicio', plano_ativo_em: new Date().toISOString() })
          .eq('id', userId);
        if (pErr) console.error('Erro ao atualizar perfis:', pErr.message);
        else console.log(`Perfil ${userId} atualizado para plano vitalicio`);
      } catch(e) {
        console.error('Erro ao atualizar perfis:', e);
      }
    } else {
      console.warn(`user_id não encontrado para email ${email} — perfis não atualizado`);
    }

    // ── Comissão do afiliado ─────────────────────────────────────────
    if (ref && pedido) {
      try {
        const { data: af } = await sb
          .from('afiliados')
          .select('id')
          .eq('codigo', ref.toUpperCase())
          .single();

        if (af) {
          const comissao = +(valorReal * 0.10).toFixed(2);

          // Tenta atualizar indicação pendente existente (converteu: false → true)
          const { data: updated, error: updErr } = await sb
            .from('indicacoes')
            .update({
              converteu:  true,
              valor_pago: valorReal,
              comissao,
            })
            .eq('afiliado_id', af.id)
            .eq('indicado_email', email)
            .eq('converteu', false)
            .select()
            .maybeSingle();

          // Se não havia indicação pendente, insere nova com converteu: true
          if (!updated && !updErr) {
            await sb.from('indicacoes').insert({
              afiliado_id:    af.id,
              indicado_email: email,
              converteu:      true,
              valor_pago:     valorReal,
              comissao,
            });
          }

          await sb.rpc('incrementar_venda_afiliado', {
            p_afiliado_id: af.id,
            p_valor:       valorReal,
          }).catch((e: Error) => console.error('rpc erro:', e.message));

          console.log(`Comissão R$ ${comissao} registrada para afiliado ${ref}`);
        }
      } catch (e) {
        console.error('Erro ao registrar comissão:', e);
      }
    }

    console.log(`Pedido processado: ${cod} | email: ${email} | billing: ${billingId}`);

    return new Response(JSON.stringify({ ok: true, cod }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
