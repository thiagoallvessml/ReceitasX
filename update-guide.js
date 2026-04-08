const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'guia-configuracao.html');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all occurrences of the manual "Marcar como feito" buttons
content = content.replace(/[\t ]*<button class="btn-done"\s+onclick="toggleDone\(\d+\)">[\s\S]*?<\/button>\r?\n/g, '');

// The replacement script to automatically check progress
const newScript = `<script>
const TOTAL_STEPS = 10;
let userSession = null;

async function checkProgress() {
    try {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        userSession = session;

        const uid = session.user.id;
        const progress = {};

        // Helper para rodar contagem
        const countTable = async (table) => {
            const { count } = await sb.from(table).select('*', { count: 'exact', head: true }).eq('user_id', uid);
            return count || 0;
        };

        // 1. Configurações
        const { count: cfgCount } = await sb.from('configuracoes').select('*', { count: 'exact', head: true }).eq('user_id', uid);
        progress[1] = cfgCount > 0;

        // 2. Equipamentos
        progress[2] = await countTable('equipamentos') > 0;

        // 3. Insumos
        progress[3] = await countTable('insumos') > 0;

        // 4. Embalagens
        progress[4] = await countTable('embalagens') > 0;

        // 5. Receitas
        progress[5] = await countTable('receitas') > 0;

        // 6. Produtos
        progress[6] = await countTable('produtos') > 0;

        // 7. Precificação (pelo menos 1 preço cadastrado no marketplace)
        progress[7] = await countTable('precificacao') > 0;

        // 8. Combos (Opcional)
        progress[8] = await countTable('combos') > 0;

        // 9. Despesas (Opcional)
        progress[9] = await countTable('despesas') > 0;

        // 10. Ponto de Equilíbrio (Acessou a aba pelo menos uma vez)
        // Isso pode ser via localStorage ou deixamos sem validação estrita
        const peqHit = localStorage.getItem('receitasx_peq_hit');
        progress[10] = peqHit === 'true';

        renderProgress(progress);
    } catch(e) {
        console.warn('Erro ao verificar progresso:', e);
    }
}

function renderProgress(progress) {
    const doneCount = Object.keys(progress).filter(k => progress[k]).length;
    let requiredCount = 0;
    const TOTAL_REQUIRED = 7;
    for(let i=1; i<=7; i++) {
        if(progress[i]) requiredCount++;
    }

    const pct = Math.round((doneCount / TOTAL_STEPS) * 100);

    // Update progress bar
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = pct + '%';
    
    document.getElementById('done-count').textContent = doneCount;
    document.getElementById('total-count').textContent = TOTAL_STEPS;
    document.getElementById('progress-pct').textContent = pct + '%';

    // Update step cards
    document.querySelectorAll('.step-card').forEach(card => {
        const step = parseInt(card.dataset.step);
        const isDone = !!progress[step];

        card.classList.toggle('done', isDone);

        // Update node content
        const node = card.querySelector('.step-node');
        if (node) {
            if (isDone) {
                node.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.1rem;font-variation-settings:\\'FILL\\' 1,\\'wght\\' 500,\\'GRAD\\' 0,\\'opsz\\' 24">check</span>';
            } else {
                node.textContent = step;
            }
        }
    });

    // Banner 100% (Mostra se fez pelo menos o básico ou tudo)
    const banner = document.getElementById('banner-complete');
    if (banner) {
        if (requiredCount >= TOTAL_REQUIRED) {
            banner.classList.add('show');
            banner.querySelector('p').textContent = 'O ReceitasX está pronto para uso. Suas configurações essenciais estão concluídas!';
        } else {
            banner.classList.remove('show');
        }
    }
}

function resetProgress() {
    // Como agora é automático, o reset visual não serve muito.
    // Vamos apenas recarregar para buscar do DB.
    checkProgress();
}

// Init
checkProgress();
</script>`;

// Replace the script section
content = content.replace(/<script>\s*const GUIDE_KEY[\s\S]*?<\/script>/, newScript);

// Remove the reset button block
content = content.replace(/<!-- ══ Reset Button ═══════════════════════════════════════════════ -->[\s\S]*?<\/div>\s*<br\/>|<div style="padding-bottom:3rem;text-align:center">[\s\S]*?<\/div>/g, '');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacing!');
