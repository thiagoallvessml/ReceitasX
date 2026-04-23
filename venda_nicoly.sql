-- 1. Corrige o pedido adicionando a tag de afiliado
UPDATE pedidos 
SET ref_afiliado = 'DOCECONE10' 
WHERE email = 'nicolyemilly97@gmail.com';

-- 2. Registra a indicação e comissão do afiliado (10% de 44,91 = 4,49)
INSERT INTO indicacoes (afiliado_id, indicado_email, converteu, valor_pago, comissao)
SELECT id, 'nicolyemilly97@gmail.com', true, 44.91, 4.49
FROM afiliados WHERE codigo = 'DOCECONE10'
-- Evita duplicidade caso rode duas vezes sem querer
AND NOT EXISTS (
    SELECT 1 FROM indicacoes 
    WHERE indicado_email = 'nicolyemilly97@gmail.com' 
    AND afiliado_id = afiliados.id
);

-- 3. Soma +1 venda e o valor da comissão no painel do afiliado
UPDATE afiliados
SET total_ganhos = total_ganhos + 4.49,
    total_vendas = total_vendas + 1
WHERE codigo = 'DOCECONE10';
