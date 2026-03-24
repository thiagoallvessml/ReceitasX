/**
 * ReceitasX · Importar Catálogo de Insumos para Supabase
 * 
 * Uso: node importar-catalogo.js
 * 
 * Requer: npm install @supabase/supabase-js
 * (ou: npm install)  se já houver package.json
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pipknmwjpblitqlxxdcw.supabase.co';

// ATENÇÃO: Use a SERVICE ROLE KEY para importação (não a anon key)
// Encontre em: supabase.com → projeto → Settings → API → service_role
// NÃO commite esta chave no git!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'COLE_SUA_SERVICE_ROLE_KEY_AQUI';

const ARQUIVO_JSON = path.join(__dirname, 'produtos_exportados.json');
const BATCH_SIZE = 500; // inserir 500 itens por vez

// ── Cliente com service role (ignora RLS) ────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Helpers ──────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function limparNome(nome) {
    if (!nome || typeof nome !== 'string') return null;
    const n = nome.trim();
    // Ignora nomes claramente inválidos
    if (n.length < 2) return null;
    if (n.length > 200) return null;
    // Ignora entradas que parecem códigos/barcodes
    if (/^\d{10,}$/.test(n)) return null;
    // Ignora entradas com caracteres estranhos excessivos
    if ((n.match(/[^a-zA-ZÀ-ÿ0-9\s\-_.,()%+&'"/]/g) || []).length > 5) return null;
    return n;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
    console.log('📂 Lendo arquivo JSON...');
    
    if (!fs.existsSync(ARQUIVO_JSON)) {
        console.error('❌ Arquivo não encontrado:', ARQUIVO_JSON);
        process.exit(1);
    }

    const raw = fs.readFileSync(ARQUIVO_JSON, 'utf8');
    let produtos;
    try {
        produtos = JSON.parse(raw);
    } catch (e) {
        console.error('❌ Erro ao parsear JSON:', e.message);
        process.exit(1);
    }

    console.log(`✅ ${produtos.length} produtos encontrados no JSON`);

    // Extrair nomes únicos e limpos
    const nomesSet = new Set();
    for (const p of produtos) {
        const nome = limparNome(p.product_name);
        if (nome) nomesSet.add(nome);
    }

    const nomes = [...nomesSet].sort();
    console.log(`🧹 ${nomes.length} nomes únicos e válidos após limpeza`);

    // Verificar se service key está configurada
    if (SUPABASE_SERVICE_KEY === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') {
        console.error('');
        console.error('❌ Service Role Key não configurada!');
        console.error('   Execute com: SUPABASE_SERVICE_KEY=sua_key node importar-catalogo.js');
        console.error('   Ou edite a variável SUPABASE_SERVICE_KEY neste arquivo.');
        process.exit(1);
    }

    // Verificar conexão
    console.log('\n🔌 Testando conexão com Supabase...');
    const { error: testErr } = await sb.from('insumos_catalogo').select('id').limit(1);
    if (testErr) {
        console.error('❌ Erro de conexão:', testErr.message);
        console.error('   Verifique se a tabela foi criada (execute insumos_catalogo_schema.sql)');
        process.exit(1);
    }
    console.log('✅ Conexão OK!');

    // Importar em batches
    const total = nomes.length;
    let importados = 0;
    let erros = 0;

    console.log(`\n🚀 Iniciando importação de ${total} itens em batches de ${BATCH_SIZE}...\n`);

    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = nomes.slice(i, i + BATCH_SIZE).map(nome => ({ nome }));
        
        const { error } = await sb.from('insumos_catalogo')
            .upsert(batch, { onConflict: 'nome', ignoreDuplicates: true });

        if (error) {
            console.error(`  ❌ Erro no batch ${Math.floor(i/BATCH_SIZE)+1}:`, error.message);
            erros += batch.length;
        } else {
            importados += batch.length;
            const pct = Math.round((i + batch.length) / total * 100);
            process.stdout.write(`  ✅ ${i + batch.length}/${total} (${pct}%)\r`);
        }

        // Pequena pausa para não sobrecarregar
        if (i + BATCH_SIZE < total) await sleep(200);
    }

    console.log(`\n\n🎉 Importação concluída!`);
    console.log(`   ✅ Importados: ${importados}`);
    if (erros > 0) console.log(`   ❌ Com erro:   ${erros}`);
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
