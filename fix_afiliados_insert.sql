-- ================================================================
-- ReceitasX · Auto-cadastro de afiliados (versão definitiva)
-- Estrutura real: afiliados.id = auth.users.id (FK direta)
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- ── 1. Policy de INSERT ───────────────────────────────────────────
DROP POLICY IF EXISTS "afiliados_self_insert" ON afiliados;
CREATE POLICY "afiliados_self_insert"
  ON afiliados FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── 2. Garantir colunas (sem recriar as que já existem) ───────────
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS email         TEXT NOT NULL DEFAULT '';
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS codigo        TEXT;
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS total_ganhos  NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS total_vendas  INTEGER       NOT NULL DEFAULT 0;
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS total_cliques INTEGER       NOT NULL DEFAULT 0;

-- Coluna user_id como alias (sem FK — só para compatibilidade com o frontend)
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS user_id UUID;

-- Remover FK inválida em user_id (se existir, criada por engano)
DO $$ BEGIN
  ALTER TABLE afiliados DROP CONSTRAINT afiliados_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Garantir UNIQUE em codigo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='afiliados'::regclass AND conname='afiliados_codigo_key') THEN
    ALTER TABLE afiliados ADD CONSTRAINT afiliados_codigo_key UNIQUE (codigo);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 3. Sincronizar user_id = id nas linhas existentes ─────────────
UPDATE afiliados SET user_id = id WHERE user_id IS NULL;

-- ── 4. Função gera código único ───────────────────────────────────
DROP FUNCTION IF EXISTS gerar_codigo_afiliado(TEXT, UUID);
CREATE OR REPLACE FUNCTION gerar_codigo_afiliado(p_email TEXT, p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_base TEXT; v_code TEXT; v_exists BOOLEAN;
BEGIN
  v_base := upper(regexp_replace(split_part(p_email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  v_base := left(v_base, 6);
  IF length(v_base) < 2 THEN
    v_base := upper(left(replace(p_user_id::text, '-', ''), 6));
  END IF;
  FOR i IN 1..10 LOOP
    v_code := v_base || upper(substring(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM afiliados WHERE codigo = v_code) INTO v_exists;
    IF NOT v_exists THEN RETURN v_code; END IF;
  END LOOP;
  RETURN upper(replace(left(p_user_id::text, 10), '-', ''));
END; $$;

-- ── 5. Trigger: toda conta nova vira afiliado ─────────────────────
CREATE OR REPLACE FUNCTION criar_afiliado_ao_registrar()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email TEXT; v_code TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  v_code := gerar_codigo_afiliado(COALESCE(v_email, ''), NEW.id);

  -- id = NEW.id (mesmo UUID do usuário), user_id = mesmo valor
  INSERT INTO afiliados (id, user_id, email, codigo)
  VALUES (NEW.id, NEW.id, COALESCE(v_email, ''), v_code)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_criar_afiliado ON perfis;
CREATE TRIGGER trg_criar_afiliado
  AFTER INSERT ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION criar_afiliado_ao_registrar();

-- ── 6. Cadastrar retroativamente quem ainda não tem registro ──────
INSERT INTO afiliados (id, user_id, email, codigo)
SELECT
  p.id,
  p.id,
  COALESCE(u.email, ''),
  gerar_codigo_afiliado(COALESCE(u.email, ''), p.id)
FROM perfis p
JOIN auth.users u ON u.id = p.id
WHERE NOT EXISTS (SELECT 1 FROM afiliados a WHERE a.id = p.id);

-- ── Verificação ───────────────────────────────────────────────────
SELECT '✓ Afiliados' AS check, COUNT(*)::text AS resultado FROM afiliados
UNION ALL
SELECT '✓ Trigger', CASE WHEN EXISTS (
  SELECT 1 FROM pg_trigger WHERE tgname = 'trg_criar_afiliado'
) THEN 'OK' ELSE 'FALTANDO' END
UNION ALL
SELECT '✓ Sem user_id nulo', COUNT(*)::text FROM afiliados WHERE user_id IS NULL;
