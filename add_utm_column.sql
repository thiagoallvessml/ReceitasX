-- ══════════════════════════════════════════════════════════════════
-- Migration: Adicionar coluna utm_dados na tabela perfis
-- Armazena dados UTM do Google Ads (utm_source, utm_medium, 
-- utm_campaign, utm_term, utm_content, gclid) como JSONB
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE perfis ADD COLUMN IF NOT EXISTS utm_dados JSONB;

-- Comentário descritivo
COMMENT ON COLUMN perfis.utm_dados IS 'Dados UTM capturados no momento do cadastro (utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid)';

-- Verificação
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'perfis' AND column_name = 'utm_dados';
