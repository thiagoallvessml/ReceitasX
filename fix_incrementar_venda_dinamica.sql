-- Cria a nova versão da função de ganho de afiliados, que aceita 
-- a comissão já processada dinamicamente pelo Edge Function.

CREATE OR REPLACE FUNCTION incrementar_venda_afiliado_v2(
  p_afiliado_id UUID,
  p_comissao    NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE afiliados
  SET total_ganhos = COALESCE(total_ganhos, 0) + p_comissao,
      total_vendas = COALESCE(total_vendas, 0) + 1
  WHERE id = p_afiliado_id;
END;
$$;

GRANT EXECUTE ON FUNCTION incrementar_venda_afiliado_v2(UUID, numeric) TO authenticated, anon;
