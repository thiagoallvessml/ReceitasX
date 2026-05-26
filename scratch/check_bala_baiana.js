const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function run() {
    const uid = 'f6b5a6fa-66bd-4dc3-ab69-eee4141ad6ee';
    
    console.log("=== PRODUTOS DO USUARIO ===");
    const { data: prod } = await sb.from('produtos').select('*').eq('user_id', uid);
    console.log(prod);

    console.log("\n=== RECEITAS DO USUARIO ===");
    const { data: rec } = await sb.from('receitas').select('id, nome, custo_total').eq('user_id', uid);
    console.log(rec);

    console.log("\n=== VENDAS DO USUARIO HOJE ===");
    const { data: vendas } = await sb.from('vendas_clientes').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(5);
    console.log(JSON.stringify(vendas, null, 2));
}
run();
