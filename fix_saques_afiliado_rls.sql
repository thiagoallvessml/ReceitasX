-- ══════════════════════════════════════════════════════════════════
-- RLS correta para saques_afiliado
-- Usa get_my_role() para checar admin (perfis.id = auth.uid())
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Remove políticas antigas
DO $$ BEGIN DROP POLICY IF EXISTS "Afiliados inserem proprio saque"   ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Afiliados veem proprios saques"    ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admin gerencia todos saques"       ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admin insere saques"               ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admin atualiza saques"             ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "Admin le todos saques"             ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "saques_self"                       ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "saques_admin_select"               ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "saques_admin_update"               ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Garante RLS ativo
ALTER TABLE saques_afiliado ENABLE ROW LEVEL SECURITY;

-- Afiliado: vê e insere apenas seus próprios saques
CREATE POLICY "saques_self"
  ON saques_afiliado FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin: lê todos os saques
CREATE POLICY "saques_admin_select"
  ON saques_afiliado FOR SELECT
  USING (get_my_role() = 'admin');

-- Admin: insere saque para qualquer afiliado (rodada de pagamento)
CREATE POLICY "saques_admin_insert"
  ON saques_afiliado FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Admin: atualiza status (Pagar / Rejeitar)
CREATE POLICY "saques_admin_update"
  ON saques_afiliado FOR UPDATE
  USING     (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Confirma
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'saques_afiliado';
