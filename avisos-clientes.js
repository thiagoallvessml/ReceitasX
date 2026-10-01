// avisos-clientes.js - Mostra os avisos do painel admin para os usuários

(async function() {
    // Apenas em index.html
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    if (pagina !== 'index.html') return;

    // Aguarda a sessão (via auth-guard se existir)
    await (typeof authInitPromise !== 'undefined' ? authInitPromise : Promise.resolve());
    
    const session = await getSession();
    if (!session) return;

    try {
        // 1. Busca avisos ativos criados pelo Admin
        const { data: avisos, error: errAvisos } = await sb.from('avisos_admin')
            .select('*')
            .eq('ativo', true)
            .order('created_at', { ascending: true });

        if (errAvisos) throw errAvisos;
        if (!avisos || avisos.length === 0) return;

        // 2. Filtra apenas os avisos que são para todos ou para o usuário específico
        const avisosValidos = avisos.filter(a => a.destino === 'todos' || a.destino_user_id === session.user.id);
        if (avisosValidos.length === 0) return;

        // 3. Verifica quais avisos o usuário já viu e fechou
        const avisoIds = avisosValidos.map(a => a.id);
        const { data: vistos, error: errVistos } = await sb.from('avisos_vistos')
            .select('aviso_id')
            .eq('user_id', session.user.id)
            .in('aviso_id', avisoIds);
            
        if (errVistos) throw errVistos;
        
        const vistosSet = new Set((vistos || []).map(v => v.aviso_id));
        
        // 4. Seleciona apenas os pendentes (não vistos)
        const avisosPendentes = avisosValidos.filter(a => {
            if (vistosSet.has(a.id)) return false;
            // Checa também o localStorage para evitar reexibição imediata ou falhas de impersonation
            if (localStorage.getItem(`aviso_visto_${a.id}_${session.user.id}`) === 'true') return false;
            return true;
        });
        
        if (avisosPendentes.length > 0) {
            mostrarFilaDeAvisos(avisosPendentes, session.user.id);
        }
    } catch(e) {
        console.error('[Avisos] Erro ao carregar avisos:', e);
    }

    // Função auxiliar para mostrar um aviso de cada vez como pop-up
    function mostrarFilaDeAvisos(fila, userId) {
        let index = 0;

        function mostrarProximo() {
            if (index >= fila.length) return; // Acabaram os avisos
            const aviso = fila[index];
            
            // Cria o overlay do modal
            const bg = document.createElement('div');
            bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeInAviso 0.3s ease;';
            
            const card = document.createElement('div');
            card.style.cssText = 'background:#111;border:1px solid #2A2A2A;border-radius:1rem;padding:1.5rem;max-width:500px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.7);position:relative;animation:slideUpAviso 0.35s ease;text-align:center;';
            
            // Determina as cores e ícones de acordo com o tipo
            let icon = 'info';
            let color = '#3b82f6'; // Azul padrão (info)
            if (aviso.tipo === 'aviso') { icon = 'warning'; color = '#facc15'; } // Amarelo
            if (aviso.tipo === 'urgente') { icon = 'error'; color = '#ef4444'; } // Vermelho
            if (aviso.tipo === 'novidade') { icon = 'new_releases'; color = '#10b981'; } // Verde
            
            let imgHtml = '';
            if (aviso.imagem_url) {
                imgHtml = `<img src="${aviso.imagem_url}" style="max-width:100%;border-radius:0.5rem;margin-bottom:1rem;max-height:200px;object-fit:cover;flex-shrink:0;" />`;
            }

            card.innerHTML = `
                <style>
                    @keyframes slideUpAviso { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
                    @keyframes fadeInAviso { from{opacity:0}to{opacity:1} }
                    .aviso-scroll::-webkit-scrollbar { width: 6px; }
                    .aviso-scroll::-webkit-scrollbar-track { background: transparent; }
                    .aviso-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
                </style>
                <div class="aviso-scroll" style="overflow-y:auto;flex:1;margin-bottom:1rem;padding-right:0.2rem;display:flex;flex-direction:column;">
                    <div style="margin-bottom:0.75rem;flex-shrink:0;">
                        <span class="material-symbols-outlined" style="font-size:3rem;color:${color}">${icon}</span>
                    </div>
                    ${imgHtml}
                    <h2 style="font-size:1.2rem;font-weight:800;color:#f1f5f9;margin-bottom:0.75rem;flex-shrink:0;">${aviso.titulo}</h2>
                    <div style="font-size:0.9rem;color:#cbd5e1;line-height:1.6;text-align:left;white-space:pre-wrap;background:#1A1A1A;padding:0.85rem;border-radius:0.5rem;border:1px solid #222;flex-shrink:0;">${aviso.mensagem}</div>
                </div>
                <div style="flex-shrink:0;margin-top:auto;">
                    <button id="btn-entendi-${aviso.id}" style="width:100%;padding:0.85rem;background:rgba(37,244,244,.1);border:1px solid rgba(37,244,244,.4);color:#25f4f4;border-radius:.75rem;font-size:0.95rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
                        Entendi
                    </button>
                </div>
            `;
            
            bg.appendChild(card);
            document.body.appendChild(bg);

            // Ação ao clicar em fechar
            const btn = document.getElementById(`btn-entendi-${aviso.id}`);
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(37,244,244,0.2)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(37,244,244,0.1)';
            });
            btn.addEventListener('click', async () => {
                // Remove o modal
                bg.remove();
                
                // Grava imediatamente no dispositivo local
                localStorage.setItem(`aviso_visto_${aviso.id}_${userId}`, 'true');
                
                // Registra no banco que o usuário viu o aviso
                try {
                    const res = await sb.from('avisos_vistos').insert({
                        aviso_id: aviso.id,
                        user_id: userId
                    });
                    if (res.error) console.error('Erro RLS Supabase:', res.error.message);
                } catch(err) {
                    console.error('Erro ao marcar aviso como visto:', err);
                }

                // Puxa o próximo aviso da fila (se houver)
                index++;
                mostrarProximo();
            });
        }

        // Inicia
        mostrarProximo();
    }
})();
