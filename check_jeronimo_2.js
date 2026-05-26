const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://pipknmwjpblitqlxxdcw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E');

async function check() {
    // Busca todos os pedidos
    const { data: p } = await sb.from('pedidos').select('email, user_id, cupom_usado').eq('status', 'pago');
    
    // Mostra os emails de pedidos e se tem alguem com cupom_usado = 'DOCECONE10'
    const docs = p.filter(x => x.cupom_usado === 'DOCECONE10' || x.ref_afiliado === 'DOCECONE10');
    console.log("Pedidos com DOCECONE10:", docs);
}
check();
