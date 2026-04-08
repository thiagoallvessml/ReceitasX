import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')  ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: CORS });
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    const userToken  = authHeader.replace('Bearer ', '');

    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Token não fornecido' }), { status: 401, headers: CORS });
    }

    // Valida o chamador e confirma que é admin
    const sbUser = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    const { data: { user }, error: authError } = await sbUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: CORS });
    }

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

    const { data: perfil, error: perfilError } = await sbAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (perfilError) {
      console.error('Perfil error:', perfilError);
      return new Response(JSON.stringify({ error: 'Erro ao verificar permissão' }), { status: 500, headers: CORS });
    }

    if (perfil?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado — não é admin' }), { status: 403, headers: CORS });
    }

    // Lê o user_id alvo do body
    let body: { user_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body JSON inválido' }), { status: 400, headers: CORS });
    }

    const targetUserId = body?.user_id;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'user_id é obrigatório' }), { status: 400, headers: CORS });
    }

    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Não é possível forçar o próprio logout' }), { status: 400, headers: CORS });
    }

    // Usa a Admin REST API do Supabase Auth diretamente para revogar todas as sessões
    const signOutResp = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${targetUserId}/logout`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scope: 'global' }),
      }
    );

    if (!signOutResp.ok) {
      const errText = await signOutResp.text();
      console.error('signOut REST error:', signOutResp.status, errText);
      return new Response(
        JSON.stringify({ error: `Erro ao revogar sessões (HTTP ${signOutResp.status}): ${errText}` }),
        { status: 500, headers: CORS }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('force-logout error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
