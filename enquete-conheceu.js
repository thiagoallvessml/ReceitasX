// Enquete: Como você conheceu o ReceitasX?
(async function() {
    // Apenas em index.html
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    if (pagina !== 'index.html') return;

    // Aguarda o authInit do auth-guard
    await typeof authInitPromise !== 'undefined' ? authInitPromise : Promise.resolve();

    const session = await getSession();
    if (!session) return;

    // Verifica se já respondeu localmente
    if (localStorage.getItem('rx_enquete_conheceu_respondida') === 'true') return;

    // Verifica se o usuário já respondeu no banco de dados
    try {
        const check = await sb.from('enquete_conheceu').select('id').eq('user_id', session.user.id).limit(1);
        if (check.data && check.data.length > 0) {
            localStorage.setItem('rx_enquete_conheceu_respondida', 'true');
            return;
        }
    } catch(e) {
        console.warn('Erro ao verificar enquete:', e);
    }

    // Cria o Modal
    const modalHtml = `
        <div id="enquete-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:1rem;">
            <div style="background:#111;border:1px solid #1E1E1E;border-radius:1rem;padding:2rem;max-width:400px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.7);text-align:center;position:relative;animation:fadeUp .35s ease both;">
                <style>
                    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
                    .enquete-btn { display:block;width:100%;padding:0.8rem;margin-bottom:0.6rem;background:#1A1A1A;border:1px solid #2A2A2A;color:#f1f5f9;border-radius:0.5rem;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s; }
                    .enquete-btn:hover { background:rgba(37,244,244,0.1);border-color:rgba(37,244,244,0.4);color:#25f4f4; }
                </style>
                <div style="margin-bottom:1.5rem;">
                    <span class="material-symbols-outlined" style="color:#25f4f4;font-size:3rem;margin-bottom:0.5rem;display:block;">campaign</span>
                    <h2 style="font-size:1.2rem;font-weight:800;color:#f1f5f9;margin-bottom:0.5rem;">Como você conheceu a gente?</h2>
                    <p style="font-size:0.85rem;color:#94a3b8;">Para podermos melhorar, conta pra gente rapidinho de onde você veio!</p>
                </div>
                
                <div id="enquete-options">
                    <button class="enquete-btn" onclick="responderEnquete('Instagram')">Instagram</button>
                    <button class="enquete-btn" onclick="responderEnquete('TikTok')">TikTok</button>
                    <button class="enquete-btn" onclick="responderEnquete('YouTube')">YouTube</button>
                    <button class="enquete-btn" onclick="responderEnquete('Pesquisa no Google')">Pesquisa no Google</button>
                    <button class="enquete-btn" onclick="responderEnquete('Indicação de amiga/conhecido')">Indicação de amiga/conhecida</button>
                    <button class="enquete-btn" onclick="responderEnquete('Outros')">Outros</button>
                </div>
                
                <div id="enquete-loading" style="display:none;color:#25f4f4;font-size:0.9rem;font-weight:600;padding:1rem;">
                    Salvando resposta...
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    window.responderEnquete = async function(resposta) {
        document.getElementById('enquete-options').style.display = 'none';
        document.getElementById('enquete-loading').style.display = 'block';

        try {
            await sb.from('enquete_conheceu').insert({
                user_id: session.user.id,
                resposta: resposta
            });
            localStorage.setItem('rx_enquete_conheceu_respondida', 'true');
            
            // Sucesso visual rápido
            document.getElementById('enquete-loading').innerHTML = '<span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:0.5rem;">check_circle</span><br>Obrigado!';
            setTimeout(() => {
                document.getElementById('enquete-modal').remove();
            }, 1500);

        } catch (error) {
            console.error('Erro ao salvar enquete:', error);
            alert('Erro ao salvar sua resposta. Tente novamente.');
            document.getElementById('enquete-options').style.display = 'block';
            document.getElementById('enquete-loading').style.display = 'none';
        }
    };

})();
