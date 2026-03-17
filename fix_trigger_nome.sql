-- ================================================================
-- CORREÇÃO: Trigger handle_new_user
-- Salva o nome REAL digitado no cadastro (em vez da parte do email)
-- Execute no Supabase SQL Editor
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO perfis (id, nome, updated_at)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'nome',        -- nome digitado no cadastro
      new.raw_user_meta_data->>'full_name',   -- fallback Google OAuth
      split_part(new.email, '@', 1)           -- fallback final: parte do email
    ),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
