/**
 * ReceitasX · Guia de Configuração — Card flutuante
 * Inclua este script em qualquer página do guia para mostrar
 * o progresso atual e um atalho de volta ao guia.
 *
 * Uso: <script src="guia-banner.js"></script>
 *
 * Requer: supabase-client.js já carregado (variável global `sb`)
 */
(function () {
  // Mapa: nome da página (sem extensão) → número do passo no guia
  const PAGE_STEP_MAP = {
    'configuracoes':            1,
    'gerenciar-equipamentos':   2,
    'gerenciar-insumos':        3,
    'gerenciar-embalagens':     4,
    'receitas':                 5,
    'gestao-produtos':          6,
    'precificacao-marketplace': 7,
    'combos':                   8,
    'despesas':                 9,
    'ponto-equilibrio':         10,
  };

  const STEP_LABELS = {
    1:  'Configurações',
    2:  'Equipamentos',
    3:  'Insumos',
    4:  'Embalagens',
    5:  'Receitas',
    6:  'Produtos',
    7:  'Precificação',
    8:  'Combos',
    9:  'Despesas',
    10: 'Ponto de Equilíbrio',
  };

  const TOTAL_STEPS = 7; // Combos, Despesas e Ponto de Equilíbrio são opcionais

  // Detectar página atual (funciona com e sem .html)
  const rawPage = location.pathname.split('/').pop() || '';
  const pageName = rawPage.replace(/\.html$/i, '');
  const currentStep = PAGE_STEP_MAP[pageName];
  if (!currentStep) return; // não é uma página do guia

  // Não mostrar na index (já tem o card próprio)
  if (pageName === 'index') return;

  // Injetar CSS
  const style = document.createElement('style');
  style.textContent = `
    #guia-float-banner {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      z-index: 9999;
      width: calc(100% - 2rem);
      max-width: 420px;
      background: rgba(20,20,20,.97);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(37,244,244,.2);
      border-radius: 1rem;
      padding: .75rem 1rem;
      box-shadow: 0 8px 40px rgba(0,0,0,.6), 0 0 0 1px rgba(37,244,244,.08);
      opacity: 0;
      transition: transform .45s cubic-bezier(.34,1.56,.64,1), opacity .35s ease;
      font-family: 'Inter', sans-serif;
    }
    #guia-float-banner.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    #guia-float-banner .gf-top {
      display: flex;
      align-items: center;
      gap: .65rem;
    }
    #guia-float-banner .gf-ico {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: .6rem;
      background: rgba(37,244,244,.1);
      border: 1px solid rgba(37,244,244,.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #guia-float-banner .gf-ico .material-symbols-outlined {
      font-size: 1.15rem;
      color: #25f4f4;
      font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    }
    #guia-float-banner .gf-content {
      flex: 1;
      min-width: 0;
    }
    #guia-float-banner .gf-title {
      font-size: .72rem;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: .35rem;
    }
    #guia-float-banner .gf-step-badge {
      font-size: .55rem;
      font-weight: 800;
      color: #25f4f4;
      background: rgba(37,244,244,.12);
      border: 1px solid rgba(37,244,244,.25);
      padding: .08rem .35rem;
      border-radius: 9999px;
      letter-spacing: .03em;
    }
    #guia-float-banner .gf-progress-wrap {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-top: .4rem;
    }
    #guia-float-banner .gf-bar-outer {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,.06);
      border-radius: 4px;
      overflow: hidden;
    }
    #guia-float-banner .gf-bar-inner {
      height: 100%;
      background: linear-gradient(90deg, #25f4f4, #0dc8c8);
      border-radius: 4px;
      transition: width .6s ease;
    }
    #guia-float-banner .gf-pct {
      font-size: .6rem;
      font-weight: 700;
      color: #25f4f4;
      min-width: 2rem;
      text-align: right;
    }
    #guia-float-banner .gf-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .3rem;
      font-size: .68rem;
      font-weight: 700;
      color: #25f4f4;
      text-decoration: none;
      background: rgba(37,244,244,.08);
      border: 1px solid rgba(37,244,244,.2);
      border-radius: .55rem;
      padding: .4rem .8rem;
      margin-top: .55rem;
      transition: background .15s, border-color .15s;
      cursor: pointer;
    }
    #guia-float-banner .gf-link:hover {
      background: rgba(37,244,244,.15);
      border-color: rgba(37,244,244,.4);
    }
    #guia-float-banner .gf-link .material-symbols-outlined {
      font-size: .8rem;
    }
    #guia-float-banner .gf-close {
      position: absolute;
      top: .4rem;
      right: .5rem;
      background: none;
      border: none;
      color: #475569;
      cursor: pointer;
      padding: .15rem;
      line-height: 0;
      transition: color .15s;
    }
    #guia-float-banner .gf-close:hover { color: #f1f5f9; }
    #guia-float-banner .gf-close .material-symbols-outlined { font-size: .85rem; }
    #guia-float-banner.complete .gf-ico { background: rgba(52,211,153,.1); border-color: rgba(52,211,153,.25); }
    #guia-float-banner.complete .gf-ico .material-symbols-outlined { color: #34d399; }
    #guia-float-banner.complete .gf-step-badge { background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.25); color: #34d399; }
  `;
  document.head.appendChild(style);

  // Criar DOM
  const banner = document.createElement('div');
  banner.id = 'guia-float-banner';
  banner.innerHTML = `
    <button class="gf-close" onclick="this.parentElement.classList.remove('show')" title="Fechar">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="gf-top">
      <div class="gf-ico">
        <span class="material-symbols-outlined">rocket_launch</span>
      </div>
      <div class="gf-content">
        <div class="gf-title">
          Guia de Configuração
          <span class="gf-step-badge">Etapa ${currentStep} · ${STEP_LABELS[currentStep]}</span>
        </div>
        <div class="gf-progress-wrap">
          <div class="gf-bar-outer"><div class="gf-bar-inner" id="gf-bar" style="width:0%"></div></div>
          <span class="gf-pct" id="gf-pct">0%</span>
        </div>
      </div>
    </div>
    <a class="gf-link" href="guia-configuracao.html">
      <span class="material-symbols-outlined">checklist</span>
      Ver progresso completo
    </a>
  `;
  document.body.appendChild(banner);

  // Verificar se o usuário já fechou o banner nesta sessão
  const dismissKey = 'rx_guia_banner_dismissed';

  // Mostrar banner imediatamente (progresso atualiza depois)
  if (!sessionStorage.getItem(dismissKey)) {
    setTimeout(() => banner.classList.add('show'), 600);
  }

  // Carregar progresso em background
  async function loadGuideProgress() {
    try {
      if (typeof sb === 'undefined') return;

      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      const uid = session.user.id;

      const countTable = async (table) => {
        const { count } = await sb.from(table).select('*', { count: 'exact', head: true }).eq('user_id', uid);
        return count || 0;
      };

      const progress = {};

      // 1. Configurações
      const { count: cfgCount } = await sb.from('configuracoes').select('*', { count: 'exact', head: true }).eq('user_id', uid);
      progress[1] = cfgCount > 0;

      // 2-6: tabelas simples
      progress[2] = await countTable('equipamentos') > 0;
      progress[3] = await countTable('insumos') > 0;
      progress[4] = await countTable('embalagens') > 0;
      progress[5] = await countTable('receitas') > 0;
      progress[6] = await countTable('produtos') > 0;

      // 7. Precificação (localStorage flag)
      progress[7] = localStorage.getItem('receitasx_precificacao_hit') === 'true';

      // 8-9: tabelas opcionais (NÃO contam para o progresso)
      progress[8] = await countTable('combos') > 0;
      progress[9] = await countTable('despesas') > 0;

      // 10. Ponto de Equilíbrio (localStorage)
      progress[10] = localStorage.getItem('receitasx_peq_hit') === 'true';

      // Calcular % (apenas etapas obrigatórias: 1-7 + 10)
      const requiredSteps = [1,2,3,4,5,6,7];
      const doneCount = requiredSteps.filter(k => progress[k]).length;
      const pct = Math.round((doneCount / TOTAL_STEPS) * 100);

      // Se 100%, esconder o banner (guia concluído)
      if (pct >= 100) {
        banner.classList.remove('show');
        return;
      }

      // Se etapa atual já concluída, sinalizar
      if (progress[currentStep]) {
        banner.querySelector('.gf-step-badge').textContent = `Etapa ${currentStep} · ✅ Concluída`;
      }

      // Atualizar barra
      document.getElementById('gf-bar').style.width = pct + '%';
      document.getElementById('gf-pct').textContent = pct + '%';

    } catch (e) {
      console.warn('[guia-banner] Erro:', e);
    }
  }

  // Fechar handler — marca sessão
  banner.querySelector('.gf-close').addEventListener('click', () => {
    sessionStorage.setItem(dismissKey, '1');
  });

  // Aguardar DOM e carregar progresso
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadGuideProgress, 500));
  } else {
    setTimeout(loadGuideProgress, 500);
  }
})();

