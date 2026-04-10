-- Corrigindo o erro de tipo UUID x BIGINT da função de webhook
-- Para que as vendas computem corretamente os ganhos no afiliado!

DROP FUNCTION IF EXISTS incrementar_venda_afiliado(bigint, numeric);

CREATE OR REPLACE FUNCTION incrementar_venda_afiliado(
  p_afiliado_id UUID,
  p_valor       NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE afiliados
  SET total_ganhos = COALESCE(total_ganhos, 0) + ROUND(p_valor * 0.10, 2),
      total_vendas = COALESCE(total_vendas, 0) + 1
  WHERE id = p_afiliado_id;
END;
$$;

GRANT EXECUTE ON FUNCTION incrementar_venda_afiliado(UUID, numeric) TO authenticated, anon;
