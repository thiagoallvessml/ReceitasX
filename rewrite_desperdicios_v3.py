import re

with open('despesas.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Title and header
html = html.replace('<title>ReceitasX - Despesas</title>', '<title>ReceitasX - Quebras e Lixo</title>')
html = html.replace('<h1 class="text-base font-semibold flex-1">Gestão de Despesas</h1>', '<h1 class="text-base font-semibold flex-1">Controle de Quebras e Lixo</h1>')
html = html.replace('Nova Despesa', 'Novo Registro')
html = html.replace('Total / Mês', 'Prejuízo no Mês')

# Subcards
html = re.sub(r'<div class="s-card s-fixa">[\s\S]*?</div>', '<div class="s-card s-fixa"><p class="s-card-label">Insumos</p><p class="s-card-val" id="s-insumos">R$ 0</p><p class="s-card-sub" id="s-insumos-sub">0 itens</p></div>', html)
html = re.sub(r'<div class="s-card s-var">[\s\S]*?</div>', '<div class="s-card s-var"><p class="s-card-label">Produtos/Receitas</p><p class="s-card-val" id="s-produtos">R$ 0</p><p class="s-card-sub" id="s-produtos-sub">0 itens</p></div>', html)
html = html.replace('<p class="s-card-label">Maior Despesa</p>', '<p class="s-card-label">Maior Prejuízo</p>')

# Replace Search bar placeholder
html = html.replace('Buscar despesa...', 'Buscar registro...')

# Replace Empty State
html = html.replace('Nenhuma despesa encontrada', 'Nenhum registro encontrado')
html = html.replace('Adicione suas despesas fixas ou variáveis', 'Cadastre perdas, produtos vencidos ou quebras para ter controle.')

# Replace Modal Title
html = re.sub(r'<h3 id="modal-title".*?>Novo Registro</h3>', '<h3 id="modal-title" class="text-lg font-bold">Novo Registro de Quebra</h3>', html)

# Remove Filters block
html = re.sub(r'<!-- Filtros -->[\s\S]*?<!-- Contagem -->', '<!-- Contagem -->', html)

# Replace Form body
form_regex = r'<div class="ms-body">[\s\S]*?<div class="ms-foot">'
new_form = """        <div class="ms-body">
            <!-- Tipo -->
            <div>
                <label class="field-label">O que foi perdido?</label>
                <div class="tipo-toggle">
                    <button type="button" class="tipo-btn active-fixa" id="btn-tipo-insumo" onclick="setTipo('insumo')">Insumo</button>
                    <button type="button" class="tipo-btn" id="btn-tipo-receita" onclick="setTipo('receita')">Receita</button>
                    <button type="button" class="tipo-btn" id="btn-tipo-produto" onclick="setTipo('produto')">Produto</button>
                </div>
            </div>

            <!-- Item selection -->
            <div>
                <label class="field-label" id="label-item">Selecione o Insumo</label>
                <div class="select-wrap">
                    <select id="item_id" class="fc" required onchange="updateUnidade()">
                        <option value="">Carregando...</option>
                    </select>
                    <span class="material-symbols-outlined chev">expand_more</span>
                </div>
            </div>

            <!-- Quantidade -->
            <div style="display:flex;gap:1rem">
                <div style="flex:1">
                    <label class="field-label">Quantidade</label>
                    <input type="number" id="quantidade" class="fc" step="0.001" placeholder="Ex: 500" required>
                </div>
                <div style="flex:1">
                    <label class="field-label">Unidade</label>
                    <input type="text" id="unidade" class="fc" placeholder="Ex: g" readonly style="background:#141414 !important; color:#94a3b8 !important;">
                </div>
            </div>

            <!-- Motivo -->
            <div>
                <label class="field-label">Motivo</label>
                <div class="select-wrap">
                    <select id="motivo" class="fc" required>
                        <option value="" disabled selected>Selecione um motivo...</option>
                        <option value="Passou da Validade">Passou da Validade</option>
                        <option value="Erro de Produção">Erro de Produção</option>
                        <option value="Acidente/Quebra">Acidente/Quebra</option>
                        <option value="Brinde">Brinde</option>
                        <option value="Outros">Outros</option>
                    </select>
                    <span class="material-symbols-outlined chev">expand_more</span>
                </div>
            </div>
            
            <!-- Observação (opcional se motivo = outros) -->
            <div>
                <label class="field-label">Observação (opcional)</label>
                <input type="text" id="observacao" class="fc" placeholder="Detalhes adicionais...">
            </div>
        </div>
        <div class="ms-foot">"""
html = re.sub(form_regex, new_form, html)


new_script = """<script>
    let user = null;
    let records = [];
    let state = 'list'; // list, form
    let editId = null;
    let currentTipo = 'insumo';

    let cacheInsumos = [];
    let cacheReceitas = [];
    let cacheProdutos = [];

    document.addEventListener('DOMContentLoaded', async () => {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return window.location.href = 'login.html';
        user = session.user;
        
        await loadCatalogs();
        await loadData();
    });

    async function loadCatalogs() {
        const p1 = sb.from('insumos').select('id, nome, unidade, preco, peso_emb').eq('user_id', user.id).order('nome');
        const p2 = sb.from('receitas').select('id, nome, custo_total, unidades').eq('user_id', user.id).order('nome');
        const p3 = sb.from('produtos').select('id, nome, custo').eq('user_id', user.id).order('nome');
        
        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        
        if (r1.data) cacheInsumos = r1.data;
        if (r2.data) cacheReceitas = r2.data;
        if (r3.data) cacheProdutos = r3.data;
    }

    async function loadData() {
        const { data, error } = await sb.from('desperdicios').select('*').eq('user_id', user.id).order('data_registro', { ascending: false });
        if (error) return console.error(error);
        records = data || [];
        renderList();
        updateStats();
    }

    function renderList() {
        const term = document.getElementById('search-input').value.toLowerCase();
        const filtered = records.filter(r => r.nome_item.toLowerCase().includes(term) || r.motivo.toLowerCase().includes(term));
        
        const c = document.getElementById('list-container');
        const e = document.getElementById('empty-state');
        
        if (filtered.length === 0) {
            c.style.display = 'none';
            e.style.display = 'flex';
            document.getElementById('count-label').textContent = 'Nenhum registro';
            return;
        }
        
        c.style.display = 'flex';
        e.style.display = 'none';
        
        document.getElementById('count-label').textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`;

        let listHtml = '';
        for (let r of filtered) {
            const dateStr = new Date(r.data_registro).toLocaleDateString('pt-BR');
            const icon = r.tipo_item === 'insumo' ? 'kitchen' : (r.tipo_item === 'receita' ? 'menu_book' : 'inventory_2');
            const color = r.tipo_item === 'insumo' ? '#fbbf24' : (r.tipo_item === 'receita' ? '#60a5fa' : '#a78bfa');
            
            listHtml += `
                <div class="list-item" onclick="openEdit('${r.id}')">
                    <div class="li-icon" style="background:${color}20"><span class="material-symbols-outlined" style="color:${color}">${icon}</span></div>
                    <div class="li-info">
                        <div class="li-title">${r.nome_item}</div>
                        <div class="li-sub">${r.quantidade} ${r.unidade || ''} • ${r.motivo}</div>
                    </div>
                    <div class="li-val" style="color:#f87171">
                        - R$ ${parseFloat(r.custo_perdido).toFixed(2).replace('.', ',')}
                        <div style="font-size:0.65rem; color:#64748b; margin-top:2px; text-align:right;">${dateStr}</div>
                    </div>
                </div>
            `;
        }
        c.innerHTML = listHtml;
    }

    function updateStats() {
        let total = 0;
        let tInsumos = 0;
        let cInsumos = 0;
        let tProdutos = 0;
        let cProdutos = 0;
        let maxVal = 0;
        let maxNome = '-';
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthRecords = records.filter(r => {
            const d = new Date(r.data_registro);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        for (let r of monthRecords) {
            const val = parseFloat(r.custo_perdido);
            total += val;
            if (val > maxVal) {
                maxVal = val;
                maxNome = r.nome_item;
            }
            
            if (r.tipo_item === 'insumo') {
                tInsumos += val;
                cInsumos++;
            } else {
                tProdutos += val;
                cProdutos++;
            }
        }
        
        document.getElementById('s-total').innerText = 'R$ ' + total.toFixed(2).replace('.',',');
        document.getElementById('s-total-sub').innerText = monthRecords.length + ' registros este mês';
        
        document.getElementById('s-insumos').innerText = 'R$ ' + tInsumos.toFixed(2).replace('.',',');
        document.getElementById('s-insumos-sub').innerText = cInsumos + ' itens';
        
        document.getElementById('s-produtos').innerText = 'R$ ' + tProdutos.toFixed(2).replace('.',',');
        document.getElementById('s-produtos-sub').innerText = cProdutos + ' itens';
        
        document.getElementById('s-maior').innerText = 'R$ ' + maxVal.toFixed(2).replace('.',',');
        document.getElementById('s-maior-nome').innerText = maxNome;
    }

    function setTipo(tipo) {
        currentTipo = tipo;
        document.getElementById('btn-tipo-insumo').className = 'tipo-btn' + (tipo==='insumo'?' active-fixa':'');
        document.getElementById('btn-tipo-receita').className = 'tipo-btn' + (tipo==='receita'?' active-var':'');
        document.getElementById('btn-tipo-produto').className = 'tipo-btn' + (tipo==='produto'?' active-var':'');
        
        document.getElementById('label-item').innerText = `Selecione ${tipo === 'insumo' ? 'o Insumo' : (tipo === 'receita' ? 'a Receita' : 'o Produto')}`;
        
        populateItemSelect();
    }

    function populateItemSelect() {
        const sel = document.getElementById('item_id');
        let options = '<option value="" disabled selected>Selecione...</option>';
        let list = [];
        
        if (currentTipo === 'insumo') list = cacheInsumos;
        else if (currentTipo === 'receita') list = cacheReceitas;
        else if (currentTipo === 'produto') list = cacheProdutos;
        
        for (let item of list) {
            options += `<option value="${item.id}">${item.nome}</option>`;
        }
        
        if (list.length === 0) {
            options = `<option value="" disabled selected>Nenhum ${currentTipo} cadastrado</option>`;
        }
        
        sel.innerHTML = options;
        updateUnidade();
    }

    function updateUnidade() {
        const id = document.getElementById('item_id').value;
        const uniEl = document.getElementById('unidade');
        uniEl.value = '';
        
        if (!id) return;
        
        if (currentTipo === 'insumo') {
            const item = cacheInsumos.find(i => i.id == id);
            if (item) uniEl.value = item.unidade || 'g';
        } else if (currentTipo === 'receita') {
            uniEl.value = 'receitas';
        } else if (currentTipo === 'produto') {
            uniEl.value = 'unidades';
        }
    }

    function calculateCost() {
        const id = document.getElementById('item_id').value;
        const qtd = parseFloat(document.getElementById('quantidade').value) || 0;
        
        if (!id || qtd <= 0) return 0;
        
        if (currentTipo === 'insumo') {
            const item = cacheInsumos.find(i => i.id == id);
            if (!item || !item.peso_emb) return 0;
            return (parseFloat(item.preco) / parseFloat(item.peso_emb)) * qtd;
        } else if (currentTipo === 'receita') {
            const item = cacheReceitas.find(i => i.id == id);
            if (!item || !item.unidades) return 0;
            return (parseFloat(item.custo_total) / parseInt(item.unidades)) * qtd;
        } else if (currentTipo === 'produto') {
            const item = cacheProdutos.find(i => i.id == id);
            if (!item) return 0;
            return parseFloat(item.custo) * qtd;
        }
        return 0;
    }

    function openModal() {
        state = 'form';
        editId = null;
        document.getElementById('modal-title').innerText = 'Novo Registro de Quebra';
        document.getElementById('btn-del').style.display = 'none';
        
        setTipo('insumo');
        document.getElementById('quantidade').value = '';
        document.getElementById('motivo').value = '';
        document.getElementById('observacao').value = '';
        
        const m = document.getElementById('modal-sheet');
        m.classList.add('open');
        m.querySelector('.ms-content').classList.add('open');
    }

    function openEdit(id) {
        state = 'form';
        editId = id;
        document.getElementById('modal-title').innerText = 'Editar Registro';
        document.getElementById('btn-del').style.display = 'flex';
        
        const r = records.find(x => x.id == id);
        if (!r) return;
        
        setTipo(r.tipo_item);
        setTimeout(() => {
            document.getElementById('item_id').value = r.item_id || '';
            updateUnidade();
        }, 50);
        
        document.getElementById('quantidade').value = r.quantidade;
        
        const motivoSel = document.getElementById('motivo');
        let motivoVal = r.motivo;
        let obsVal = '';
        
        const opts = Array.from(motivoSel.options).map(o => o.value);
        if (!opts.includes(motivoVal)) {
            obsVal = motivoVal;
            motivoVal = 'Outros';
        }
        
        motivoSel.value = motivoVal;
        document.getElementById('observacao').value = obsVal;
        
        const m = document.getElementById('modal-sheet');
        m.classList.add('open');
        m.querySelector('.ms-content').classList.add('open');
    }

    function closeModal() {
        state = 'list';
        const m = document.getElementById('modal-sheet');
        m.querySelector('.ms-content').classList.remove('open');
        setTimeout(() => m.classList.remove('open'), 250);
    }

    async function saveForm() {
        const item_id = document.getElementById('item_id').value;
        const qtd = document.getElementById('quantidade').value;
        const motivoBase = document.getElementById('motivo').value;
        const obs = document.getElementById('observacao').value;
        
        if (!item_id) return showToast('Selecione o item');
        if (!qtd || qtd <= 0) return showToast('Quantidade inválida');
        if (!motivoBase) return showToast('Selecione o motivo');
        
        const btn = document.getElementById('btn-salvar');
        btn.innerHTML = '<span class="material-symbols-outlined spin">sync</span>';
        btn.disabled = true;
        
        const cost = calculateCost();
        
        let nome_item = '';
        if (currentTipo === 'insumo') nome_item = cacheInsumos.find(i=>i.id==item_id)?.nome || '';
        else if (currentTipo === 'receita') nome_item = cacheReceitas.find(i=>i.id==item_id)?.nome || '';
        else if (currentTipo === 'produto') nome_item = cacheProdutos.find(i=>i.id==item_id)?.nome || '';
        
        let finalMotivo = motivoBase;
        if (motivoBase === 'Outros' && obs.trim() !== '') {
            finalMotivo = obs.trim();
        }
        
        const payload = {
            user_id: user.id,
            tipo_item: currentTipo,
            item_id: item_id,
            nome_item: nome_item,
            quantidade: parseFloat(qtd),
            unidade: document.getElementById('unidade').value,
            custo_perdido: cost,
            motivo: finalMotivo
        };
        
        let res;
        if (editId) {
            res = await sb.from('desperdicios').update(payload).eq('id', editId);
        } else {
            res = await sb.from('desperdicios').insert([payload]);
        }
        
        if (res.error) {
            showToast('Erro ao salvar');
            console.error(res.error);
        } else {
            showToast('Salvo com sucesso!');
            closeModal();
            await loadData();
        }
        
        btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Salvar';
        btn.disabled = false;
    }

    let delId = null;
    function confirmDel() {
        delId = editId;
        document.getElementById('del-modal').classList.add('open');
    }
    function cancelDel() {
        document.getElementById('del-modal').classList.remove('open');
    }
    async function execDel() {
        const btn = document.getElementById('btn-exec-del');
        btn.innerHTML = 'Excluindo...';
        await sb.from('desperdicios').delete().eq('id', delId);
        cancelDel();
        closeModal();
        showToast('Registro excluído');
        await loadData();
        btn.innerHTML = 'Excluir';
    }

    function exportarCSV() {
        const head = 'Data,Item,Tipo,Motivo,Quantidade,Unidade,Custo_Perdido';
        const rows = records.map(r =>
            `"${new Date(r.data_registro).toLocaleDateString('pt-BR')}","${r.nome_item}","${r.tipo_item}","${r.motivo}","${r.quantidade}","${r.unidade || ''}","${r.custo_perdido}"`
        );
        const csv = [head, ...rows].join('\\n');
        const a   = document.createElement('a');
        a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\\uFEFF' + csv);
        a.download = 'desperdicios_receitasx.csv';
        a.click();
        showToast('CSV exportado!');
    }

    function toggleDd() { document.getElementById('dd-menu').classList.toggle('open'); }
    function closeDd()  { document.getElementById('dd-menu').classList.remove('open'); }

    let toastTimeout;
    function showToast(msg) {
        const t = document.getElementById('toast');
        t.innerHTML = msg;
        t.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
    }
</script>"""

# Replace the LAST script block (which is the actual main logic script, usually after supabase-js)
parts = html.rsplit('<script>', 1)
if len(parts) > 1:
    old_script_part = parts[1]
    # find the end of this script
    script_end_index = old_script_part.find('</script>')
    if script_end_index != -1:
        rest_of_html = old_script_part[script_end_index + 9:]
        html = parts[0] + new_script + rest_of_html

with open('desperdicios.html', 'w', encoding='utf-8') as f:
    f.write(html)
