-- Atualização do Banco de Dados para Controle de Estoque Principal

-- 1. Adicionar controle de estoque na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque_atual INTEGER NOT NULL DEFAULT 0;

-- 2. Adicionar canal de venda na tabela vendas_clientes
ALTER TABLE vendas_clientes ADD COLUMN IF NOT EXISTS canal_venda TEXT NOT NULL DEFAULT 'Direta';
