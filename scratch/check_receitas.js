const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse supabase URL and KEY from supabase-client.js
const sc = fs.readFileSync('supabase-client.js', 'utf8');
const urlMatch = sc.match(/SUPABASE_URL = '(.+?)'/);
const keyMatch = sc.match(/SUPABASE_KEY = '(.+?)'/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    const { data, error } = await supabase.from('receitas').select('*').limit(1);
    if (error) {
        console.error("Error fetching receitas:", error);
    } else {
        console.log("Receita data keys:", Object.keys(data[0] || {}));
    }
}
run();
