-- 1. Corrige o valor e comissão nas indicações registradas (10% de 49,90 = 4,99)
UPDATE indicacoes
SET valor_pago = 49.90,
    comissao = 4.99
WHERE indicado_email IN (
  'lucienemariasoaresmarques84@gmail.com', 
  'santos.beatriz.lais@gmail.com', 
  'anacecilianascimento.ueap@gmail.com'
);

-- 2. Corrige o saldo total do afiliado DOCECONE10
-- Foi adicionado 9.70 por venda (3x = 29.10), mas o certo é 4.99 (3x = 14.97)
-- Diferença a ser subtraída: 29.10 - 14.97 = 14.13
UPDATE afiliados
SET total_ganhos = total_ganhos - 14.13
WHERE codigo = 'DOCECONE10';

-- 3. Garante que na tabela de pedidos o cupom está registrado corretamente como DOCECONE10
UPDATE pedidos
SET cupom_usado = 'DOCECONE10'
WHERE email IN (
  'lucienemariasoaresmarques84@gmail.com', 
  'santos.beatriz.lais@gmail.com', 
  'anacecilianascimento.ueap@gmail.com'
);
