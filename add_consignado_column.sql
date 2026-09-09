-- 1. Acesse o painel do Supabase
-- 2. Vá em "SQL Editor"
-- 3. Cole o código abaixo e clique em "Run"

ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS consignado NUMERIC(5,2) DEFAULT 0;
