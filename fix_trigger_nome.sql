-- ================================================================
-- CORREÇÃO CRÍTICA: Trigger handle_new_user à prova de falhas
-- O trigger original falhava e impedia o cadastro de novos usuários
-- Execute no Supabase SQL Editor
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nome TEXT;
BEGIN
  -- Tentar pegar o nome real do metadata, com fallbacks
  v_nome := COALESCE(
    new.raw_user_meta_data->>'nome',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  INSERT INTO perfis (id, nome, updated_at)
  VALUES (new.id, v_nome, NOW())
  ON CONFLICT (id) DO UPDATE
    SET nome       = EXCLUDED.nome,
        updated_at = NOW()
  WHERE perfis.nome IS NULL OR perfis.nome = '';

  RETURN new;

EXCEPTION WHEN OTHERS THEN
  -- NUNCA deixar o trigger bloquear o cadastro
  -- Erro será visível nos logs do Supabase mas o usuário é criado normalmente
  RAISE LOG 'handle_new_user falhou para user %: % %', new.id, SQLERRM, SQLSTATE;
  RETURN new;
END;
$$;
