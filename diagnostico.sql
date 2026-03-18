-- ================================================================
-- ReceitasX · DIAGNÓSTICO — Execute primeiro para ver o estado atual
-- ================================================================

-- Quais tabelas de afiliados existem?
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('afiliados','indicacoes','saques_afiliado','perfis')
ORDER BY table_name;

-- Colunas da tabela afiliados (se existir)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'afiliados'
ORDER BY ordinal_position;

-- Colunas da tabela saques_afiliado (se existir)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saques_afiliado'
ORDER BY ordinal_position;

-- Colunas da tabela perfis (verificar se 'role' existe)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'perfis'
ORDER BY ordinal_position;

-- Funções existentes
SELECT proname FROM pg_proc
WHERE proname IN ('get_my_role','incrementar_venda_afiliado','registrar_clique_afiliado');

-- Policies existentes
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('afiliados','indicacoes','saques_afiliado')
ORDER BY tablename, policyname;
