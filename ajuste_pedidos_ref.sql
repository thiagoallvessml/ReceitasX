-- ================================================================
-- ReceitasX · Adicionar coluna ref_afiliado na tabela pedidos
-- Para garantir que o webhook sempre saiba qual afiliado indicou
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ref_afiliado TEXT;

-- Atualizar o pedido de hoje que já sabemos ser do DOCECONE10
UPDATE pedidos SET ref_afiliado = 'DOCECONE10' WHERE id = 11;

NOTIFY pgrst, 'reload schema';
