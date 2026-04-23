const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function run() {
    const emails = ['lucienemariasoaresmarques84@gmail.com', 'santos.beatriz.lais@gmail.com', 'anacecilianascimento.ueap@gmail.com'];
    
    // Update the indicacoes
    const { data, error } = await sb.from('indicacoes')
        .update({ valor_pago: 49.90, comissao: 4.99 })
        .in('indicado_email', emails);
    
    console.log('Update indicacoes:', JSON.stringify({data, error}));
}
run();
