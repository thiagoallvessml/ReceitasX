const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const sc = fs.readFileSync('supabase-client.js', 'utf8');
const urlMatch = sc.match(/SUPABASE_URL = '(.+?)'/);
const keyMatch = sc.match(/SUPABASE_KEY = '(.+?)'/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkRpc() {
    const { data, error } = await supabase.rpc('admin_listar_configuracoes');
    if (error) {
        console.error("Erro RPC:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Keys retornadas:", Object.keys(data[0]));
        } else {
            console.log("Nenhum dado retornado, mas RPC executou com sucesso.");
        }
    }
}
checkRpc();
