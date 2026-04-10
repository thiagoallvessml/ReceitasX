-- Corrigir a Policy de visualização do Admin para a tabela cliques_afiliados

DROP POLICY IF EXISTS "cliques_admin_select" ON public.cliques_afiliados;

CREATE POLICY "cliques_admin_select" ON public.cliques_afiliados FOR SELECT
  USING (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin'));

-- E, por via das dúvidas, garante que auth tem permissão de selecionar
GRANT SELECT ON public.cliques_afiliados TO authenticated;
