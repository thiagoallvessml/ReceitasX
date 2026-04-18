-- ================================================================
-- ReceitasX · Tabela: tutoriais (vídeos do YouTube)
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS tutoriais (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo     TEXT NOT NULL,
    descricao  TEXT,
    youtube_url TEXT NOT NULL,
    ordem      INTEGER NOT NULL DEFAULT 0,
    ativo      BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: todos podem ler tutoriais ativos (dados públicos)
ALTER TABLE tutoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutoriais_select_all" ON tutoriais
    FOR SELECT USING (ativo = true);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_tutoriais_ordem ON tutoriais(ordem ASC);

-- RPC para admin gerenciar tutoriais (INSERT/UPDATE/DELETE bypassa RLS)
CREATE OR REPLACE FUNCTION admin_listar_todos_tutoriais()
RETURNS SETOF tutoriais
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
    RETURN QUERY SELECT * FROM tutoriais ORDER BY ordem ASC, created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_upsert_tutorial(
    p_id UUID DEFAULT NULL,
    p_titulo TEXT DEFAULT '',
    p_descricao TEXT DEFAULT '',
    p_youtube_url TEXT DEFAULT '',
    p_ordem INTEGER DEFAULT 0,
    p_ativo BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
    result_id UUID;
BEGIN
    SELECT role INTO caller_role FROM perfis WHERE perfis.id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores';
    END IF;

    IF p_id IS NOT NULL THEN
        UPDATE tutoriais SET
            titulo = p_titulo,
            descricao = p_descricao,
            youtube_url = p_youtube_url,
            ordem = p_ordem,
            ativo = p_ativo
        WHERE id = p_id
        RETURNING id INTO result_id;
    ELSE
        INSERT INTO tutoriais (titulo, descricao, youtube_url, ordem, ativo)
        VALUES (p_titulo, p_descricao, p_youtube_url, p_ordem, p_ativo)
        RETURNING id INTO result_id;
    END IF;

    RETURN result_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_deletar_tutorial(p_id UUID)
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
    DELETE FROM tutoriais WHERE id = p_id;
END;
$$;
