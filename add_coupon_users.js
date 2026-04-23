const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function run() {
    const emails = ['lucienemariasoaresmarques84@gmail.com', 'santos.beatriz.lais@gmail.com', 'anacecilianascimento.ueap@gmail.com'];
    const payloads = emails.map(email => ({
        email: email,
        cupom_usado: 'DOCECONE10',
        status: 'pago',
        valor_pago: 97.00
    }));

    const { data, error } = await sb.from('pedidos').insert(payloads);
    console.log('Insert pedidos:', JSON.stringify({data, error}));

    // Update coupon usages
    const { data: cData, error: cErr } = await sb.from('cupons').select('*').ilike('codigo', 'DOCECONE10').single();
    if (cData) {
        const newCount = (cData.usos_atual || 0) + emails.length;
        const { error: updErr } = await sb.from('cupons').update({usos_atual: newCount}).eq('id', cData.id);
        console.log('Update cupom:', JSON.stringify({error: updErr}));
    } else {
        console.log('Cupom nao encontrado:', JSON.stringify(cErr));
    }
}
run();
