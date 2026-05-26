-- ================================================================
-- SQL PARA ATUALIZAÇÃO DO PAINEL ADMIN (MELHORIAS)
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. MELHORIA REEMBOLSOS: Adicionar coluna estruturada para o motivo
ALTER TABLE public.reembolsos 
ADD COLUMN IF NOT EXISTS motivo_categoria TEXT;

-- 2. MELHORIA FEEDBACKS: Remover restrição estrita de status para permitir os novos ("Novo", "Em análise", "Resolvido")
ALTER TABLE public.feedbacks 
DROP CONSTRAINT IF EXISTS feedbacks_status_check;

ALTER TABLE public.feedbacks 
DROP CONSTRAINT IF EXISTS feedbacks_tipo_check;

-- Opcional: Migrar status antigos para o novo padrão
UPDATE public.feedbacks SET status = 'Novo' WHERE status = 'pendente';
UPDATE public.feedbacks SET status = 'Em análise' WHERE status = 'lido';
UPDATE public.feedbacks SET status = 'Resolvido' WHERE status IN ('respondido', 'arquivado');

-- 3. MELHORIA FUNIL: Tabela para registrar eventos específicos (ex: clique no botão de checkout)
CREATE TABLE IF NOT EXISTS public.eventos_usuario (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID, -- Pode ser nulo se o usuário ainda não estiver logado
    evento TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.eventos_usuario ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (para visitantes que clicam no checkout)
DO $$
BEGIN
    DROP POLICY IF EXISTS "eventos_insert_public" ON public.eventos_usuario;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
CREATE POLICY "eventos_insert_public" ON public.eventos_usuario 
FOR INSERT WITH CHECK (true);

-- Permitir leitura por administradores
DO $$
BEGIN
    DROP POLICY IF EXISTS "eventos_admin_select" ON public.eventos_usuario;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
CREATE POLICY "eventos_admin_select" ON public.eventos_usuario 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM perfis 
        WHERE perfis.id = auth.uid() AND (perfis.role = 'admin' OR perfis.plano = 'admin')
    )
);
