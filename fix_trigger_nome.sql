-- ================================================================
-- DIAGNÓSTICO + CORREÇÃO COMPLETA
-- Execute TUDO de uma vez no Supabase SQL Editor
-- ================================================================

-- 1. Ver a função atual do trigger
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- 2. Ver se a tabela perfis existe e suas colunas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'perfis'
ORDER BY ordinal_position;

-- 3. Recriar a tabela perfis com segurança (se não existir)
CREATE TABLE IF NOT EXISTS perfis (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT,
  sobrenome   TEXT,
  telefone    TEXT,
  negocio     TEXT,
  segmento    TEXT,
  cidade      TEXT,
  estado      TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  plano       TEXT        NOT NULL DEFAULT 'gratuito',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Garantir RLS habilitado com política correta
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_self" ON perfis;
CREATE POLICY "perfis_self" ON perfis
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. SUBSTITUIR o trigger — versão à prova de falhas
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
BEGIN
  v_nome := COALESCE(
    new.raw_user_meta_data->>'nome',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.perfis (id, nome, updated_at)
  VALUES (new.id, v_nome, NOW())
  ON CONFLICT (id) DO UPDATE
    SET nome       = EXCLUDED.nome,
        updated_at = NOW()
  WHERE public.perfis.nome IS NULL OR public.perfis.nome = '';

  RETURN new;

EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear o cadastro por falha no perfil
  RAISE LOG 'handle_new_user ERRO para %: % (%)', new.id, SQLERRM, SQLSTATE;
  RETURN new;
END;
$$;

-- 6. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Confirmar que foi aplicado
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
