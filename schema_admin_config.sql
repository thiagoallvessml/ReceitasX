CREATE OR REPLACE FUNCTION admin_listar_configuracoes()
RETURNS TABLE (
    user_id UUID,
    gas_custo NUMERIC,
    gas_rendimento NUMERIC,
    energia_kwh NUMERIC,
    mao_obra_hora NUMERIC,
    meta_margem NUMERIC,
    updated_at TIMESTAMPTZ,
    user_nome TEXT,
    user_sobrenome TEXT,
    user_negocio TEXT,
    user_email TEXT,
    user_telefone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM perfis WHERE perfis.id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores';
    END IF;

    RETURN QUERY
    SELECT
        c.user_id,
        c.gas_custo::NUMERIC,
        c.gas_rendimento::NUMERIC,
        c.energia_kwh::NUMERIC,
        c.mao_obra_hora::NUMERIC,
        c.meta_margem::NUMERIC,
        c.updated_at,
        p.nome AS user_nome,
        p.sobrenome AS user_sobrenome,
        p.negocio AS user_negocio,
        u.email::TEXT AS user_email,
        u.phone::TEXT AS user_telefone
    FROM configuracoes c
    LEFT JOIN perfis p ON p.id = c.user_id
    LEFT JOIN auth.users u ON u.id = c.user_id
    ORDER BY c.updated_at DESC NULLS LAST;
END;
$$;
