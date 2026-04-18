CREATE OR REPLACE FUNCTION admin_contar_feedbacks_pendentes()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
    q_count INT;
BEGIN
    SELECT role INTO caller_role FROM perfis WHERE perfis.id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO q_count FROM feedbacks WHERE status = 'pendente';
    RETURN q_count;
END;
$$;
