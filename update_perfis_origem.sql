-- ReceitasX: Adicionar coluna origem_cadastro na tabela perfis

ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS origem_cadastro TEXT;

-- Opcional: Se quiser atualizar todos os usuários antigos que não tem origem
-- para 'Desconhecido' ou 'Antigo':
-- UPDATE public.perfis SET origem_cadastro = 'Legado' WHERE origem_cadastro IS NULL;
