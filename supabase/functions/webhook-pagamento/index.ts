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

    // Log COMPLETO para diagnóstico da estrutura do AbacatePay
    console.log('Webhook payload COMPLETO:', JSON.stringify(payload, null, 2));

    const event = payload?.event as string;
    console.log('Evento recebido:', event);

    // Aceita billing.paid (v1)
    if (event !== 'billing.paid') {
      console.log('Evento ignorado:', event);
      return new Response(JSON.stringify({ ok: true, ignored: event }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Extrair dados do billing ─────────────────────────────────────
    // AbacatePay pode enviar em estruturas diferentes — cobrimos todas
    const billing  = (payload?.data?.billing ?? payload?.data ?? payload ?? {}) as Record<string, unknown>;
    const metadata = (billing?.metadata ?? payload?.metadata ?? {}) as Record<string, string>;
    const customer = (billing?.customer ?? payload?.customer ?? {}) as Record<string, unknown>;
    // O AbacatePay coloca o email dentro de customer.metadata (não customer.email direto!)
    const customerMeta = (customer?.metadata ?? {}) as Record<string, string>;

    console.log('billing keys:', Object.keys(billing));
    console.log('metadata:', JSON.stringify(metadata));
    console.log('customer:', JSON.stringify(customer));
    console.log('customerMeta:', JSON.stringify(customerMeta));

    // Tenta extrair email de todos os locais possíveis
    const email =
      customerMeta?.email           ||  // ← estrutura real do AbacatePay
      metadata?.email               ||
      (customer?.email as string)   ||
      (billing?.email as string)    ||
      (payload?.email as string)    ||
      '';

    const ref        = metadata?.ref    || customerMeta?.ref || (billing?.ref as string) || '';
    const cupom      = metadata?.cupom  || '';
    const billingId  = (billing?.id ?? payload?.id) as string || '';
    const valorCents = (billing?.amount ?? billing?.value ?? payload?.amount) as number || 0;
    const valorReal  = valorCents / 100;


    console.log(`Extraído — email: ${email} | billingId: ${billingId} | valor: ${valorReal} | ref: ${ref} | cupom: ${cupom}`);

    if (!email) {
      console.error('Email não encontrado no webhook. Payload completo:', JSON.stringify(payload));
      return new Response(JSON.stringify({ error: 'email ausente' }), { status: 400, headers: CORS });
    }

    // ── Supabase service role (bypass RLS) ───────────────────────────
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Código de acesso único
    const cod = 'RX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Buscar user_id pelo email via auth.admin
    let userId: string | null = null;
    try {
      const { data: usersData } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const found = usersData?.users?.find((u: { email: string; id: string }) => u.email?.toLowerCase() === email.toLowerCase());
      userId = found?.id ?? null;
    } catch(e) {
      console.warn('Erro ao buscar userId via auth.admin:', e);
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
        cupom_usado:   cupom || null,
        ref_afiliado:  ref || null,
        ...(userId ? { user_id: userId } : {}),
      }).select().single();
      pedido = ins;
      pedErr = insE;
    }

    if (pedErr) {
      console.error('Erro ao salvar pedido:', pedErr.message);
    }

    // ── Atualiza perfis com plano vitalicio (via RPC SECURITY DEFINER) ──
    if (userId) {
      try {
        // Tenta via RPC (mais confiável, ignora RLS)
        const { error: rpcErr } = await sb.rpc('ativar_plano_vitalicio', { p_user_id: userId });
        if (rpcErr) {
          console.warn('RPC ativar_plano falhou, tentando update direto:', rpcErr.message);
          // Fallback: update direto (funciona se service_role key estiver OK)
          const { error: pErr } = await sb
            .from('perfis')
            .update({ plano: 'vitalicio', plano_ativo_em: new Date().toISOString() })
            .eq('id', userId);
          if (pErr) console.error('Erro ao atualizar perfis (fallback):', pErr.message);
          else console.log(`Perfil ${userId} atualizado via fallback`);
        } else {
          console.log(`Perfil ${userId} atualizado para plano vitalicio via RPC`);
        }
      } catch(e) {
        console.error('Erro ao atualizar perfis:', e);
      }
    } else {
      console.warn(`user_id não encontrado para email ${email} — perfis não atualizado`);
    }

    // ── Comissão do afiliado ─────────────────────────────────────────
    // Usa ref do metadata, mas se veio vazio, tenta pegar do pedido pendente
    const refFinal = ref || (pedido as Record<string, unknown>)?.ref_afiliado as string || '';
    console.log(`Ref para comissão: metadata="${ref}" | pedido="${(pedido as Record<string, unknown>)?.ref_afiliado || ''}" | final="${refFinal}"`);

    if (refFinal && pedido) {
      try {
        const { data: af } = await sb
          .from('afiliados')
          .select('id')
          .eq('codigo', refFinal.toUpperCase())
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

          console.log(`Comissão R$ ${comissao} registrada para afiliado ${refFinal}`);
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
