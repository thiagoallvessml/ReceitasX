-- 1. Garante que o cupom DOCECONE10 existe
INSERT INTO cupons (codigo, tipo, valor, ativo, usos_atual, usos_max, cliques)
VALUES ('DOCECONE10', '%', 10, true, 0, null, 0)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Atualiza os pedidos existentes desses emails (se eles já compraram)
UPDATE pedidos 
SET cupom_usado = 'DOCECONE10' 
WHERE email IN (
  'lucienemariasoaresmarques84@gmail.com', 
  'santos.beatriz.lais@gmail.com', 
  'anacecilianascimento.ueap@gmail.com'
);

-- 3. Insere pedidos "fantasma" caso os emails ainda não existam na tabela de pedidos
INSERT INTO pedidos (email, cupom_usado, status, valor_pago)
SELECT e, 'DOCECONE10', 'pago', 97.00
FROM (VALUES 
  ('lucienemariasoaresmarques84@gmail.com'),
  ('santos.beatriz.lais@gmail.com'),
  ('anacecilianascimento.ueap@gmail.com')
) AS v(e)
WHERE NOT EXISTS (
  SELECT 1 FROM pedidos p WHERE p.email = v.e
);

-- 4. Atualiza a contagem de usos do cupom
UPDATE cupons 
SET usos_atual = (
  SELECT count(*) FROM pedidos WHERE cupom_usado = 'DOCECONE10'
)
WHERE codigo = 'DOCECONE10';
