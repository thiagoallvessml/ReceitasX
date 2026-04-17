-- Adiciona coluna de cliques aos cupons
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS cliques INTEGER DEFAULT 0;

-- Cria função para incrementar o clique via link
CREATE OR REPLACE FUNCTION incrementar_clique_cupom(p_codigo TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cupons
  SET cliques = COALESCE(cliques, 0) + 1
  WHERE codigo = UPPER(p_codigo);
END;
$$;

GRANT EXECUTE ON FUNCTION incrementar_clique_cupom(TEXT) TO anon, authenticated;
