-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Schema Supabase
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. PERFIS ──────────────────────────────────────────────────────
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
  plano       TEXT NOT NULL DEFAULT 'gratuito',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfis_self" ON perfis FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO perfis (id, nome, updated_at)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. INSUMOS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insumos (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  unidade     TEXT,
  preco       NUMERIC(10,4) DEFAULT 0,
  peso_emb    NUMERIC(10,4) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insumos_self" ON insumos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. EMBALAGENS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS embalagens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  preco       NUMERIC(10,4) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE embalagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "embalagens_self" ON embalagens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. EQUIPAMENTOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipamentos (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  custo_hora  NUMERIC(10,4) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipamentos_self" ON equipamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 5. RECEITAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receitas (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  unidades     INTEGER DEFAULT 1,
  custo_total  NUMERIC(10,4) DEFAULT 0,
  preco_venda  NUMERIC(10,4) DEFAULT 0,
  ingredientes JSONB DEFAULT '[]',
  embalagens   JSONB DEFAULT '[]',
  equipamentos JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receitas_self" ON receitas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 6. PRODUTOS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  categoria   TEXT,
  preco       NUMERIC(10,4) DEFAULT 0,
  custo       NUMERIC(10,4) DEFAULT 0,
  rendimento  NUMERIC(10,4),
  receita_id  BIGINT REFERENCES receitas(id) ON DELETE SET NULL,
  imagem_url  TEXT,
  ativo       BOOLEAN DEFAULT TRUE,
  obs         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_self" ON produtos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 7. COMBOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS combos (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  preco       NUMERIC(10,4) DEFAULT 0,
  imagem_url  TEXT,
  itens       JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "combos_self" ON combos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 8. DESPESAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS despesas (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  categoria   TEXT,
  tipo        TEXT DEFAULT 'fixa',
  valor       NUMERIC(10,4) DEFAULT 0,
  frequencia  TEXT DEFAULT 'mensal',
  vencimento  INTEGER,
  obs         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "despesas_self" ON despesas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 9. MARKETPLACES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplaces (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  taxa        NUMERIC(5,2) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplaces_self" ON marketplaces FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 10. PRECIFICAÇÃO ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS precificacao (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_id   BIGINT NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
  produto_id       BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  preco            NUMERIC(10,4) DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, marketplace_id, produto_id)
);
ALTER TABLE precificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precificacao_self" ON precificacao FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 11. CONFIGURAÇÕES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gas_custo        NUMERIC(10,4) DEFAULT 0,
  gas_rendimento   NUMERIC(10,4) DEFAULT 0,
  energia_kwh      NUMERIC(10,6) DEFAULT 0,
  mao_obra_hora    NUMERIC(10,4) DEFAULT 0,
  meta_margem      NUMERIC(5,2)  DEFAULT 35,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_self" ON configuracoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 12. CUPONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cupons (
  id          BIGSERIAL PRIMARY KEY,
  codigo      TEXT UNIQUE NOT NULL,
  tipo        TEXT NOT NULL DEFAULT '%',
  valor       NUMERIC(10,2) NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  usos_max    INTEGER,
  usos_atual  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Cupons são públicos apenas para leitura (verificar validade no checkout)
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cupons_read" ON cupons FOR SELECT USING (ativo = TRUE);

-- Dados iniciais de cupons
INSERT INTO cupons (codigo, tipo, valor) VALUES
  ('BEMVINDA10', '%',  10),
  ('LANCAMENTO', '%',  20),
  ('AMIGA5',     'R$', 5),
  ('DESCONTO15', '%',  15)
ON CONFLICT (codigo) DO NOTHING;

-- ── 13. PEDIDOS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  valor_pago    NUMERIC(10,2),
  cupom_id      BIGINT REFERENCES cupons(id),
  metodo_pag    TEXT,
  status        TEXT NOT NULL DEFAULT 'pendente',
  codigo_acesso TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos_self" ON pedidos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- FIM DO SCHEMA
-- ══════════════════════════════════════════════════════════════════
