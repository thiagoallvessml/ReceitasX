import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ABACATE_API  = 'https://api.abacatepay.com/v1';
const ABACATE_KEY  = Deno.env.get('ABACATEPAY_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')  ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    const { billingId } = await req.json();

    if (!billingId) {
      return new Response(JSON.stringify({ error: 'billingId obrigatório' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    console.log('Confirmando pagamento para billingId:', billingId);

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

    // 1. Verifica se já está pago no banco
    const { data: pedidoExistente } = await sb
      .from('pedidos')
      .select('id, status, email')
      .eq('billing_id', billingId)
      .maybeSingle();

    if (pedidoExistente?.status === 'pago') {
      console.log('Pedido já está pago no banco:', pedidoExistente.id);
      return new Response(JSON.stringify({ ok: true, status: 'pago', already: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // 2. Consulta o AbacatePay para verificar o status do billing
    const resp = await fetch(`${ABACATE_API}/billing/get?id=${billingId}`, {
      headers: {
        'Authorization': `Bearer ${ABACATE_KEY}`,
        'Content-Type':  'application/json',
      },
    });

    const text = await resp.text();
    console.log('AbacatePay status check:', resp.status, text.slice(0, 500));

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Erro ao consultar AbacatePay', status: resp.status }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    let billing: Record<string, unknown>;
    try { billing = JSON.parse(text); } catch { billing = {}; }

    // Suporte a { data: {...} } ou direto
    const inner  = (billing?.data as Record<string, unknown>) ?? billing;
    const status = (inner?.status ?? billing?.status) as string || '';

    console.log('Status do billing:', status);

    // AbacatePay usa: PAID, PENDING, EXPIRED, etc.
    if (status !== 'PAID' && status !== 'paid' && status !== 'billing.paid') {
      return new Response(JSON.stringify({ ok: false, status, msg: 'Pagamento ainda não confirmado pelo AbacatePay' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // 3. Pagamento confirmado — processa igual ao webhook
    const metadata = (inner?.metadata ?? {}) as Record<string, string>;
    const customer = (inner?.customer ?? {}) as Record<string, string>;

    const email     = metadata?.email || customer?.email || pedidoExistente?.email || '';
    const ref       = metadata?.ref   || '';
    const valorCents = (inner?.amount ?? inner?.value) as number || 0;
    const valorReal  = valorCents / 100;

    const cod = 'RX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Busca user_id
    let userId: string | null = null;
    if (email) {
      try {
        const { data: usersData } = await sb.auth.admin.listUsers({ perPage: 1000 });
        const found = usersData?.users?.find((u: { email: string; id: string }) =>
          u.email?.toLowerCase() === email.toLowerCase()
        );
        userId = found?.id ?? null;
      } catch(e) {
        console.warn('Erro ao buscar userId:', e);
      }
    }

    // Atualiza pedido pendente ou insere novo
    let pedido = null;
    const { data: upd } = await sb
      .from('pedidos')
      .update({ status: 'pago', codigo_acesso: cod, ...(userId ? { user_id: userId } : {}) })
      .eq('billing_id', billingId)
      .eq('status', 'pendente')
      .select()
      .maybeSingle();
    pedido = upd;

    if (!pedido && email) {
      const { data: ins } = await sb.from('pedidos').insert({
        email,
        valor_pago:    valorReal,
        metodo_pag:    'pix',
        status:        'pago',
        codigo_acesso: cod,
        billing_id:    billingId,
        ...(userId ? { user_id: userId } : {}),
      }).select().single();
      pedido = ins;
    }

    // Atualiza perfil para vitalício
    if (userId) {
      await sb.from('perfis')
        .update({ plano: 'vitalicio', plano_ativo_em: new Date().toISOString() })
        .eq('id', userId);
      console.log(`Perfil ${userId} atualizado para vitalicio`);
    }

    // Comissão do afiliado
    if (ref && email) {
      try {
        const { data: af } = await sb.from('afiliados').select('id').eq('codigo', ref.toUpperCase()).single();
        if (af && valorReal > 0) {
          const comissao = +(valorReal * 0.10).toFixed(2);
          await sb.from('indicacoes').update({ converteu: true, valor_pago: valorReal, comissao })
            .eq('afiliado_id', af.id).eq('indicado_email', email).eq('converteu', false);
          await sb.rpc('incrementar_venda_afiliado', { p_afiliado_id: af.id, p_valor: valorReal })
            .catch((e: Error) => console.warn('rpc erro:', e.message));
        }
      } catch(e) {
        console.warn('Erro comissão:', e);
      }
    }

    console.log(`Pagamento confirmado manualmente: ${cod} | email: ${email} | billing: ${billingId}`);

    return new Response(JSON.stringify({ ok: true, status: 'pago', cod }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('confirmar-pagamento error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
