const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function run() {
    const afiliado_id = 'aae0293b-9cea-488f-b5f3-71fcdd8882d4'; // DOCECONE10
    const emails = ['lucienemariasoaresmarques84@gmail.com', 'santos.beatriz.lais@gmail.com', 'anacecilianascimento.ueap@gmail.com'];
    const payloads = emails.map(email => ({
        afiliado_id: afiliado_id,
        indicado_email: email,
        converteu: true,
        valor_pago: 97.00,
        comissao: 9.70
    }));

    const { data, error } = await sb.from('indicacoes').insert(payloads);
    console.log(JSON.stringify({data, error}));
}
run();
