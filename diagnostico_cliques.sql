CREATE OR REPLACE FUNCTION admin_bypass_get_cliques()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(t) INTO result FROM (
        SELECT * FROM cliques_afiliados ORDER BY created_at DESC LIMIT 500
    ) t;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_bypass_get_cliques() TO authenticated;
