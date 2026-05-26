const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function check() {
    const email = "jeronimovrb@yahoo.com.br";
    const { data: p } = await sb.from('pedidos').select('*').eq('email', email);
    const { data: i } = await sb.from('indicacoes').select('*').eq('indicado_email', email);
    const { data: c } = await sb.from('afiliados').select('*').eq('codigo', 'DOCECONE10');

    console.log("PEDIDOS:", p);
    console.log("INDICACOES:", i);
    console.log("AFILIADOS:", c);
}
check();
