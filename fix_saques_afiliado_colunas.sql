-- Garante que a tabela saques_afiliado tem as colunas email, pix_tipo e pix_chave
-- Execute no Supabase Dashboard > SQL Editor

ALTER TABLE saques_afiliado
    ADD COLUMN IF NOT EXISTS email     text,
    ADD COLUMN IF NOT EXISTS pix_tipo  text,
    ADD COLUMN IF NOT EXISTS pix_chave text;
