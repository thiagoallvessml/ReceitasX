import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const ABACATE_API = 'https://api.abacatepay.com/v1';
const ABACATE_KEY = Deno.env.get('ABACATEPAY_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { nome, email, telefone, valor, ref } = await req.json();

    if (!email || !valor) {
      return new Response(JSON.stringify({ error: 'email e valor são obrigatórios' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') || 'https://receitasx.vercel.app';
    const returnUrl = `${origin}/acesso-vitalicio.html`;
    const completionUrl = `${origin}/checkout.html?sucesso=1${ref ? `&ref=${ref}` : ''}`;

    const body = {
      frequency:     'ONE_TIME',
      methods:       ['PIX'],
      products: [
        {
          externalId: 'ACESSO-VITALICIO',
          name:       'ReceitasX — Acesso Vitalício',
          quantity:   1,
          price:      Math.round(valor * 100), // centavos
        },
      ],
      returnUrl,
      completionUrl,
      customer: {
        name:      nome || email.split('@')[0],
        email,
        cellphone: telefone || '',
      },
    };

    const resp = await fetch(`${ABACATE_API}/billing/create`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('AbacatePay error:', data);
      return new Response(JSON.stringify({ error: data?.error || 'Erro ao gerar cobrança' }), {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: data.url, id: data.id }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
