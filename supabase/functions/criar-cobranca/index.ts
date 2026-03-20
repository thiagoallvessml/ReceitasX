import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const ABACATE_API = 'https://api.abacatepay.com/v1';
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

    const origin = req.headers.get('origin') || 'https://receitasx.vercel.app';

    // customer — cellphone só se informado, taxId somente dígitos
    const cpfDigits = String(taxId).replace(/\D/g, '');
    const customer: Record<string, string> = {
      name:  nome || email.split('@')[0],
      email,
      taxId: cpfDigits,
    };
    if (telefone && telefone.trim()) {
      // Formata para +55XXXXXXXXXXX
      const tel = telefone.replace(/\D/g, '');
      customer.cellphone = tel.startsWith('55') ? `+${tel}` : `+55${tel}`;
    }

    const body = {
      frequency: 'ONE_TIME',
      methods:   ['PIX'],
      products: [
        {
          externalId: `ACESSO-VITALICIO-${Date.now()}`, // único por chamada
          name:       'ReceitasX - Acesso Vitalicio',
          quantity:   1,
          price:      Math.round(Number(valor) * 100),
        },
      ],
      returnUrl:    `${origin}/acesso-vitalicio.html`,
      completionUrl:`${origin}/checkout.html?sucesso=1${ref ? `&ref=${ref}` : ''}`,
      customer,
    };

    console.log('Key presente:', ABACATE_KEY ? 'sim' : 'NÃO');
    console.log('Body:', JSON.stringify(body));

    const resp = await fetch(`${ABACATE_API}/billing/create`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    console.log('AbacatePay status:', resp.status, '| body:', text);

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      const errMsg = (data?.error as string) || (data?.message as string) || text;
      return new Response(JSON.stringify({ error: errMsg, debug: data }), {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: data.url, id: data.id }), {
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

