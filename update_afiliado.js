const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function run() {
    // 3 sales * 97.00
    for(let i=0; i<3; i++) {
        const { data, error } = await sb.rpc('incrementar_venda_afiliado', {
            p_afiliado_id: 'aae0293b-9cea-488f-b5f3-71fcdd8882d4',
            p_valor: 97.00
        });
        console.log(JSON.stringify({data, error}));
    }
}
run();
