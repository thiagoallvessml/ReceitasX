-- ====================================================================================
-- Tabela de Quebras e Desperdícios (ReceitasX)
-- ====================================================================================

CREATE TABLE IF NOT EXISTS desperdicios (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_item      TEXT NOT NULL, -- 'insumo', 'receita', 'produto'
  item_id        BIGINT,        -- opcional (se o item foi apagado, mantemos o histórico)
  nome_item      TEXT NOT NULL, 
  quantidade     NUMERIC(10,4) NOT NULL,
  unidade        TEXT,          
  custo_perdido  NUMERIC(10,2) NOT NULL DEFAULT 0, 
  motivo         TEXT,
  data_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE desperdicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desperdicios_self" 
  ON desperdicios 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
