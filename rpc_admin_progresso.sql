DROP FUNCTION IF EXISTS admin_progresso_guia();

CREATE OR REPLACE FUNCTION admin_progresso_guia()
RETURNS TABLE (
  user_id UUID,
  qtd_configuracoes BIGINT,
  qtd_equipamentos BIGINT,
  qtd_insumos BIGINT,
  qtd_embalagens BIGINT,
  qtd_receitas BIGINT,
  qtd_produtos BIGINT,
  qtd_combos BIGINT,
  qtd_despesas BIGINT,
  qtd_precificacao BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id as user_id,
    (SELECT count(*) FROM configuracoes c WHERE c.user_id = p.id) as qtd_configuracoes,
    (SELECT count(*) FROM equipamentos e WHERE e.user_id = p.id) as qtd_equipamentos,
    (SELECT count(*) FROM insumos i WHERE i.user_id = p.id) as qtd_insumos,
    (SELECT count(*) FROM embalagens emb WHERE emb.user_id = p.id) as qtd_embalagens,
    (SELECT count(*) FROM receitas r WHERE r.user_id = p.id) as qtd_receitas,
    (SELECT count(*) FROM produtos pr WHERE pr.user_id = p.id) as qtd_produtos,
    (SELECT count(*) FROM combos cb WHERE cb.user_id = p.id) as qtd_combos,
    (SELECT count(*) FROM despesas d WHERE d.user_id = p.id) as qtd_despesas,
    (SELECT count(*) FROM precificacao prec WHERE prec.user_id = p.id) as qtd_precificacao
  FROM perfis p
  ORDER BY p.created_at DESC;
$$;
