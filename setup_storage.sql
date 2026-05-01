-- 1. Criar o bucket público 'avatars'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa na internet possa VER as imagens
CREATE POLICY "Imagens públicas" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 3. Permitir que apenas usuários logados (como o Admin) possam FAZER UPLOAD
CREATE POLICY "Usuários logados podem fazer upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Permitir que o dono da imagem possa deletar/atualizar a própria imagem
CREATE POLICY "Usuário pode deletar própria imagem" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Usuário pode atualizar própria imagem" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
