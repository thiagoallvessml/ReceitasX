import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ABACATE_API   = 'https://api.abacatepay.com/v1';
const ABACATE_KEY   = Deno.env.get('ABACATEPAY_KEY') ?? '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')  ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { nome, email, telefone, taxId, valor, ref } = await req.json();

    if (!email || !valor || !taxId) {
      return new Response(JSON.stringify({ error: 'email, cpf e valor são obrigatórios' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const origin    = req.headers.get('origin') || 'https://receitasx.vercel.app';
    const cpfDigits = String(taxId).replace(/\D/g, '');

    // Monta customer — cellphone só enviado se informado
    const customer: Record<string, string> = {
      name:  nome || email.split('@')[0],
      email,
      taxId: cpfDigits,
    };
    if (telefone && String(telefone).trim()) {
      const tel = String(telefone).replace(/\D/g, '');
      customer.cellphone = tel.startsWith('55') ? `+${tel}` : `+55${tel}`;
    }

    const body = {
      frequency: 'ONE_TIME',
      methods:   ['PIX'],
      products: [
        {
          externalId: `RX-${Date.now()}`,
          name:       'ReceitasX - Acesso Vitalicio',
          quantity:   1,
          price:      Math.round(Number(valor) * 100),
        },
      ],
      returnUrl:     `${origin}/acesso-vitalicio.html`,
      completionUrl: `${origin}/checkout.html?sucesso=1${ref ? `&ref=${ref}` : ''}`,
      customer,
      metadata: {
        email,
        ref:   ref || '',
        valor: String(valor),
      },
    };

    console.log('Key ok:', !!ABACATE_KEY, '| body:', JSON.stringify(body));

    const resp = await fetch(`${ABACATE_API}/billing/create`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    console.log('AbacatePay', resp.status, text);

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      const errMsg = (data?.error as string) || (data?.message as string) || text;
      return new Response(JSON.stringify({ error: errMsg, debug: data }), {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // v1 pode retornar { url } direto OU { data: { url } }
    const inner     = (data?.data as Record<string, unknown>) ?? {};
    const url       = (data?.url ?? inner?.url) as string | undefined;
    const billingId = (data?.id  ?? inner?.id)  as string | undefined;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL não retornada', debug: data }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Atualiza completionUrl para incluir o billingId (usado como fallback se webhook falhar)
    // Nota: o body já foi enviado para AbacatePay — o billingId é incluído na resposta ao frontend
    // O frontend usará billing=ID na URL de retorno via completionUrl já configurada abaixo:


    // ── Se veio com código de afiliado, registra indicação pendente ──
    if (ref) {
      try {
        const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

        const { data: af } = await sb
          .from('afiliados')
          .select('id')
          .eq('codigo', String(ref).toUpperCase())
          .single();

        if (af) {
          // Verifica se já existe indicação pendente para esse email+afiliado
          const { data: existing } = await sb
            .from('indicacoes')
            .select('id')
            .eq('afiliado_id', af.id)
            .eq('indicado_email', email)
            .eq('converteu', false)
            .maybeSingle();

          if (!existing) {
            await sb.from('indicacoes').insert({
              afiliado_id:    af.id,
              indicado_email: email,
              converteu:      false,
            });
            console.log(`Indicação pendente criada para afiliado ${ref} → ${email}`);
          }
        }
      } catch (e) {
        console.error('Erro ao registrar indicação pendente:', e);
        // Não bloqueia o fluxo principal
      }
    }

    // ── Registra pedido pendente no Supabase ─────────────────────────
    try {
      const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
      const billingId = (data?.id ?? inner?.id) as string || '';

      // Tenta achar user_id pelo email
      let userId: string | null = null;
      try {
        const { data: usersData } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
        const found = (usersData as { users: {email:string;id:string}[] })?.users?.find(u => u.email === email);
        userId = found?.id ?? null;
      } catch(_) {}

      await sbAdmin.from('pedidos').insert({
        email,
        valor_pago:    valor,
        metodo_pag:    'pix',
        status:        'pendente',
        billing_id:    billingId,
        codigo_acesso: 'RX-PENDENTE',
        ...(userId ? { user_id: userId } : {}),
      });
      console.log(`Pedido pendente registrado: ${email} | billing: ${billingId}`);
    } catch(e) {
      console.error('Erro ao registrar pedido pendente:', e);
      // Não bloqueia o retorno
    }

    return new Response(JSON.stringify({ url, id: data?.id ?? inner?.id }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
