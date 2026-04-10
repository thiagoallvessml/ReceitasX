-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Otimização de Performance e Redução de Uso de I/O de Disco
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════
-- ESTE SCRIPT CRIA ÍNDICES PARA ACELERAR CONSULTAS E REDUZIR A CARGA DO DISCO.
-- ATENÇÃO: EM TABELAS MUITO GRANDES PODE DEMORAR ALGUNS SEGUNDOS PARA EXECUTAR.

-- 1. Indexando buscas pelo ID do usuário (extremamente crucial para as políticas RLS)
CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON pedidos(user_id);
CREATE INDEX IF NOT EXISTS idx_insumos_user_id ON insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_receitas_user_id ON receitas(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_embalagens_user_id ON embalagens(user_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_user_id ON equipamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON despesas(user_id);

-- 2. Índices para performance das consultas do módulo de afiliados e financeiro
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cupom_usado ON pedidos(cupom_usado);
CREATE INDEX IF NOT EXISTS idx_cliques_afiliados_codigo ON cliques_afiliados(afiliado_codigo);
CREATE INDEX IF NOT EXISTS idx_cliques_afiliados_created_at ON cliques_afiliados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avisos_vistos_user_id ON avisos_vistos(user_id);
CREATE INDEX IF NOT EXISTS idx_avisos_admin_ativo ON avisos_admin(ativo);


-- 4. Otimizar Performance do Auth e de Presença
CREATE INDEX IF NOT EXISTS idx_perfis_role ON perfis(role);
CREATE INDEX IF NOT EXISTS idx_perfis_plano ON perfis(plano);

-- Execute este comando abaixo (VACUUM ANALYZE) após criar os índices
-- para atualizar as estatísticas do Postgres e liberar espaço no disco
VACUUM ANALYZE;
