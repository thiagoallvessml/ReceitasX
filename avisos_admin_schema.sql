-- ═══════════════════════════════════════════════════════════════
-- ReceitasX · Avisos do Admin (mensagens ao entrar no sistema)
-- Execute este script no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabela de avisos
CREATE TABLE IF NOT EXISTS avisos_admin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    imagem_url TEXT,
    tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'aviso', 'urgente', 'novidade')),
    destino TEXT DEFAULT 'todos' CHECK (destino IN ('todos', 'usuario')),
    destino_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabela para rastrear quais avisos cada usuário já viu
CREATE TABLE IF NOT EXISTS avisos_vistos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aviso_id UUID NOT NULL REFERENCES avisos_admin(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visto_em TIMESTAMPTZ DEFAULT now(),
    UNIQUE(aviso_id, user_id)
);

-- 3. RLS: Todos podem ler avisos ativos, só admin insere/atualiza
ALTER TABLE avisos_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler avisos ativos"
    ON avisos_admin FOR SELECT
    USING (ativo = true);

CREATE POLICY "Admin pode tudo em avisos"
    ON avisos_admin FOR ALL
    USING (
        EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. RLS para avisos_vistos
ALTER TABLE avisos_vistos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ler seus avisos vistos"
    ON avisos_vistos FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Usuário pode marcar aviso como visto"
    ON avisos_vistos FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin pode ver todos avisos vistos"
    ON avisos_vistos FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_avisos_admin_ativo ON avisos_admin(ativo);
CREATE INDEX IF NOT EXISTS idx_avisos_admin_destino ON avisos_admin(destino, destino_user_id);
CREATE INDEX IF NOT EXISTS idx_avisos_vistos_user ON avisos_vistos(user_id);
CREATE INDEX IF NOT EXISTS idx_avisos_vistos_aviso ON avisos_vistos(aviso_id);

-- 6. Permitir que qualquer usuário autenticado desative um aviso (set ativo=false)
CREATE POLICY "Usuário pode desativar aviso"
    ON avisos_admin FOR UPDATE
    USING (ativo = true)
    WITH CHECK (ativo = false);
