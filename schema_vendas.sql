-- Tabela para os clientes (confeiteiros) registrarem suas próprias vendas de doces/bolos com múltiplos itens

-- Primeiro apagamos a tabela antiga caso você já tenha criado (pois a estrutura mudou)
DROP TABLE IF EXISTS vendas_clientes CASCADE;

CREATE TABLE vendas_clientes (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- "itens" vai guardar a lista de todos os produtos/receitas vendidos de uma vez
  -- Formato esperado: [{"nome":"Bolo","quantidade":2,"preco_unitario":10.50,"total":21.00}]
  itens           JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  valor_total     NUMERIC(10,4) NOT NULL DEFAULT 0,
  data_venda      DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  
  -- Para quando for dinheiro
  valor_recebido  NUMERIC(10,4),
  troco           NUMERIC(10,4),
  
  cliente_nome    TEXT,
  obs             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar segurança
ALTER TABLE vendas_clientes ENABLE ROW LEVEL SECURITY;

-- O usuário só pode ver, inserir, atualizar e deletar suas próprias vendas
CREATE POLICY "vendas_clientes_self" ON vendas_clientes 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Admin pode VER TODAS as vendas (necessário para admin-vendas-clientes.html)
CREATE POLICY "vendas_clientes_admin_read" ON vendas_clientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid() AND role = 'admin'
  )
);
