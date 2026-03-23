-- ================================================================
-- ReceitasX · FIX: Adicionar campos que faltam na tabela embalagens
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE embalagens
  ADD COLUMN IF NOT EXISTS quantidade INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fornecedor TEXT,
  ADD COLUMN IF NOT EXISTS obs        TEXT;

-- Verificar resultado
SELECT id, nome, quantidade, preco,
       ROUND(preco::NUMERIC / GREATEST(quantidade,1), 4) AS custo_unitario
FROM embalagens
ORDER BY nome;
