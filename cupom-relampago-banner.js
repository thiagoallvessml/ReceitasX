(async function() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let ref = urlParams.get('ref') || urlParams.get('af');
        
        // Se tiver ?ref= na URL, salvar no localStorage para o checkout
        if (ref) {
            localStorage.setItem('receitasx_ref', ref);
        } else {
            ref = localStorage.getItem('receitasx_ref');
        }
        
        // Se ainda não tiver ref, mas o usuário estiver logado, buscar do perfil dele no Supabase
        if (!ref && window.sb) {
            const { data: { session } } = await window.sb.auth.getSession();
            if (session) {
                const { data: perfil } = await window.sb.from('perfis').select('origem_cadastro').eq('id', session.user.id).single();
                if (perfil && perfil.origem_cadastro && perfil.origem_cadastro !== 'calculadora') {
                    ref = perfil.origem_cadastro;
                    localStorage.setItem('receitasx_ref', ref);
                }
            }
        }

        if (!ref) return;

        const couponCode = (ref + 'RELAMPAGO').toUpperCase().substring(0,30);

        const SUPABASE_URL = window.SUPABASE_URL || 'https://pipknmwjpblitqlxxdcw.supabase.co';
        const SUPABASE_KEY = window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E';

        const res = await fetch(SUPABASE_URL + '/rest/v1/cupons?select=codigo,valor,data_expiracao,ativo&codigo=eq.' + couponCode + '&ativo=eq.true', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        
        if (!res.ok) return;
        const cupons = await res.json();
        if (!cupons || cupons.length === 0) return;

        const cupom = cupons[0];
        if (!cupom.data_expiracao) return;

        const expDate = new Date(cupom.data_expiracao);
        if (expDate <= new Date()) return;

        // Cria o banner!
        const banner = document.createElement('div');
        banner.id = 'cr-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:linear-gradient(90deg, #b45309, #eab308, #ca8a04);color:#fff;z-index:999999;box-shadow:0 4px 15px rgba(0,0,0,0.3);font-family:Inter,sans-serif;padding:0.6rem 1rem;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.3rem;cursor:pointer;transition:transform 0.3s;';
        
        banner.onclick = () => {
            navigator.clipboard.writeText(cupom.codigo);
            const msg = document.getElementById('cr-msg');
            const oldHtml = msg.innerHTML;
            msg.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.2rem;vertical-align:middle">check_circle</span> Copiado!';
            setTimeout(() => { msg.innerHTML = oldHtml; }, 2000);
            
            const impCupom = document.getElementById('f-cupom');
            const btnCupom = document.getElementById('btn-aplicar');
            if (impCupom && btnCupom) {
                impCupom.value = cupom.codigo;
                btnCupom.click();
            }
        };

        const topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;align-items:center;gap:0.5rem;font-weight:700;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.02em;';
        topRow.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.2rem">bolt</span> <span id="cr-msg">Desconto Relâmpago liberado pelo seu afiliado!</span> <span class="material-symbols-outlined" style="font-size:1.2rem">bolt</span>';
        
        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = 'font-size:0.8rem;font-weight:500;background:rgba(0,0,0,0.2);padding:0.2rem 0.8rem;border-radius:99px;border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;justify-content:center;';
        
        const spanTime = document.createElement('span');
        spanTime.style.fontWeight = '800';
        spanTime.style.color = '#fff';

        bottomRow.innerHTML = `Utilize o cupom <b style="color:#25f4f4">${cupom.codigo}</b> e ganhe <b>${cupom.valor}% OFF</b>. Expira em: `;
        bottomRow.appendChild(spanTime);

        banner.appendChild(topRow);
        banner.appendChild(bottomRow);

        document.body.appendChild(banner);
        document.body.style.paddingTop = '4rem';

        // Auto-aplica no checkout se estiver na página!
        const impCupom = document.getElementById('f-cupom');
        const btnCupom = document.getElementById('btn-aplicar');
        if (impCupom && btnCupom) {
            setTimeout(() => {
                impCupom.disabled = false;
                btnCupom.disabled = false;
                impCupom.value = cupom.codigo;
                btnCupom.click();
            }, 1000);
        }

        // Timer
        const updateTimer = () => {
            const now = new Date();
            const diff = expDate - now;
            if (diff <= 0) {
                banner.style.display = 'none';
                document.body.style.paddingTop = '0';
                clearInterval(interval);
                return;
            }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            spanTime.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);

    } catch(e) {
        console.error('Erro no cupom relampago banner:', e);
    }
})();
