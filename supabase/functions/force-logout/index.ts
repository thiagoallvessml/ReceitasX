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
    // Verifica se o chamador é admin via token JWT
    const authHeader = req.headers.get('authorization') || '';
    const userToken  = authHeader.replace('Bearer ', '');

    const sbUser = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    const { data: { user } } = await sbUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: CORS });
    }

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

    // Confirma que o chamador é admin
    const { data: perfil } = await sbAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: CORS });
    }

    // Lê o user_id alvo do body
    const body = await req.json();
    const targetUserId = body?.user_id;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'user_id é obrigatório' }), { status: 400, headers: CORS });
    }

    // Não permite o admin forçar o próprio logout
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Você não pode forçar o próprio logout' }), { status: 400, headers: CORS });
    }

    // Revoga todas as sessões do usuário alvo
    const { error: signOutError } = await sbAdmin.auth.admin.signOut(targetUserId, 'global');

    if (signOutError) {
      return new Response(JSON.stringify({ error: signOutError.message }), { status: 500, headers: CORS });
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
