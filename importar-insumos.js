/**
 * ReceitasX · Importar Insumos do JSON para a tabela `insumos`
 *
 * Uso:
 *   node importar-insumos.js
 *
 * Requer:
 *   npm install @supabase/supabase-js
 *
 * ATENÇÃO: Preencha USER_ID com o seu user_id do Supabase antes de rodar.
 *          Encontre em: supabase.com → Authentication → Users → seu e-mail → UUID
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pipknmwjpblitqlxxdcw.supabase.co';

// SERVICE ROLE KEY — Settings → API → service_role (NÃO commite no git!)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'COLE_SUA_SERVICE_ROLE_KEY_AQUI';

// Seu user_id no Supabase (Authentication → Users → seu e-mail → copie o UUID)
const USER_ID = 'f6b5a6fa-66bd-4dc3-ab69-eee4141ad6ee';

// Caminho para o arquivo JSON exportado
const ARQUIVO_JSON = 'C:\\Users\\thiag\\OneDrive\\Área de Trabalho\\ingredients_rows.json';

const BATCH_SIZE = 50; // A tabela insumos tem RLS, então lotes menores são mais seguros
// ────────────────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    // Validações iniciais
    if (SUPABASE_SERVICE_KEY === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') {
        console.error('\n❌ SERVICE ROLE KEY não configurada!');
        console.error('   Execute: $env:SUPABASE_SERVICE_KEY="sua_key"; node importar-insumos.js');
        console.error('   Ou edite a variável SUPABASE_SERVICE_KEY neste arquivo.\n');
        process.exit(1);
    }

    if (USER_ID === 'COLE_SEU_USER_ID_AQUI') {
        console.error('\n❌ USER_ID não configurado!');
        console.error('   Execute: $env:USER_ID="seu_uuid"; node importar-insumos.js');
        console.error('   Ou edite a variável USER_ID neste arquivo.\n');
        process.exit(1);
    }

    // Ler JSON
    console.log(`\n📂 Lendo arquivo: ${ARQUIVO_JSON}`);
    if (!fs.existsSync(ARQUIVO_JSON)) {
        console.error('❌ Arquivo não encontrado:', ARQUIVO_JSON);
        process.exit(1);
    }

    const raw = fs.readFileSync(ARQUIVO_JSON, 'utf8');
    let dados;
    try {
        dados = JSON.parse(raw);
    } catch (e) {
        console.error('❌ Erro ao parsear JSON:', e.message);
        process.exit(1);
    }

    if (!Array.isArray(dados) || dados.length === 0) {
        console.error('❌ JSON inválido ou vazio.');
        process.exit(1);
    }

    console.log(`✅ ${dados.length} insumos encontrados no JSON`);

    // Montar lista de registros: apenas name e unit, com o seu user_id
    const registros = dados
        .filter(item => item.name && item.unit)
        .map(item => ({
            user_id: USER_ID,
            nome: item.name.trim(),   // JSON usa 'name', tabela usa 'nome'
            unidade: item.unit.trim(), // JSON usa 'unit', tabela usa 'unidade'
        }));

    console.log(`📋 ${registros.length} registros válidos para importar`);
    console.log(`👤 Associando ao user_id: ${USER_ID}\n`);

    // Testar conexão
    console.log('🔌 Testando conexão com Supabase...');
    const { error: testErr } = await sb.from('insumos').select('id').limit(1);
    if (testErr) {
        console.error('❌ Erro de conexão com a tabela insumos:', testErr.message);
        process.exit(1);
    }
    console.log('✅ Conexão OK!\n');

    // Importar em batches
    const total = registros.length;
    let importados = 0;
    let erros = 0;

    console.log(`🚀 Iniciando importação de ${total} insumos em batches de ${BATCH_SIZE}...\n`);

    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = registros.slice(i, i + BATCH_SIZE);

        const { error } = await sb
            .from('insumos')
            .insert(batch);

        if (error) {
            console.error(`  ❌ Erro no batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
            erros += batch.length;
        } else {
            importados += batch.length;
            const pct = Math.round((i + batch.length) / total * 100);
            process.stdout.write(`  ✅ ${i + batch.length}/${total} (${pct}%)\r`);
        }

        if (i + BATCH_SIZE < total) await sleep(300);
    }

    console.log(`\n\n🎉 Importação concluída!`);
    console.log(`   ✅ Importados : ${importados}`);
    if (erros > 0) console.log(`   ❌ Com erro   : ${erros}`);
    console.log('');
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
