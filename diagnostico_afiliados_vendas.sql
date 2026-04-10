SELECT id, codigo, total_ganhos, total_vendas, total_cupons
FROM public.afiliados
WHERE total_vendas > 0 OR total_ganhos > 0;
