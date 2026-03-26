/* ══════════════════════════════════════════════════════════════════
   notificacoes-afiliado.js
   Notificações em tempo real quando uma comissão é confirmada.
   Inclua APÓS supabase-client.js em qualquer página de afiliado.
═══════════════════════════════════════════════════════════════════ */

(async function initNotificacoesAfiliado() {
    if (typeof getUser === 'undefined' || typeof sb === 'undefined') return;

    const user = await getUser();
    if (!user) return;

    /* ── Busca o afiliado_id do usuário logado ── */
    let afiliadoId = null;
    try {
        const { data } = await sb
            .from('afiliados')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        if (!data) return; // usuário não é afiliado, sai silenciosamente
        afiliadoId = data.id;
    } catch (_) { return; }

    /* ── Injeta estilos (apenas uma vez) ── */
    if (!document.getElementById('notif-afiliado-style')) {
        const s = document.createElement('style');
        s.id = 'notif-afiliado-style';
        s.textContent = `
        /* Confetti */
        @keyframes _confettiFall {
            0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh)  rotate(720deg); opacity: 0; }
        }
        .notif-confetti {
            position: fixed; top: -20px; z-index: 9999; pointer-events: none;
            border-radius: 2px;
            animation: _confettiFall linear forwards;
        }

        /* Overlay */
        #notif-afil-overlay {
            position: fixed; inset: 0; z-index: 9000;
            background: rgba(0,0,0,.72);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            padding: 1rem;
            animation: _notifFadeIn .35s ease both;
        }
        @keyframes _notifFadeIn { from { opacity: 0; } to { opacity: 1; } }

        #notif-afil-card {
            background: linear-gradient(145deg, #0d2626 0%, #0a1616 60%, #0a0a0a 100%);
            border: 1px solid rgba(37,244,244,.35);
            border-radius: 1.5rem;
            padding: 2rem 1.75rem;
            max-width: 360px; width: 100%;
            text-align: center;
            box-shadow: 0 0 60px rgba(37,244,244,.18), 0 24px 48px rgba(0,0,0,.7);
            animation: _notifPop .5s cubic-bezier(.34,1.56,.64,1) both .08s;
            position: relative; overflow: hidden;
        }
        @keyframes _notifPop {
            from { transform: scale(.65) translateY(20px); opacity: 0; }
            to   { transform: scale(1)   translateY(0); opacity: 1; }
        }
        #notif-afil-card::before {
            content: '';
            position: absolute; top: -60px; right: -60px;
            width: 200px; height: 200px; border-radius: 50%;
            background: radial-gradient(circle, rgba(37,244,244,.12), transparent 70%);
            pointer-events: none;
        }

        .notif-afil-emoji {
            font-size: 3rem; display: block; margin-bottom: .75rem;
            animation: _notifBounce .65s ease infinite alternate .2s;
        }
        @keyframes _notifBounce {
            from { transform: translateY(0) rotate(-5deg); }
            to   { transform: translateY(-8px) rotate(5deg); }
        }
        .notif-afil-title {
            font-size: 1.15rem; font-weight: 800; color: #f1f5f9;
            margin-bottom: .25rem; font-family: 'Inter', sans-serif;
        }
        .notif-afil-sub {
            font-size: .82rem; color: #64748b; margin-bottom: 1.25rem;
            font-family: 'Inter', sans-serif; line-height: 1.5;
        }
        .notif-afil-valor {
            font-size: 2.75rem; font-weight: 900; color: #25f4f4;
            line-height: 1; margin-bottom: 1.5rem;
            text-shadow: 0 0 30px rgba(37,244,244,.45);
            font-family: 'Inter', sans-serif;
        }
        .notif-afil-valor small {
            font-size: 1rem; font-weight: 600;
            color: #64748b; margin-right: .3rem;
        }
        .notif-afil-btn-p {
            display: block; width: 100%; padding: .85rem;
            border-radius: .85rem; border: none;
            background: linear-gradient(135deg, #25f4f4, #0dc8c8);
            color: #0a0a0a; font-weight: 800; font-size: .95rem;
            cursor: pointer; margin-bottom: .6rem;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 4px 20px rgba(37,244,244,.35);
            transition: opacity .2s;
        }
        .notif-afil-btn-p:hover { opacity: .88; }
        .notif-afil-btn-s {
            display: block; width: 100%; padding: .7rem;
            border-radius: .85rem; border: 1px solid #2A2A2A;
            background: transparent; color: #94a3b8;
            font-weight: 600; font-size: .85rem; cursor: pointer;
            font-family: 'Inter', sans-serif; transition: all .15s;
        }
        .notif-afil-btn-s:hover { color: #f1f5f9; border-color: #475569; }

        /* Badge sino */
        #notif-sino-badge {
            position: fixed; top: 1rem; right: 1rem;
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            color: #fff; border-radius: 9999px;
            font-size: .7rem; font-weight: 800;
            min-width: 1.35rem; height: 1.35rem;
            display: none; align-items: center; justify-content: center;
            padding: 0 .35rem; z-index: 8999;
            box-shadow: 0 2px 12px rgba(239,68,68,.5);
            animation: _notifPulse 1.5s ease infinite;
            cursor: pointer;
        }
        @keyframes _notifPulse {
            0%,100% { box-shadow: 0 2px 12px rgba(239,68,68,.5); }
            50%      { box-shadow: 0 2px 24px rgba(239,68,68,.8); }
        }
        `;
        document.head.appendChild(s);
    }

    /* ── Confetti ── */
    function lancarConfetti() {
        const cores = ['#25f4f4','#fbbf24','#34d399','#f87171','#a78bfa','#60a5fa','#fff'];
        for (let i = 0; i < 70; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = 'notif-confetti';
                el.style.cssText = `
                    left: ${Math.random() * 100}vw;
                    background: ${cores[Math.floor(Math.random() * cores.length)]};
                    width:  ${5 + Math.random() * 9}px;
                    height: ${5 + Math.random() * 9}px;
                    border-radius: ${Math.random() > .4 ? '50%' : '2px'};
                    animation-duration: ${1.8 + Math.random() * 2.2}s;
                    animation-delay: ${Math.random() * .4}s;
                `;
                document.body.appendChild(el);
                el.addEventListener('animationend', () => el.remove());
            }, i * 25);
        }
    }

    /* ── Overlay de celebração ── */
    function mostrarCelebracao(comissao) {
        document.getElementById('notif-afil-overlay')?.remove();

        const fmtVal = Number(comissao || 0)
            .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Persiste no histórico do sino (index.html)
        if (typeof window.adicionarNotificacao === 'function') {
            window.adicionarNotificacao({
                tipo:   'comissao',
                titulo: '🎉 Comissão Confirmada!',
                desc:   `Você ganhou R$ ${fmtVal} de comissão. Saldo atualizado!`,
                href:   'extrato-vendas.html',
            });
        } else {
            // Salva direto no localStorage para estar disponível quando abrir index
            const KEY  = 'receitasx_notificacoes';
            const list = JSON.parse(localStorage.getItem(KEY) || '[]');
            list.unshift({
                id:     Date.now().toString(),
                tipo:   'comissao',
                titulo: '🎉 Comissão Confirmada!',
                desc:   `Você ganhou R$ ${fmtVal} de comissão. Saldo atualizado!`,
                href:   'extrato-vendas.html',
                ts:     Date.now(),
                lido:   false,
            });
            localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
        }

        const overlay = document.createElement('div');
        overlay.id = 'notif-afil-overlay';
        overlay.innerHTML = `
            <div id="notif-afil-card">
                <span class="notif-afil-emoji">🎉</span>
                <p class="notif-afil-title">Comissão Confirmada!</p>
                <p class="notif-afil-sub">Uma das suas indicações acabou de converter.<br>O valor já está no seu saldo!</p>
                <div class="notif-afil-valor"><small>R$</small>${fmtVal}</div>
                <button class="notif-afil-btn-p" onclick="location.href='extrato-vendas.html'">
                    💰 Ver meus ganhos
                </button>
                <button class="notif-afil-btn-s" onclick="document.getElementById('notif-afil-overlay').remove()">
                    Fechar
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Fecha ao clicar no fundo
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.remove();
        });

        lancarConfetti();

        // Auto-dismiss em 18s
        setTimeout(() => overlay?.remove(), 18000);
    }

    /* ── Browser Push Notification ── */
    async function notificarBrowser(comissao) {
        if (!('Notification' in window)) return;
        const fmtVal = Number(comissao || 0)
            .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (Notification.permission === 'default') {
            await Notification.requestPermission().catch(() => {});
        }
        if (Notification.permission === 'granted') {
            try {
                const n = new Notification('🎉 Comissão Confirmada! — ReceitasX', {
                    body: `Você ganhou R$ ${fmtVal} de comissão! Toque para ver seus ganhos.`,
                    icon: '/favicon.ico',
                    tag: 'comissao-' + Date.now(),
                    requireInteraction: true,
                });
                n.onclick = () => { window.focus(); location.href = 'extrato-vendas.html'; };
            } catch (_) {}
        }
    }

    /* ── Pede permissão de notificação discretamente ── */
    async function pedirPermissaoSilenciosa() {
        if ('Notification' in window && Notification.permission === 'default') {
            // Aguarda interação do usuário para pedir permissão
            const pedirAposInteracao = () => {
                Notification.requestPermission().catch(() => {});
                document.removeEventListener('click', pedirAposInteracao);
            };
            document.addEventListener('click', pedirAposInteracao);
        }
    }

    pedirPermissaoSilenciosa();

    /* ── Inscrição no Realtime ── */
    try {
        sb.channel(`comissoes-${afiliadoId}`)
            .on(
                'postgres_changes',
                {
                    event:  'UPDATE',
                    schema: 'public',
                    table:  'indicacoes',
                    filter: `afiliado_id=eq.${afiliadoId}`,
                },
                (payload) => {
                    const nova    = payload.new;
                    const antiga  = payload.old;
                    // Só dispara quando converteu muda de false → true
                    if (nova.converteu === true && antiga.converteu === false) {
                        const comissao = parseFloat(nova.comissao || 0);
                        mostrarCelebracao(comissao);
                        notificarBrowser(comissao);
                    }
                }
            )
            .subscribe((status) => {
                console.log('[ReceitasX] Notificações comissão:', status);
            });
    } catch (e) {
        console.warn('[ReceitasX] Realtime indisponível:', e);
    }

})();
