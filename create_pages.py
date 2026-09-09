import os

def create_consignados_html():
    content = """<!DOCTYPE html>
<html class="dark" lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Locais Consignados - ReceitasX</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
    <script src="supabase-client.js"></script>
    <script src="auth-guard.js"></script>
    <link rel="stylesheet" href="critical.css" />

    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <script>
        tailwind.config = { darkMode: "class", theme: { extend: { colors: { "primary": "#25f4f4", "background-dark": "#121212", "card-dark": "#1E1E1E", "border-dark": "#2A2A2A" } } } }
    </script>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background-color: #121212; color: #f1f5f9; }
        input, select, textarea { background-color: #1E1E1E !important; color: #f1f5f9 !important; border-color: #2A2A2A !important; border-radius: .6rem; padding: .65rem 1rem; width: 100%; outline: none; }
        input:focus { border-color: rgba(37,244,244,0.5) !important; box-shadow: 0 0 0 3px rgba(37,244,244,0.07) !important; }
        .card { background: #1E1E1E; border: 1px solid #2A2A2A; border-radius: .875rem; padding: 1.25rem; transition: border-color .15s; cursor:pointer;}
        .card:hover { border-color: rgba(139,92,246,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .btn-primary { background: linear-gradient(135deg, #a78bfa, #8b5cf6); color: #fff; padding: .6rem 1.2rem; border-radius: .6rem; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: .4rem; }
        .btn-primary:hover { opacity: .9; }
        .btn-outline { background: transparent; border: 1px solid #2A2A2A; color: #94a3b8; padding: .6rem 1.2rem; border-radius: .6rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content:center; gap: .4rem; transition:all 0.15s; }
        .btn-outline:hover { color: #f1f5f9; border-color: #475569; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; z-index: 100; opacity: 0; pointer-events: none; transition: opacity .2s; }
        .modal-bg.open { opacity: 1; pointer-events: auto; }
        .modal-card { background: #1E1E1E; border: 1px solid #2A2A2A; border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 400px; transform: scale(.95); transition: transform .2s; }
        .modal-bg.open .modal-card { transform: scale(1); }
        .text-purple { color: #a78bfa; }
        .bg-purple-subtle { background: rgba(139,92,246,0.1); }
    </style>
</head>
<body class="pb-20">

<header class="sticky top-0 z-20 bg-background-dark/90 backdrop-blur border-b border-border-dark">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onclick="location.href='index.html'" class="btn-outline" style="border:none;padding:0">
            <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 class="text-base font-semibold flex-1">Locais Consignados</h1>
        <button onclick="openModal()" class="btn-primary text-sm">
            <span class="material-symbols-outlined" style="font-size:1.1rem">add</span> Novo Local
        </button>
    </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-6">
    <div id="loading" class="text-center text-slate-500 py-10">Carregando locais...</div>
    <div id="parceiros-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style="display:none;"></div>
    
    <div id="empty-state" class="text-center py-16" style="display:none;">
        <span class="material-symbols-outlined" style="font-size:3rem;color:#334155;margin-bottom:.5rem">storefront</span>
        <h2 class="text-lg font-bold text-slate-300">Nenhum local cadastrado</h2>
        <p class="text-sm text-slate-500 mb-4 max-w-sm mx-auto mt-2">Cadastre padarias, cafeterias ou mercados onde você deixa seus produtos em consignação.</p>
        <button onclick="openModal()" class="btn-primary mx-auto mt-4">Cadastrar Primeiro Local</button>
    </div>
</main>

<div id="modal-parceiro" class="modal-bg">
    <div class="modal-card">
        <div class="flex justify-between items-center mb-4">
            <h2 id="modal-title" class="font-bold text-lg text-slate-100">Novo Local</h2>
            <button onclick="closeModal()" class="text-slate-500 hover:text-slate-300"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="space-y-4">
            <input type="hidden" id="f-id" />
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Local <span class="text-red-400">*</span></label>
                <input type="text" id="f-nome" placeholder="Ex: Padaria do João" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Responsável</label>
                <input type="text" id="f-resp" placeholder="Ex: João Silva" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone</label>
                <input type="text" id="f-tel" placeholder="(11) 99999-9999" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço</label>
                <input type="text" id="f-end" placeholder="Av. Principal, 123" />
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="closeModal()" class="btn-outline flex-1 justify-center">Cancelar</button>
                <button onclick="salvar()" class="btn-primary flex-1 justify-center">Salvar</button>
            </div>
        </div>
    </div>
</div>

<script>
let parceiros = [];

async function init() {
    const session = await getSession();
    if (!session?.user) {
        window.location.href = 'login.html';
        return;
    }
    await loadDados();
}

async function loadDados() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('parceiros-grid').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    
    try {
        const user = await getUser();
        const { data, error } = await sb.from('consignados_parceiros').select('*').eq('user_id', user.id).order('nome_local');
        if (error) throw error;
        parceiros = data || [];
        render();
    } catch (e) {
        console.error(e);
    }
    document.getElementById('loading').style.display = 'none';
}

function render() {
    const grid = document.getElementById('parceiros-grid');
    const empty = document.getElementById('empty-state');
    
    if (parceiros.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    empty.style.display = 'none';
    grid.style.display = 'grid';
    
    grid.innerHTML = parceiros.map(p => `
        <div class="card" onclick="location.href='consignado-detalhe.html?id=${p.id}'">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-purple-subtle flex items-center justify-center text-purple">
                    <span class="material-symbols-outlined">storefront</span>
                </div>
                <div>
                    <h3 class="font-bold text-slate-100">${p.nome_local}</h3>
                    <p class="text-xs text-slate-400">${p.nome_responsavel || 'Sem responsável'}</p>
                </div>
            </div>
            <div class="space-y-1 mt-4">
                <div class="flex items-center gap-2 text-sm text-slate-400">
                    <span class="material-symbols-outlined" style="font-size:1rem">call</span> ${p.telefone || '-'}
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-400">
                    <span class="material-symbols-outlined" style="font-size:1rem">location_on</span> ${p.endereco || '-'}
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-border-dark flex justify-between items-center">
                <span class="text-xs text-purple font-semibold">Gerenciar Estoque →</span>
                <button onclick="event.stopPropagation(); editar(${p.id})" class="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer p-0">
                    <span class="material-symbols-outlined" style="font-size:1.15rem">edit</span>
                </button>
            </div>
        </div>
    `).join('');
}

function openModal() {
    document.getElementById('f-id').value = '';
    document.getElementById('f-nome').value = '';
    document.getElementById('f-resp').value = '';
    document.getElementById('f-tel').value = '';
    document.getElementById('f-end').value = '';
    document.getElementById('modal-title').textContent = 'Novo Local';
    document.getElementById('modal-parceiro').classList.add('open');
    setTimeout(()=>document.getElementById('f-nome').focus(), 100);
}

function closeModal() {
    document.getElementById('modal-parceiro').classList.remove('open');
}

function editar(id) {
    const p = parceiros.find(x => x.id === id);
    if (!p) return;
    document.getElementById('f-id').value = p.id;
    document.getElementById('f-nome').value = p.nome_local;
    document.getElementById('f-resp').value = p.nome_responsavel || '';
    document.getElementById('f-tel').value = p.telefone || '';
    document.getElementById('f-end').value = p.endereco || '';
    document.getElementById('modal-title').textContent = 'Editar Local';
    document.getElementById('modal-parceiro').classList.add('open');
}

async function salvar() {
    const nome = document.getElementById('f-nome').value.trim();
    if (!nome) {
        alert('Informe o nome do local!');
        return;
    }
    
    const id = document.getElementById('f-id').value;
    const payload = {
        nome_local: nome,
        nome_responsavel: document.getElementById('f-resp').value.trim(),
        telefone: document.getElementById('f-tel').value.trim(),
        endereco: document.getElementById('f-end').value.trim()
    };
    
    try {
        const user = await getUser();
        payload.user_id = user.id;
        
        if (id) {
            await sb.from('consignados_parceiros').update(payload).eq('id', id);
        } else {
            await sb.from('consignados_parceiros').insert([payload]);
        }
        closeModal();
        loadDados();
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar no Supabase.');
    }
}

init();
</script>
</body>
</html>"""
    with open('consignados.html', 'w', encoding='utf-8') as f:
        f.write(content)

def create_consignado_detalhe_html():
    content = """<!DOCTYPE html>
<html class="dark" lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Detalhes do Consignado - ReceitasX</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
    <script src="supabase-client.js"></script>
    <script src="auth-guard.js"></script>
    <link rel="stylesheet" href="critical.css" />

    <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <script>
        tailwind.config = { darkMode: "class", theme: { extend: { colors: { "primary": "#25f4f4", "background-dark": "#121212", "card-dark": "#1E1E1E", "border-dark": "#2A2A2A" } } } }
    </script>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background-color: #121212; color: #f1f5f9; }
        input, select, textarea { background-color: #1E1E1E !important; color: #f1f5f9 !important; border-color: #2A2A2A !important; border-radius: .6rem; padding: .65rem 1rem; width: 100%; outline: none; }
        input:focus { border-color: rgba(37,244,244,0.5) !important; box-shadow: 0 0 0 3px rgba(37,244,244,0.07) !important; }
        .card { background: #1E1E1E; border: 1px solid #2A2A2A; border-radius: .875rem; padding: 1.25rem; }
        .btn-primary { background: linear-gradient(135deg, #a78bfa, #8b5cf6); color: #fff; padding: .6rem 1.2rem; border-radius: .6rem; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; justify-content:center; gap: .4rem; }
        .btn-primary:hover { opacity: .9; }
        .btn-outline { background: transparent; border: 1px solid #2A2A2A; color: #94a3b8; padding: .6rem 1.2rem; border-radius: .6rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content:center; gap: .4rem; transition:all .15s;}
        .btn-outline:hover { color: #f1f5f9; border-color: #475569; }
        .btn-green { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.3); padding: .4rem .8rem; border-radius: .5rem; font-weight: 600; font-size: .8rem; cursor: pointer; display:flex; align-items:center; gap:.2rem; transition:all .15s;}
        .btn-green:hover { background: rgba(16,185,129,0.2); }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; z-index: 100; opacity: 0; pointer-events: none; transition: opacity .2s; }
        .modal-bg.open { opacity: 1; pointer-events: auto; }
        .modal-card { background: #1E1E1E; border: 1px solid #2A2A2A; border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 450px; transform: scale(.95); transition: transform .2s; }
        .modal-bg.open .modal-card { transform: scale(1); }
        .text-purple { color: #a78bfa; }
        .bg-purple-subtle { background: rgba(139,92,246,0.1); }
        
        .tab-btn { padding: .75rem 1rem; color: #64748b; font-weight: 600; border-bottom: 2px solid transparent; cursor: pointer; transition:all .15s; background:transparent;}
        .tab-btn.active { color: #a78bfa; border-bottom-color: #a78bfa; }
        .tab-btn:hover:not(.active) { color: #94a3b8; }
        
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: .75rem 1rem; color: #64748b; font-size: .75rem; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #2A2A2A; white-space:nowrap; }
        td { padding: .85rem 1rem; border-bottom: 1px solid #1f1f1f; font-size: .875rem; white-space:nowrap; }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: rgba(255,255,255,0.02); }
    </style>
</head>
<body class="pb-20">

<header class="sticky top-0 z-20 bg-background-dark/90 backdrop-blur border-b border-border-dark">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onclick="location.href='consignados.html'" class="btn-outline" style="border:none;padding:0">
            <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 class="text-base font-semibold flex-1 truncate" id="hdr-title">Carregando...</h1>
    </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-6">
    <div id="loading" class="text-center text-slate-500 py-10">Carregando dados...</div>
    
    <div id="content" style="display:none;">
        <div class="card mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-purple-subtle flex items-center justify-center text-purple">
                    <span class="material-symbols-outlined" style="font-size:1.5rem">storefront</span>
                </div>
                <div>
                    <h2 id="parceiro-nome" class="text-xl font-bold text-slate-100">...</h2>
                    <p id="parceiro-info" class="text-sm text-slate-400 mt-1 flex items-center gap-3">...</p>
                </div>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
                <button onclick="excluirParceiro()" class="btn-outline text-red-400 border-red-900/50 hover:bg-red-900/20 flex-1 md:flex-none">
                    <span class="material-symbols-outlined" style="font-size:1.1rem">delete</span>
                </button>
                <button onclick="openAddEstoque()" class="btn-primary flex-1 md:flex-none">
                    <span class="material-symbols-outlined" style="font-size:1.1rem">add_box</span> Novo Lote
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="card">
                <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Unidades no Local</p>
                <p class="text-3xl font-bold mt-2" id="kpi-itens">0</p>
            </div>
            <div class="card border-purple-500/30 bg-purple-900/10">
                <p class="text-xs text-purple font-bold uppercase tracking-wider">Expectativa de Venda</p>
                <p class="text-3xl font-bold text-purple mt-2" id="kpi-valor">R$ 0,00</p>
            </div>
            <div class="card border-emerald-500/30 bg-emerald-900/10">
                <p class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Lucro Já Realizado</p>
                <p class="text-3xl font-bold text-emerald-400 mt-2" id="kpi-vendido">R$ 0,00</p>
            </div>
        </div>

        <div class="border-b border-border-dark flex mb-4">
            <button class="tab-btn active" onclick="switchTab('estoque', this)">Estoque Atual</button>
            <button class="tab-btn" onclick="switchTab('historico', this)">Histórico de Vendas</button>
        </div>

        <div id="tab-estoque" class="card overflow-x-auto p-0">
            <table class="min-w-full">
                <thead>
                    <tr>
                        <th class="pl-5">Produto</th>
                        <th>Estoque</th>
                        <th>Venda (R$)</th>
                        <th>Comissão (%)</th>
                        <th class="text-right pr-5">Ações</th>
                    </tr>
                </thead>
                <tbody id="estoque-body"></tbody>
            </table>
            <div id="estoque-empty" class="text-center py-10 text-slate-500" style="display:none">
                <span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:.5rem">inventory_2</span>
                <p>Nenhum item no estoque deste local.</p>
                <button onclick="openAddEstoque()" class="btn-primary mx-auto mt-3 text-sm px-3 py-1.5">Adicionar Primeiro Lote</button>
            </div>
        </div>

        <div id="tab-historico" class="card overflow-x-auto p-0" style="display:none">
            <table class="min-w-full">
                <thead>
                    <tr>
                        <th class="pl-5">Data</th>
                        <th>Produto</th>
                        <th>Qtd.</th>
                        <th>V. Bruto</th>
                        <th class="pr-5">V. Líquido (Você)</th>
                    </tr>
                </thead>
                <tbody id="vendas-body"></tbody>
            </table>
            <div id="vendas-empty" class="text-center py-10 text-slate-500" style="display:none">
                <span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:.5rem">receipt_long</span>
                <p>Nenhuma venda registrada ainda.</p>
            </div>
        </div>
    </div>
</main>

<!-- Modal Add Estoque -->
<div id="modal-estoque" class="modal-bg">
    <div class="modal-card">
        <h2 class="font-bold text-lg mb-4 text-slate-100">Adicionar Lote</h2>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Buscar do Catálogo (Opcional)</label>
                <select id="f-prod" onchange="autoFillProd()"></select>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Produto <span class="text-red-400">*</span></label>
                <input type="text" id="f-nome" placeholder="Ex: Bolo de Pote de Ninho" />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quantidade</label>
                    <input type="number" id="f-qtd" value="1" min="1" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Preço Venda (R$)</label>
                    <input type="number" step="0.01" id="f-preco" placeholder="0.00" />
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Comissão do Parceiro (%)</label>
                <div class="relative">
                    <input type="number" step="0.1" id="f-comissao" placeholder="Ex: 30" style="padding-right:2rem;" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">%</span>
                </div>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="document.getElementById('modal-estoque').classList.remove('open')" class="btn-outline flex-1">Cancelar</button>
                <button onclick="salvarEstoque()" class="btn-primary flex-1 justify-center">Salvar Lote</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Registrar Venda -->
<div id="modal-venda" class="modal-bg">
    <div class="modal-card">
        <h2 class="font-bold text-lg mb-1 text-slate-100">Registrar Venda</h2>
        <p id="venda-produto-nome" class="text-sm text-purple mb-5 font-semibold">...</p>
        <div class="space-y-4">
            <input type="hidden" id="v-id" />
            <div class="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <span class="text-slate-400 text-sm">Restante no local</span>
                <span id="v-max" class="font-bold text-lg">0</span>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quantidade Vendida</label>
                <div class="flex items-center gap-2">
                    <button onclick="modVenda(-1)" class="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold border border-slate-700 hover:bg-slate-700">-</button>
                    <input type="number" id="v-qtd" value="1" min="1" class="text-center font-bold text-lg" oninput="calcVenda()" />
                    <button onclick="modVenda(1)" class="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold border border-slate-700 hover:bg-slate-700">+</button>
                </div>
            </div>
            <div class="bg-purple-subtle border border-purple-900/30 p-4 rounded-xl mt-4">
                <div class="flex justify-between text-sm mb-2 text-slate-300">
                    <span>Valor Bruto:</span>
                    <span id="v-bruto" class="font-semibold">R$ 0,00</span>
                </div>
                <div class="flex justify-between text-sm text-emerald-400 items-center">
                    <span class="font-semibold">Líquido (Pra você):</span>
                    <span id="v-liq" class="font-bold text-lg">R$ 0,00</span>
                </div>
            </div>
            <div class="flex gap-2 pt-2">
                <button onclick="document.getElementById('modal-venda').classList.remove('open')" class="btn-outline flex-1">Cancelar</button>
                <button onclick="confirmarVenda()" class="btn-primary flex-1 justify-center">Confirmar Venda</button>
            </div>
        </div>
    </div>
</div>

<script>
const urlParams = new URLSearchParams(window.location.search);
const parceiroId = urlParams.get('id');

let parceiro = null;
let estoque = [];
let vendas = [];
let produtos = []; // user catalog
let vendaTemp = null; // item being sold

const fmtR = (v) => 'R$ ' + Number(v||0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});

async function init() {
    if(!parceiroId) { window.location.href='consignados.html'; return; }
    const session = await getSession();
    if (!session?.user) { window.location.href = 'login.html'; return; }
    await loadDados();
}

async function loadDados() {
    try {
        const user = await getUser();
        
        // Load Parceiro
        const { data: pData } = await sb.from('consignados_parceiros').select('*').eq('id', parceiroId).single();
        if(!pData) { alert('Parceiro não encontrado'); window.location.href='consignados.html'; return; }
        parceiro = pData;
        
        document.getElementById('hdr-title').textContent = parceiro.nome_local;
        document.getElementById('parceiro-nome').textContent = parceiro.nome_local;
        
        const infos = [];
        if(parceiro.nome_responsavel) infos.push(`<span class="material-symbols-outlined" style="font-size:14px">person</span> ${parceiro.nome_responsavel}`);
        if(parceiro.telefone) infos.push(`<span class="material-symbols-outlined" style="font-size:14px">call</span> ${parceiro.telefone}`);
        if(parceiro.endereco) infos.push(`<span class="material-symbols-outlined" style="font-size:14px">location_on</span> ${parceiro.endereco}`);
        document.getElementById('parceiro-info').innerHTML = infos.join(' &nbsp;&bull;&nbsp; ');
        
        // Load Estoque
        const { data: eData } = await sb.from('consignados_estoque').select('*').eq('parceiro_id', parceiroId).order('id', {ascending:false});
        estoque = eData || [];
        
        // Load Vendas
        const { data: vData } = await sb.from('consignados_vendas').select('*').eq('parceiro_id', parceiroId).order('created_at', {ascending:false});
        vendas = vData || [];
        
        // Load User Catalog
        const { data: prodData } = await sb.from('produtos').select('id, nome, preco, consignado').eq('user_id', user.id).eq('ativo', true).order('nome');
        produtos = prodData || [];
        
        render();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    } catch(e) {
        console.error(e);
        alert('Erro ao carregar dados');
    }
}

function render() {
    // KPIs
    let tItens = 0;
    let vEstimado = 0;
    estoque.forEach(e => {
        tItens += e.quantidade_restante;
        const liq = e.preco_venda * (1 - (e.taxa_comissao/100));
        vEstimado += (liq * e.quantidade_restante);
    });
    
    let vVendido = 0;
    vendas.forEach(v => vVendido += parseFloat(v.valor_liquido||0));
    
    document.getElementById('kpi-itens').textContent = tItens;
    document.getElementById('kpi-valor').textContent = fmtR(vEstimado);
    document.getElementById('kpi-vendido').textContent = fmtR(vVendido);
    
    // Estoque
    const tbodyE = document.getElementById('estoque-body');
    if(estoque.length === 0) {
        tbodyE.innerHTML = '';
        document.getElementById('estoque-empty').style.display = 'block';
    } else {
        document.getElementById('estoque-empty').style.display = 'none';
        tbodyE.innerHTML = estoque.map(e => {
            const isEmpty = e.quantidade_restante <= 0;
            return `
            <tr style="opacity: ${isEmpty ? '0.6' : '1'}">
                <td class="pl-5">
                    <p class="font-semibold text-slate-100">${e.nome_produto}</p>
                    <p class="text-xs text-slate-500">Add em ${new Date(e.created_at).toLocaleDateString('pt-BR')}</p>
                </td>
                <td>
                    <span class="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-bold ${isEmpty ? 'text-red-400' : 'text-slate-200'}">${e.quantidade_restante}</span> 
                    <span class="text-xs text-slate-500 ml-1">de ${e.quantidade}</span>
                </td>
                <td class="font-semibold">${fmtR(e.preco_venda)}</td>
                <td><span class="text-purple bg-purple-subtle px-2 py-0.5 rounded font-bold">${e.taxa_comissao}%</span></td>
                <td class="text-right pr-5">
                    ${!isEmpty ? `<button onclick="openVenda(${e.id})" class="btn-green ml-auto"><span class="material-symbols-outlined" style="font-size:18px">point_of_sale</span> Vender</button>` : '<span class="text-xs font-bold text-red-400 bg-red-900/20 px-2 py-1 rounded">Esgotado</span>'}
                </td>
            </tr>
            `;
        }).join('');
    }
    
    // Vendas
    const tbodyV = document.getElementById('vendas-body');
    if(vendas.length === 0) {
        tbodyV.innerHTML = '';
        document.getElementById('vendas-empty').style.display = 'block';
    } else {
        document.getElementById('vendas-empty').style.display = 'none';
        tbodyV.innerHTML = vendas.map(v => `
            <tr>
                <td class="pl-5 text-sm text-slate-400">${new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                <td class="font-semibold text-slate-200">${v.nome_produto}</td>
                <td><span class="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold">${v.quantidade}</span></td>
                <td class="text-slate-400">${fmtR(v.valor_bruto)}</td>
                <td class="font-bold text-emerald-400 pr-5">${fmtR(v.valor_liquido)}</td>
            </tr>
        `).join('');
    }
}

function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-estoque').style.display = tab === 'estoque' ? 'block' : 'none';
    document.getElementById('tab-historico').style.display = tab === 'historico' ? 'block' : 'none';
}

function openAddEstoque() {
    let opts = '<option value="">-- Selecione ou digite abaixo --</option>';
    produtos.forEach(p => opts += `<option value="${p.id}">${p.nome}</option>`);
    document.getElementById('f-prod').innerHTML = opts;
    
    document.getElementById('f-nome').value = '';
    document.getElementById('f-qtd').value = '1';
    document.getElementById('f-preco').value = '';
    document.getElementById('f-comissao').value = '';
    document.getElementById('modal-estoque').classList.add('open');
}

function autoFillProd() {
    const pId = document.getElementById('f-prod').value;
    if(!pId) return;
    const p = produtos.find(x => x.id == pId);
    if(p) {
        document.getElementById('f-nome').value = p.nome;
        document.getElementById('f-preco').value = p.preco || '';
        document.getElementById('f-comissao').value = p.consignado || '';
    }
}

async function salvarEstoque() {
    const nome = document.getElementById('f-nome').value.trim();
    const qtd = parseInt(document.getElementById('f-qtd').value) || 0;
    const preco = parseFloat(document.getElementById('f-preco').value) || 0;
    const comissao = parseFloat(document.getElementById('f-comissao').value) || 0;
    
    if(!nome || qtd <= 0 || preco <= 0) return alert('Preencha os campos corretamente');
    
    const pId = document.getElementById('f-prod').value;
    
    try {
        const user = await getUser();
        const payload = {
            user_id: user.id,
            parceiro_id: parceiroId,
            produto_id: pId || null,
            nome_produto: nome,
            quantidade: qtd,
            quantidade_restante: qtd,
            preco_venda: preco,
            taxa_comissao: comissao
        };
        await sb.from('consignados_estoque').insert([payload]);
        document.getElementById('modal-estoque').classList.remove('open');
        loadDados();
    } catch(e) {
        console.error(e);
        alert('Erro ao adicionar');
    }
}

function modVenda(val) {
    const inp = document.getElementById('v-qtd');
    let nv = parseInt(inp.value) + val;
    if(nv < 1) nv = 1;
    if(nv > vendaTemp.quantidade_restante) nv = vendaTemp.quantidade_restante;
    inp.value = nv;
    calcVenda();
}

function openVenda(id) {
    const item = estoque.find(e => e.id === id);
    if(!item) return;
    vendaTemp = item;
    document.getElementById('v-id').value = id;
    document.getElementById('venda-produto-nome').textContent = item.nome_produto;
    document.getElementById('v-max').textContent = item.quantidade_restante;
    document.getElementById('v-qtd').value = 1;
    document.getElementById('v-qtd').max = item.quantidade_restante;
    calcVenda();
    document.getElementById('modal-venda').classList.add('open');
}

function calcVenda() {
    if(!vendaTemp) return;
    let q = parseInt(document.getElementById('v-qtd').value) || 1;
    if (q > vendaTemp.quantidade_restante) { q = vendaTemp.quantidade_restante; document.getElementById('v-qtd').value = q; }
    if (q < 1) { q = 1; document.getElementById('v-qtd').value = q; }
    
    const bruto = vendaTemp.preco_venda * q;
    const liq = bruto * (1 - (vendaTemp.taxa_comissao/100));
    
    document.getElementById('v-bruto').textContent = fmtR(bruto);
    document.getElementById('v-liq').textContent = fmtR(liq);
}

async function confirmarVenda() {
    if(!vendaTemp) return;
    const q = parseInt(document.getElementById('v-qtd').value) || 1;
    if(q <= 0 || q > vendaTemp.quantidade_restante) return alert('Quantidade inválida');
    
    const bruto = vendaTemp.preco_venda * q;
    const liq = bruto * (1 - (vendaTemp.taxa_comissao/100));
    
    try {
        const user = await getUser();
        // 1. Registra venda
        await sb.from('consignados_vendas').insert([{
            user_id: user.id,
            parceiro_id: parceiroId,
            estoque_id: vendaTemp.id,
            nome_produto: vendaTemp.nome_produto,
            quantidade: q,
            valor_bruto: bruto,
            valor_liquido: liq
        }]);
        // 2. Abate estoque
        const newQtd = vendaTemp.quantidade_restante - q;
        await sb.from('consignados_estoque').update({ quantidade_restante: newQtd }).eq('id', vendaTemp.id);
        
        document.getElementById('modal-venda').classList.remove('open');
        loadDados();
    } catch(e) {
        console.error(e);
        alert('Erro ao registrar venda no Supabase');
    }
}

async function excluirParceiro() {
    if(confirm('Tem certeza que deseja excluir este local? Todo o estoque e histórico de vendas consignadas daqui serão perdidos.')) {
        try {
            await sb.from('consignados_parceiros').delete().eq('id', parceiroId);
            window.location.href = 'consignados.html';
        } catch(e) {
            alert('Erro ao excluir do Supabase');
        }
    }
}

init();
</script>
</body>
</html>"""
    with open('consignado-detalhe.html', 'w', encoding='utf-8') as f:
        f.write(content)

create_consignados_html()
create_consignado_detalhe_html()
print("Files created successfully.")
