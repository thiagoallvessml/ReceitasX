import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const ABACATE_API = 'https://api.abacatepay.com/v2';
const ABACATE_KEY = Deno.env.get('ABACATEPAY_KEY') ?? '';

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

    // Formata telefone para +55XXXXXXXXXXX
    let cellphone = '';
    if (telefone && String(telefone).trim()) {
      const tel = String(telefone).replace(/\D/g, '');
      cellphone = tel.startsWith('55') ? `+${tel}` : `+55${tel}`;
    }

    // ── Passo 1: criar/buscar customer ──────────────────────────────
    const custResp = await fetch(`${ABACATE_API}/customers/create`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        name:      nome || email.split('@')[0],
        email,
        taxId:     cpfDigits,
        cellphone: cellphone || undefined,
      }),
    });

    const custText = await custResp.text();
    console.log('Customer resp:', custResp.status, custText);

    let custData: Record<string, unknown>;
    try { custData = JSON.parse(custText); } catch { custData = {}; }

    // Aceita 200 ou 409 (já existe) — em ambos temos o customer
    const customerId = (custData?.data as Record<string, unknown>)?.id as string | undefined;

    // ── Passo 2: criar checkout ──────────────────────────────────────
    const checkoutBody: Record<string, unknown> = {
      methods:       ['PIX'],
      returnUrl:     `${origin}/acesso-vitalicio.html`,
      completionUrl: `${origin}/checkout.html?sucesso=1${ref ? `&ref=${ref}` : ''}`,
      externalId:    `RX-${Date.now()}`,
      items: [
        {
          id:       'acesso-vitalicio',
          quantity: 1,
          externalId: `RX-${Date.now()}`,
          name:     'ReceitasX - Acesso Vitalicio',
          price:    Math.round(Number(valor) * 100),
          description: 'Acesso vitalicio ao ReceitasX',
        },
      ],
    };
    if (customerId) checkoutBody.customerId = customerId;

    console.log('Key:', ABACATE_KEY ? 'ok' : 'AUSENTE');
    console.log('Checkout body:', JSON.stringify(checkoutBody));

    const resp = await fetch(`${ABACATE_API}/checkouts/create`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(checkoutBody),
    });

    const text = await resp.text();
    console.log('Checkout resp:', resp.status, text);

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      const errMsg = (data?.error as string) || (data?.message as string) || text;
      return new Response(JSON.stringify({ error: errMsg, debug: data }), {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // v2 retorna { data: { url, id, ... } }
    const checkoutData = (data?.data as Record<string, unknown>) || data;
    const url = checkoutData?.url as string;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL de pagamento não retornada', debug: data }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url, id: checkoutData?.id }), {
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


