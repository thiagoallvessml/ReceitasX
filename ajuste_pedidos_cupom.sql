-- ================================================================
-- ReceitasX · Adicionar coluna cupom_usado na tabela pedidos
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_usado TEXT;

-- Recarregar schema
NOTIFY pgrst, 'reload schema';
