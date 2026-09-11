-- Tabela para registrar o histórico de entradas e ajustes manuais de estoque das receitas
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receita_id BIGINT NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'entrada', -- 'entrada', 'ajuste_negativo'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_movimentacoes_self" ON estoque_movimentacoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
