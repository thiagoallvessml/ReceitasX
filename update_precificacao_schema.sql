-- Atualiza o schema para suportar IDs em texto (ex: 'casa', 'ifood', 'mkt_123') e precos de combos

ALTER TABLE precificacao DROP CONSTRAINT IF EXISTS precificacao_marketplace_id_fkey;
ALTER TABLE marketplaces DROP CONSTRAINT IF EXISTS marketplaces_pkey CASCADE;

ALTER TABLE marketplaces ALTER COLUMN id DROP DEFAULT;
ALTER TABLE marketplaces ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE marketplaces ADD PRIMARY KEY (id);

ALTER TABLE precificacao ALTER COLUMN marketplace_id TYPE TEXT USING marketplace_id::text;
ALTER TABLE precificacao ADD CONSTRAINT precificacao_marketplace_id_fkey FOREIGN KEY (marketplace_id) REFERENCES marketplaces(id) ON DELETE CASCADE;

ALTER TABLE precificacao ALTER COLUMN produto_id DROP NOT NULL;
ALTER TABLE precificacao ADD COLUMN IF NOT EXISTS combo_id BIGINT REFERENCES combos(id) ON DELETE CASCADE;
