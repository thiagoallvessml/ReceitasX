-- ================================================================
-- ReceitasX · Re-Sincronizador de Saldos de Afiliados
-- Varre a tabela de "indicacoes" (que tem as vendas que converteram)
-- e recalcula matematicamente o "total_ganhos" e "total_vendas" 
-- da tabela "afiliados", recuperando comissões perdidas pelo erro
-- ================================================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT 
            afiliado_id, 
            COUNT(id) as contas_convertidas,
            SUM(comissao) as soma_comissoes
        FROM public.indicacoes
        WHERE converteu = true
        GROUP BY afiliado_id
    LOOP
        -- Substitui o total de vendas e ganhos pelo valor exato auditado da tabela de indicações
        UPDATE public.afiliados
        SET total_vendas = rec.contas_convertidas,
            total_ganhos = COALESCE(rec.soma_comissoes, 0)
        WHERE id = rec.afiliado_id;
    END LOOP;
END $$;
