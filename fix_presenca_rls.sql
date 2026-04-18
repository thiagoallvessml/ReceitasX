ALTER TABLE presenca_online ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário pode inserir sua própria presença" ON presenca_online;
DROP POLICY IF EXISTS "Usuário pode atualizar sua própria presença" ON presenca_online;
DROP POLICY IF EXISTS "Qualquer um pode ver a presenca online" ON presenca_online;

-- Permite ao usuário logado inserir na tabela caso seja a primeira vez dele
CREATE POLICY "Usuário pode inserir sua própria presença" 
ON presenca_online FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permite ao usuário logado atualizar (upsertar) a coluna de data e página
CREATE POLICY "Usuário pode atualizar sua própria presença" 
ON presenca_online FOR UPDATE 
USING (auth.uid() = user_id);

-- Permite leitura geral
CREATE POLICY "Qualquer um pode ver a presenca online" 
ON presenca_online FOR SELECT 
USING (true);
