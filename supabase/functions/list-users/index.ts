import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')  ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    // Verifica se o chamador é admin via token JWT
    const authHeader = req.headers.get('authorization') || '';
    const userToken  = authHeader.replace('Bearer ', '').trim();

    if (!userToken || userToken === 'undefined') {
      return new Response(JSON.stringify({ error: 'Token não fornecido' }), { status: 401, headers: CORS });
    }

    const sbUser = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    // Confirma que é admin
    const { data: { user }, error: authError } = await sbUser.auth.getUser(userToken);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: CORS });
    }

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

    const { data: perfil } = await sbAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: CORS });
    }

    // Lista todos os usuários
    const { data: usersData } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
    const users = (usersData?.users || []).map((u: { id: string; email: string; created_at: string; last_sign_in_at?: string }) => ({
      id:         u.id,
      email:      u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('list-users error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
