-- ================================================================
-- ReceitasX · RPC: Ativar plano vitalício de forma garantida
-- SECURITY DEFINER = roda com permissão TOTAL (ignora RLS)
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Criar a função RPC que ativa o plano
CREATE OR REPLACE FUNCTION ativar_plano_vitalicio(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE perfis
  SET plano = 'vitalicio',
      plano_ativo_em = NOW()
  WHERE id = p_user_id;

  -- Log para debug (visível nos logs do Supabase)
  RAISE NOTICE 'Plano vitalicio ativado para user %', p_user_id;
END;
$$;

-- 2. Dar permissão de execução para authenticated e service_role
GRANT EXECUTE ON FUNCTION ativar_plano_vitalicio(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ativar_plano_vitalicio(UUID) TO service_role;

-- 3. Corrigir venda de hoje que não foi ativada
UPDATE perfis
SET plano = 'vitalicio',
    plano_ativo_em = '2026-04-05T19:23:31Z'
WHERE id = '5629a15a-1d94-492b-910b-3f9dc87173c8'
  AND plano != 'vitalicio';

-- 4. Verificar que todos os pedidos pagos têm perfil ativado
-- (corrige qualquer outro caso que possa ter passado)
UPDATE perfis
SET plano = 'vitalicio',
    plano_ativo_em = COALESCE(plano_ativo_em, NOW())
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM pedidos 
  WHERE status = 'pago' 
    AND user_id IS NOT NULL
)
AND plano != 'vitalicio';

-- 5. Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
