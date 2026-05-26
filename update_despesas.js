const fs = require('fs');
let html = fs.readFileSync('despesas.html', 'utf8');

// Add Comissoes to chips
html = html.replace(
  `<button class="chip" data-filter="Outros"            onclick="setFilter('Outros',this)">Outros</button>`,
  `<button class="chip" data-filter="Comissões"         onclick="setFilter('Comissões',this)">Comissões</button>
            <button class="chip" data-filter="Impostos"          onclick="setFilter('Impostos',this)">Impostos</button>
            <button class="chip" data-filter="Outros"            onclick="setFilter('Outros',this)">Outros</button>`
);

// Add Comissoes to select options
html = html.replace(
  `<option value="Impostos">Impostos</option>`,
  `<option value="Comissões">Comissões</option>
            <option value="Impostos">Impostos</option>`
);

// Update constants
html = html.replace(
  /'Impostos':'account_balance','Outros':'more_horiz'/,
  `'Comissões':'monetization_on','Impostos':'account_balance','Outros':'more_horiz'`
);
html = html.replace(
  /'Impostos':'#f87171','Outros':'#64748b'/,
  `'Comissões':'#ec4899','Impostos':'#f87171','Outros':'#64748b'`
);

// Rewrite script logic to use Supabase
const scriptStart = \"const KEY = 'receitasx_despesas';\";
const scriptEnd = \"render();\";

const regex = new RegExp(scriptStart + '[\\\\s\\\\S]*?' + scriptEnd);

const newScript = `
let despesas = [];
let userId = null;
let currentFilter = 'todas';
let pendingDelId  = null;

async function checkAuth() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    userId = session.user.id;
    await loadDespesas();
}

async function loadDespesas() {
    const { data, error } = await sb.from('despesas').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error && data) {
        // Map from DB structure to frontend structure
        despesas = data.map(d => ({
            ...d,
            cat: d.categoria // Frontend expects 'cat'
        }));
        render();
    }
}

/* ─── HELPERS ────────────────────────────────────────────────────── */
function fmtR(v) { return 'R$ ' + Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

const CAT_ICONS = {
    'Aluguel':'home','Energia':'bolt','Água':'water_drop','Internet':'wifi',
    'Marketing':'campaign','Fornecedores':'local_shipping','Embalagens':'inventory',
    'Mão de Obra':'engineering','Transporte':'local_taxi','Equipamentos':'kitchen',
    'Comissões':'monetization_on','Impostos':'account_balance','Outros':'more_horiz'
};
const CAT_COLORS = {
    'Aluguel':'#f59e0b','Energia':'#fbbf24','Água':'#38bdf8','Internet':'#60a5fa',
    'Marketing':'#a78bfa','Fornecedores':'#f97316','Embalagens':'#34d399',
    'Mão de Obra':'#25f4f4','Transporte':'#fb7185','Equipamentos':'#94a3b8',
    'Comissões':'#ec4899','Impostos':'#f87171','Outros':'#64748b'
};

function catIcon(cat) { return CAT_ICONS[cat] || 'receipt_long'; }
function catColor(cat) { return CAT_COLORS[cat] || '#64748b'; }

function freqLabel(f) {
    return { mensal:'Mensal', semanal:'Semanal', quinzenal:'Quinzenal', anual:'Anual', unica:'Única vez' }[f] || f;
}

/* ─── FILTER / RENDER ────────────────────────────────────────────── */
const CATS_TIPO = ['todas', 'fixa', 'variavel'];

function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const delBtn = document.getElementById('btn-del-cat');
    const isCat = !CATS_TIPO.includes(f);
    delBtn.style.display = isCat ? 'flex' : 'none';
    render();
}

function getFiltered() {
    return despesas.filter(d => {
        if (currentFilter === 'todas') return true;
        if (currentFilter === 'fixa' || currentFilter === 'variavel') return d.tipo === currentFilter;
        return d.cat === currentFilter;
    });
}

function updateSummary() {
    const fixas = despesas.filter(d => d.tipo === 'fixa');
    const vars  = despesas.filter(d => d.tipo === 'variavel');
    const total = despesas.reduce((s,d) => s + (d.valor||0), 0);
    const tFixa = fixas.reduce((s,d)   => s + (d.valor||0), 0);
    const tVar  = vars.reduce((s,d)    => s + (d.valor||0), 0);
    const maior = despesas.length ? despesas.reduce((a,b) => (a.valor||0)>(b.valor||0)?a:b) : null;

    document.getElementById('s-total').textContent    = fmtR(total);
    document.getElementById('s-total-sub').textContent = \`\${despesas.length} despesa\${despesas.length!==1?'s':''}\`;
    document.getElementById('s-fixa').textContent     = fmtR(tFixa);
    document.getElementById('s-fixa-sub').textContent  = \`\${fixas.length} ite\${fixas.length!==1?'ns':'m'}\`;
    document.getElementById('s-var').textContent      = fmtR(tVar);
    document.getElementById('s-var-sub').textContent   = \`\${vars.length} ite\${vars.length!==1?'ns':'m'}\`;
    document.getElementById('s-maior').textContent    = maior ? fmtR(maior.valor) : 'R$ 0';
    document.getElementById('s-maior-nome').textContent = maior ? maior.nome : '—';
}

function render() {
    const list  = getFiltered();
    const ul    = document.getElementById('desp-list');
    const empty = document.getElementById('empty-state');
    const lbl   = document.getElementById('count-label');

    updateSummary();
    lbl.textContent = \`\${list.length} despesa\${list.length!==1?'s':''} encontrada\${list.length!==1?'s':''}\`;

    if (!list.length) { ul.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    ul.innerHTML = list.map(d => {
        const ico   = catIcon(d.cat);
        const col   = catColor(d.cat);
        return \`
        <div class="desp-card" id="card-\${d.id}">
          <div class="desp-ico" style="background:\${col}1a">
            <span class="material-symbols-outlined" style="color:\${col}">\${ico}</span>
          </div>
          <div class="desp-info">
            <p class="desp-nome">\${d.nome}</p>
            <div class="desp-meta">
              <span class="desp-cat">\${d.cat}</span>
              <span class="badge-tipo \${d.tipo==='fixa'?'badge-fixa':'badge-var'}">\${d.tipo==='fixa'?'Fixa':'Variável'}</span>
              <span class="desp-cat">\${freqLabel(d.frequencia || d.freq)}</span>
              \${d.vencimento || d.venc ? \`<span class="desp-venc"><span class="material-symbols-outlined">event</span> Venc. dia \${d.vencimento || d.venc}</span>\` : ''}
            </div>
          </div>
          <div class="desp-right">
            <p class="desp-val">\${fmtR(d.valor)}</p>
            <div class="desp-actions">
              <button class="desp-btn" onclick="openModal(\${d.id})" title="Editar">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="desp-btn del" onclick="openDel(\${d.id})" title="Excluir">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>\`;
    }).join('');
}

/* ─── MODAL ──────────────────────────────────────────────────────── */
function selectTipo(tipo) {
    document.getElementById('f-tipo').value = tipo;
    document.getElementById('btn-fixa').className = 'tipo-btn' + (tipo==='fixa'?' active-fixa':'');
    document.getElementById('btn-var').className  = 'tipo-btn' + (tipo==='variavel'?' active-var':'');
}

function resetModal() {
    document.getElementById('f-id').value    = '';
    document.getElementById('f-nome').value  = '';
    document.getElementById('f-cat').value   = 'Aluguel';
    document.getElementById('f-valor').value = '';
    document.getElementById('f-freq').value  = 'mensal';
    document.getElementById('f-venc').value  = '';
    document.getElementById('f-obs').value   = '';
    document.getElementById('f-nome-err').style.display  = 'none';
    document.getElementById('f-valor-err').style.display = 'none';
    document.getElementById('f-nome').classList.remove('error');
    document.getElementById('f-valor').classList.remove('error');
    selectTipo('fixa');
}

function openModal(id) {
    resetModal();
    if (id) {
        const d = despesas.find(x => x.id === id);
        if (!d) return;
        document.getElementById('f-id').value    = d.id;
        document.getElementById('f-nome').value  = d.nome;
        document.getElementById('f-cat').value   = d.cat;
        document.getElementById('f-valor').value = d.valor;
        document.getElementById('f-freq').value  = d.frequencia || d.freq || 'mensal';
        document.getElementById('f-venc').value  = d.vencimento || d.venc || '';
        document.getElementById('f-obs').value   = d.obs  || '';
        selectTipo(d.tipo);
        document.getElementById('modal-title').textContent    = 'Editar Despesa';
        document.getElementById('btn-salvar-txt').textContent = 'Atualizar';
    } else {
        document.getElementById('modal-title').textContent    = 'Nova Despesa';
        document.getElementById('btn-salvar-txt').textContent = 'Salvar';
    }
    document.getElementById('modal-desp').classList.add('open');
    setTimeout(() => document.getElementById('f-nome').focus(), 80);
}

function closeModal() { document.getElementById('modal-desp').classList.remove('open'); }

async function salvar() {
    const nome  = document.getElementById('f-nome').value.trim();
    const valor = parseFloat(document.getElementById('f-valor').value);
    let valid = true;
    if (!nome)  { document.getElementById('f-nome').classList.add('error'); document.getElementById('f-nome-err').style.display='block'; valid=false; }
    else        { document.getElementById('f-nome').classList.remove('error'); document.getElementById('f-nome-err').style.display='none'; }
    if (!valor || valor <= 0) { document.getElementById('f-valor').classList.add('error'); document.getElementById('f-valor-err').style.display='block'; valid=false; }
    else        { document.getElementById('f-valor').classList.remove('error'); document.getElementById('f-valor-err').style.display='none'; }
    if (!valid) return;

    document.getElementById('btn-salvar-txt').textContent = 'Salvando...';

    const data = {
        user_id: userId,
        nome,
        categoria: document.getElementById('f-cat').value,
        tipo:  document.getElementById('f-tipo').value,
        valor,
        frequencia:  document.getElementById('f-freq').value,
        vencimento:  parseInt(document.getElementById('f-venc').value) || null,
        obs:   document.getElementById('f-obs').value.trim()
    };

    const idVal = document.getElementById('f-id').value;
    if (idVal) {
        const { error } = await sb.from('despesas').update(data).eq('id', idVal);
        if(!error) showToast(\`"\${nome}" atualizada!\`);
        else showToast(error.message, 'error');
    } else {
        const { error } = await sb.from('despesas').insert(data);
        if(!error) showToast(\`"\${nome}" adicionada!\`);
        else showToast(error.message, 'error');
    }
    await loadDespesas();
    closeModal();
}

/* ─── DELETE ─────────────────────────────────────────────────────── */
function openDel(id) {
    const d = despesas.find(x => x.id === id);
    if (!d) return;
    pendingDelId = id;
    document.getElementById('del-nome').textContent = d.nome;
    document.getElementById('modal-del').classList.add('open');
}
function closeDel() { document.getElementById('modal-del').classList.remove('open'); pendingDelId = null; }
async function confirmarDel() {
    if (!pendingDelId) return;
    const d = despesas.find(x => x.id === pendingDelId);
    await sb.from('despesas').delete().eq('id', pendingDelId);
    await loadDespesas(); 
    closeDel();
    showToast(\`"\${d?.nome}" excluída!\`, 'error');
}

/* ─── EXCLUIR CATEGORIA ──────────────────────────────────────────── */
function openDelCat() {
    if (CATS_TIPO.includes(currentFilter)) return;
    document.getElementById('del-cat-nome').textContent = \`"\${currentFilter}"\`;
    document.getElementById('modal-del-cat').classList.add('open');
}
function closeDelCat() { document.getElementById('modal-del-cat').classList.remove('open'); }
async function confirmarDelCat() {
    const cat = currentFilter;
    const qtd = despesas.filter(d => d.cat === cat).length;
    
    await sb.from('despesas').delete().eq('user_id', userId).eq('categoria', cat);

    currentFilter = 'todas';
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-filter="todas"]').classList.add('active');
    document.getElementById('btn-del-cat').style.display = 'none';
    
    await loadDespesas();
    closeDelCat();
    showToast(\`\${qtd} despesa\${qtd!==1?'s':''} de "\${cat}" excluída\${qtd!==1?'s':''}!\`, 'error');
}
`

html = html.replace(regex, newScript);
html = html.replace('render();', 'checkAuth();');
fs.writeFileSync('despesas.html', html, 'utf8');
