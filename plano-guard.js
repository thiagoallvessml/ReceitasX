/**
 * plano-guard.js — ReceitasX
 * Gerencia limites do plano gratuito.
 * Requer: supabase-client.js carregado antes deste arquivo.
 *
 * Regra-chave: o limite é baseado no TOTAL JÁ CRIADO (nunca decrementa
 * ao deletar). Ex: se criou 2 receitas e deletou as 2, ainda não pode criar mais.
 */

/* ── Limites do plano gratuito ────────────────────────────────── */
const LIMITES_GRATUITO = {
  receitas:      2,
  produtos:      2,
  insumos:       7,
  embalagens:    2,
  equipamentos:  1,
  combos:        0,
  precificacoes: 2,
};

const NOMES_RECURSO = {
  receitas:      'Receita',
  produtos:      'Produto',
  insumos:       'Insumo',
  embalagens:    'Embalagem',
  equipamentos:  'Equipamento',
  combos:        'Combo',
  precificacoes: 'Precificação',
};

const USO_KEY = 'receitasx_uso_plano'; // localStorage

/* ── Cache do plano (evita múltiplas queries) ─────────────────── */
let _planoPago = null;   // true | false | null (não verificado ainda)
let _planoChecando = false;

/**
 * Retorna true se o usuário tem plano pago (pedido com status='pago').
 * Usa cache para evitar múltiplas chamadas.
 */
async function isPlanoPago() {
  if (_planoPago !== null) return _planoPago;
  if (_planoChecando) {
    await new Promise(r => setTimeout(r, 300));
    return _planoPago ?? false;
  }
  _planoChecando = true;
  try {
    // Supabase pode não estar carregado em páginas sem supabase-client.js
    if (typeof getUser !== 'function' || typeof sb === 'undefined') {
      _planoPago = false;
      return false;
    }
    const user = await getUser();
    if (!user) { _planoPago = false; return false; }

    const { data } = await sb
      .from('pedidos')
      .select('id')
      .eq('status', 'pago')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1);

    _planoPago = !!(data && data.length > 0);
  } catch (e) {
    console.warn('plano-guard: erro ao verificar plano', e);
    _planoPago = false;
  } finally {
    _planoChecando = false;
  }
  return _planoPago;
}

/* ── Leitura / gravação do uso no localStorage ────────────────── */
function getUsoAtual() {
  try {
    return JSON.parse(localStorage.getItem(USO_KEY) || '{}');
  } catch { return {}; }
}

function getTotalCriado(recurso) {
  return getUsoAtual()[recurso] || 0;
}

/**
 * Registra a criação de um item. Chame APÓS salvar com sucesso.
 * @param {string} recurso  chave do LIMITES_GRATUITO
 */
function registrarCriacao(recurso) {
  const uso = getUsoAtual();
  uso[recurso] = (uso[recurso] || 0) + 1;
  localStorage.setItem(USO_KEY, JSON.stringify(uso));
}

/**
 * Verifica se o usuário pode criar mais itens do recurso.
 * @param {string} recurso
 * @returns {Promise<{ok: boolean, totalCriado: number, limite: number}>}
 */
async function verificarLimite(recurso) {
  const pago = await isPlanoPago();
  if (pago) return { ok: true, totalCriado: 0, limite: Infinity };

  const limite = LIMITES_GRATUITO[recurso] ?? Infinity;
  const totalCriado = getTotalCriado(recurso);

  return { ok: totalCriado < limite, totalCriado, limite };
}

/* ── Modal de bloqueio ────────────────────────────────────────── */
(function injectBloqueioModal() {
  if (document.getElementById('plano-bloqueio-overlay')) return;
  const el = document.createElement('div');
  el.id = 'plano-bloqueio-overlay';
  el.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:1rem;
    opacity:0;pointer-events:none;transition:opacity .25s;
  `;
  el.innerHTML = `
    <div id="plano-bloqueio-card" style="
      background:#1A1A1A;border:1px solid #2A2A2A;border-radius:1.25rem;
      width:100%;max-width:400px;padding:2rem 1.5rem;text-align:center;
      animation:fadeUpBloq .28s ease both;
    ">
      <div style="width:3.5rem;height:3.5rem;border-radius:50%;
        background:linear-gradient(135deg,rgba(251,191,36,.2),rgba(251,191,36,.05));
        border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;
        justify-content:center;margin:0 auto 1rem;">
        <span class="material-symbols-outlined" style="font-size:1.6rem;color:#fbbf24;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24">lock</span>
      </div>
      <h2 id="plano-bloq-titulo" style="font-size:1rem;font-weight:700;color:#f1f5f9;margin-bottom:.5rem">
        Limite do Plano Gratuito
      </h2>
      <p id="plano-bloq-msg" style="font-size:.85rem;color:#64748b;line-height:1.6;margin-bottom:1.5rem">
        Você atingiu o limite do plano gratuito.
      </p>
      <a href="acesso-vitalicio.html" style="
        display:block;padding:.8rem;border-radius:.75rem;
        background:linear-gradient(135deg,#25f4f4,#0dc8c8);
        color:#0a0a0a;font-weight:700;font-size:.9rem;text-decoration:none;
        margin-bottom:.65rem;transition:opacity .2s;
      " onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
        🚀 Fazer Upgrade — Acesso Vitalício
      </a>
      <button onclick="fecharBloqueio()" style="
        width:100%;padding:.65rem;border-radius:.75rem;border:1px solid #2A2A2A;
        background:transparent;color:#64748b;font-size:.85rem;font-weight:600;cursor:pointer;
        transition:all .15s;
      " onmouseover="this.style.borderColor='#475569';this.style.color='#94a3b8'"
         onmouseout="this.style.borderColor='#2A2A2A';this.style.color='#64748b'">
        Fechar
      </button>
    </div>
    <style>
      @keyframes fadeUpBloq { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    </style>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) fecharBloqueio(); });
})();

function mostrarBloqueio(recurso) {
  const nome   = NOMES_RECURSO[recurso] || recurso;
  const limite = LIMITES_GRATUITO[recurso] ?? 0;
  const total  = getTotalCriado(recurso);
  const ov     = document.getElementById('plano-bloqueio-overlay');
  if (!ov) return;

  document.getElementById('plano-bloq-titulo').textContent =
    limite === 0
      ? `${nome}s bloqueados no Plano Gratuito`
      : `Limite de ${nome}s atingido`;

  document.getElementById('plano-bloq-msg').innerHTML =
    limite === 0
      ? `A criação de <strong>${nome}s</strong> não está disponível no plano gratuito.<br>Faça upgrade para criar combos ilimitados.`
      : `Você já criou <strong>${total}</strong> de <strong>${limite}</strong> ${nome.toLowerCase()}${limite > 1 ? 's' : ''} permitidos no plano gratuito.<br><br>Mesmo após excluir itens, o limite é calculado pelo total já criado.`;

  ov.style.opacity = '1';
  ov.style.pointerEvents = 'all';
}

function fecharBloqueio() {
  const ov = document.getElementById('plano-bloqueio-overlay');
  if (ov) { ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; }
}

/**
 * Utilitário: chame antes de abrir modal de criação.
 * Retorna true se pode criar, false (e mostra bloqueio) se não pode.
 * @param {string} recurso
 */
async function podecriar(recurso) {
  const { ok } = await verificarLimite(recurso);
  if (!ok) mostrarBloqueio(recurso);
  return ok;
}

// Expõe globalmente
window.podecriar       = podecriar;       // alias lowercase para templates
window.podecriar       = podecriar;
window.registrarCriacao = registrarCriacao;
window.mostrarBloqueio  = mostrarBloqueio;
window.fecharBloqueio   = fecharBloqueio;
window.isPlanoPago      = isPlanoPago;
