-- Qual é o tipo da primary key de afiliados?
SELECT data_type 
FROM information_schema.columns 
WHERE table_name = 'afiliados' AND column_name = 'id';
