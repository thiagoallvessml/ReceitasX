-- ================================================================
-- ReceitasX · FIX: Adicionar coluna role na tabela perfis
-- Execute TUDO de uma vez no Supabase Dashboard → SQL Editor
-- ================================================================

-- ── PASSO 1: Adicionar a coluna role (seguro, ignora se já existir) ──
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'afiliado'
    CHECK (role IN ('admin', 'afiliado'));

-- ── PASSO 2: Criar a função helper get_my_role() ─────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.perfis WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- ── PASSO 3: Atualizar policies de perfis ────────────────────────
DROP POLICY IF EXISTS "perfis_self"          ON perfis;
DROP POLICY IF EXISTS "perfis_admin_select"  ON perfis;
DROP POLICY IF EXISTS "perfis_admin_update"  ON perfis;

-- Afiliado: lê e edita só o próprio perfil
CREATE POLICY "perfis_self"
  ON perfis FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin: lê todos os perfis
CREATE POLICY "perfis_admin_select"
  ON perfis FOR SELECT
  USING (get_my_role() = 'admin');

-- Admin: atualiza qualquer perfil (inclusive o role)
CREATE POLICY "perfis_admin_update"
  ON perfis FOR UPDATE
  USING  (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- ── PASSO 4: Atualizar trigger para novos usuários ───────────────
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

  INSERT INTO public.perfis (id, nome, role, updated_at)
  VALUES (new.id, v_nome, 'afiliado', NOW())
  ON CONFLICT (id) DO UPDATE
    SET nome       = EXCLUDED.nome,
        updated_at = NOW()
  WHERE public.perfis.nome IS NULL OR public.perfis.nome = '';

  RETURN new;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user ERRO para %: % (%)', new.id, SQLERRM, SQLSTATE;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── PASSO 5: Verificar resultado ─────────────────────────────────
SELECT id, nome, role FROM perfis ORDER BY created_at;
