-- ================================================================
-- ReceitasX · FIX: Ativar vitalício da venda de hoje
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Verificar o estado atual do perfil
SELECT id, nome, sobrenome, plano, plano_ativo_em
FROM perfis
WHERE id = '5629a15a-1d94-492b-910b-3f9dc87173c8';

-- 2. CORRIGIR: Ativar plano vitalício para esse usuário
UPDATE perfis
SET plano = 'vitalicio',
    plano_ativo_em = '2026-04-05T19:23:31Z'
WHERE id = '5629a15a-1d94-492b-910b-3f9dc87173c8';

-- 3. Confirmar que funcionou
SELECT id, nome, sobrenome, plano, plano_ativo_em
FROM perfis
WHERE id = '5629a15a-1d94-492b-910b-3f9dc87173c8';
