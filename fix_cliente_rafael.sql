-- Inserir o perfil caso não exista (por precaução)
INSERT INTO perfis (id, nome)
VALUES (
  'aae0293b-9cea-488f-b5f3-71fcdd8882d4', 
  'Rafael Henrique da Silva'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir o afiliado
INSERT INTO afiliados (id, user_id, email, codigo, total_ganhos, total_vendas, total_cliques)
VALUES (
  'aae0293b-9cea-488f-b5f3-71fcdd8882d4',
  'aae0293b-9cea-488f-b5f3-71fcdd8882d4',
  'rafael_contatos02@outlook.com',
  -- Tenta usar a função de gerar código, se não existir cria um manualmente com o início do ID
  COALESCE(
    (SELECT gerar_codigo_afiliado('rafael_contatos02@outlook.com', 'aae0293b-9cea-488f-b5f3-71fcdd8882d4')),
    'RAFAEL' || upper(substring(md5(random()::text), 1, 4))
  ),
  0, 0, 0
)
ON CONFLICT (id) DO NOTHING;
