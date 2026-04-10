-- ================================================================
-- ReceitasX · Correção Retroativa de Comissões por Cupom (Afiliados)
-- Adiciona estatísticas e comissões para afiliados cujos cupons de
-- indicação foram usados no checkout sem clique prévio no link.
-- Só processa vendas pagas (status='pago').
--
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

DO $$
DECLARE
    rec RECORD;
    v_afiliado_id public.afiliados.id%TYPE;
    v_comissao NUMERIC(10,2);
BEGIN
    FOR rec IN 
        SELECT p.id, p.email, p.valor_pago, p.cupom_usado, p.created_at
        FROM public.pedidos p
        WHERE p.status = 'pago' 
          AND p.cupom_usado IS NOT NULL 
          AND p.cupom_usado <> ''
    LOOP
        -- Tenta achar se o cupom bate exatamente com o código de um Afiliado
        SELECT a.id INTO v_afiliado_id
        FROM public.afiliados a
        WHERE UPPER(a.codigo) = UPPER(rec.cupom_usado);

        -- Se existe um afiliado correspondente ao cupom, recompensá-lo:
        IF v_afiliado_id IS NOT NULL THEN
            
            -- Calcular a comissão (10% sobre o que a pessoa efetivamente pagou)
            v_comissao := ROUND((rec.valor_pago * 0.10)::numeric, 2);

            -- Verifica se já existe indicação paga para evitar duplicidade
            IF NOT EXISTS (
                SELECT 1 FROM public.indicacoes 
                WHERE afiliado_id = v_afiliado_id 
                  AND indicado_email = rec.email 
                  AND converteu = true
            ) THEN
                -- Insere o relatório de Indicação
                INSERT INTO public.indicacoes (afiliado_id, indicado_email, converteu, valor_pago, comissao, created_at)
                VALUES (v_afiliado_id, rec.email, true, rec.valor_pago, v_comissao, rec.created_at);

                -- Incrementa Vendas e Ganhos Totais na Cadeira do Afiliado
                UPDATE public.afiliados
                SET total_ganhos = COALESCE(total_ganhos, 0) + v_comissao,
                    total_vendas = COALESCE(total_vendas, 0) + 1,
                    total_cupons = COALESCE(total_cupons, 0) + 1
                WHERE id = v_afiliado_id;
            END IF;

        END IF;
    END LOOP;
END $$;
