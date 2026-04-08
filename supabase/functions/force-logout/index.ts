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
    const userToken  = authHeader.replace('Bearer ', '').trim();

    if (!userToken || userToken === 'undefined') {
      return new Response(JSON.stringify({ error: 'Token inválido ou ausente no header' }), { status: 401, headers: CORS });
    }

    // Cliente para validar o usuário que está chamando
    const sbUser = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    // Validar usuário
    const { data: { user }, error: authError } = await sbUser.auth.getUser(userToken);
    
    if (authError || !user) {
      console.error('Auth verify error:', authError);
      return new Response(JSON.stringify({ 
        error: `Erro de autenticação (JWT): ${authError?.message || 'Incapaz de obter usuário'}` 
      }), { status: 401, headers: CORS });
    }

    // Cliente Admin para operações e verificação de perfil
    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Verificar se o chamador é admin na tabela perfis
    const { data: perfil, error: perfilError } = await sbAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (perfilError) {
      return new Response(JSON.stringify({ error: 'Erro ao verificar perfil' }), { status: 500, headers: CORS });
    }

    if (perfil?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado: Requer nível Admin' }), { status: 403, headers: CORS });
    }

    // Ler body
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'ID do usuário alvo não fornecido' }), { status: 400, headers: CORS });
    }

    // Invalidar todas as sessões via ban temporário (1 segundo) + unban
    // Isso revoga todos os refresh tokens do usuário imediatamente
    const { error: banError } = await sbAdmin.auth.admin.updateUserById(user_id, {
      ban_duration: '1s',
    });

    if (banError) {
      console.error('Ban Error:', banError);
      return new Response(JSON.stringify({ error: `Erro ao invalidar sessões: ${banError.message}` }), { status: 500, headers: CORS });
    }

    // Desbanir imediatamente para que o usuário possa fazer login novamente
    const { error: unbanError } = await sbAdmin.auth.admin.updateUserById(user_id, {
      ban_duration: 'none',
    });

    if (unbanError) {
      console.error('Unban Error:', unbanError);
      // Sessões já foram invalidadas, mas avisa que o unban falhou
      return new Response(JSON.stringify({ error: `Sessões invalidadas, mas erro ao desbanir: ${unbanError.message}` }), { status: 500, headers: CORS });
    }

    return new Response(JSON.stringify({ success: true, message: 'Todas as sessões do usuário foram invalidadas.' }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unexpected error in force-logout:', err);
    return new Response(JSON.stringify({ error: `Erro inesperado: ${err.message}` }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
