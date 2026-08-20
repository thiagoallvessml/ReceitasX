-- ================================================================
-- ReceitasX · Creditar Vendas e Comissões para DAIANA CELONI (DOCECOLE10)
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Se você souber os e-mails das pessoas que compraram usando o cupom DOCECOLE10:
-- Exemplo: 6 vendas com comissão de 10% (R$ 4,69 cada sobre R$ 46,90 ou R$ 4,99 sobre R$ 49,90)

-- 2. Atualizar diretamente o saldo e vendas na tabela de afiliados:
-- (Ajuste o número de vendas e o valor total de ganhos conforme o faturamento real)
UPDATE public.afiliados
SET 
    total_vendas = 6,              -- Quantidade de vendas confirmadas
    total_ganhos = 28.14           -- Exemplo: 6 x R$ 4,69 = R$ 28,14 (ou ajuste para o valor correto)
WHERE codigo = 'DOCECOLE10';

-- 3. Confirmar a atualização:
SELECT id, codigo, email, total_cliques, total_cupons, total_vendas, total_ganhos
FROM public.afiliados
WHERE codigo = 'DOCECOLE10';
