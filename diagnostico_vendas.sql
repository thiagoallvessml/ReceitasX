-- ================================================================
-- ReceitasX · DIAGNÓSTICO: Verificar vendas de hoje
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Ver TODOS os pedidos de hoje (independente de status)
SELECT 
  id, 
  email, 
  user_id, 
  valor_pago, 
  status, 
  codigo_acesso, 
  billing_id,
  created_at
FROM pedidos
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- 2. Verificar se o perfil do comprador foi atualizado
SELECT 
  p.id,
  p.nome,
  p.sobrenome,
  p.plano,
  p.plano_ativo_em,
  p.role,
  p.created_at
FROM perfis p
WHERE p.plano = 'vitalicio'
ORDER BY p.plano_ativo_em DESC NULLS LAST
LIMIT 20;

-- 3. TODOS os pedidos pagos (para ver histórico completo)
SELECT 
  id, 
  email, 
  user_id, 
  valor_pago, 
  status, 
  billing_id,
  created_at
FROM pedidos
WHERE status = 'pago'
ORDER BY created_at DESC
LIMIT 20;
