-- ═══════════════════════════════════════════════════════════════
-- ReceitasX · Admin: Produtos vinculados a receitas
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_produtos_vinculados()
RETURNS TABLE (
  user_id UUID,
  produto_id BIGINT,
  produto_nome TEXT,
  produto_preco NUMERIC,
  produto_custo NUMERIC,
  receita_id BIGINT,
  receita_nome TEXT,
  receita_custo_total NUMERIC,
  receita_unidades INTEGER,
  produto_created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.user_id,
    p.id as produto_id,
    p.nome as produto_nome,
    p.preco as produto_preco,
    p.custo as produto_custo,
    p.receita_id,
    r.nome as receita_nome,
    r.custo_total as receita_custo_total,
    r.unidades as receita_unidades,
    p.created_at as produto_created_at
  FROM produtos p
  INNER JOIN receitas r ON r.id = p.receita_id
  WHERE p.receita_id IS NOT NULL
  ORDER BY p.created_at DESC;
$$;
