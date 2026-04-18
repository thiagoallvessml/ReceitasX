-- ================================================================
-- ReceitasX · Tabela: feedbacks
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS feedbacks (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo       TEXT NOT NULL CHECK (tipo IN ('duvida','sugestao','elogio','bug')),
    mensagem   TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','lido','respondido','arquivado')),
    resposta   TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: usuário vê/cria só os seus; admin vê tudo
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Usuário pode inserir os seus
CREATE POLICY "feedbacks_insert_own" ON feedbacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode ler os seus
CREATE POLICY "feedbacks_select_own" ON feedbacks
    FOR SELECT USING (auth.uid() = user_id);

-- Admin pode ler todos (via service role ou RPC)
-- Para admin no frontend (anon key), vamos criar uma RPC

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_tipo ON feedbacks(tipo);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- RPC para admin listar todos os feedbacks (bypassa RLS)
CREATE OR REPLACE FUNCTION admin_listar_feedbacks()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    tipo TEXT,
    mensagem TEXT,
    status TEXT,
    resposta TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_nome TEXT,
    user_sobrenome TEXT,
    user_negocio TEXT,
    user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Verifica se quem chama é admin
    SELECT role INTO caller_role FROM perfis WHERE perfis.id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores';
    END IF;

    RETURN QUERY
    SELECT
        f.id, f.user_id, f.tipo, f.mensagem, f.status, f.resposta,
        f.created_at, f.updated_at,
        p.nome AS user_nome,
        p.sobrenome AS user_sobrenome,
        p.negocio AS user_negocio,
        u.email AS user_email
    FROM feedbacks f
    LEFT JOIN perfis p ON p.id = f.user_id
    LEFT JOIN auth.users u ON u.id = f.user_id
    ORDER BY f.created_at DESC;
END;
$$;

-- RPC para admin atualizar status/resposta (bypassa RLS)
CREATE OR REPLACE FUNCTION admin_responder_feedback(
    feedback_id UUID,
    novo_status TEXT,
    nova_resposta TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM perfis WHERE perfis.id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores';
    END IF;

    UPDATE feedbacks
    SET status = novo_status,
        resposta = COALESCE(nova_resposta, resposta),
        updated_at = now()
    WHERE feedbacks.id = feedback_id;
END;
$$;
