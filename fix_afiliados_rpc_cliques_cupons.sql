-- ══════════════════════════════════════════════════════════════════
-- Funções SECURITY DEFINER para incrementar cliques e cupons
-- de afiliados sem expor UPDATE direto na tabela ao público.
-- Execute no Supabase: Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Registra clique via link (?ref=CODIGO)
CREATE OR REPLACE FUNCTION registrar_clique_afiliado(p_codigo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE afiliados
  SET total_cliques = COALESCE(total_cliques, 0) + 1
  WHERE codigo = UPPER(p_codigo);
END;
$$;

-- 2. Registra uso de cupom digitado manualmente
CREATE OR REPLACE FUNCTION registrar_cupom_afiliado(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE afiliados
  SET total_cupons = COALESCE(total_cupons, 0) + 1
  WHERE id = p_id;
END;
$$;

-- Garante que usuários anônimos e autenticados possam chamar as funções
GRANT EXECUTE ON FUNCTION registrar_clique_afiliado(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION registrar_cupom_afiliado(uuid)  TO anon, authenticated;
