CREATE TABLE IF NOT EXISTS consignados_fechamentos (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parceiro_id     BIGINT NOT NULL REFERENCES consignados_parceiros(id) ON DELETE CASCADE,
  qtd_itens       INTEGER NOT NULL DEFAULT 0,
  valor_recebido  NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE consignados_fechamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consignados_fechamentos_self" ON consignados_fechamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE consignados_vendas ADD COLUMN IF NOT EXISTS fechamento_id BIGINT REFERENCES consignados_fechamentos(id) ON DELETE SET NULL;
