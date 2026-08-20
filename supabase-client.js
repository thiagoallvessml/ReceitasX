// ─── ReceitasX · Supabase Client Compartilhado ───────────────────
// Inclua ANTES deste arquivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>

const SUPABASE_URL = 'https://pipknmwjpblitqlxxdcw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtubXdqcGJsaXRxbHh4ZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgzNjcsImV4cCI6MjA4OTMzNDM2N30.2aiHf_9T9j1S6VMh9euY0wFn2r4S2OezCrYi2ZJ6W-E';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Bypass navigator.locks para evitar lock contention quando múltiplos
        // scripts chamam getSession() simultaneamente na inicialização.
        lock: (name, acquireTimeout, fn) => fn(),
    }
});

/* ─── Cache de sessão (evita lock contention) ─────────────────── */
let _sessionPromise = null;    // Promise compartilhada
let _sessionCache   = null;    // resultado cacheado

/**
 * Retorna a sessão do Supabase cacheada.
 * A primeira chamada busca do Supabase; as seguintes retornam o cache.
 * Use forceRefresh=true para forçar nova busca (ex: após login).
 */
async function getSession(forceRefresh) {
    if (!forceRefresh && _sessionCache !== null) return _sessionCache;
    if (!forceRefresh && _sessionPromise) return _sessionPromise;

    _sessionPromise = sb.auth.getSession()
        .then(({ data: { session } }) => {
            _sessionCache = session;

            // --- IMPERSONATE LOGIC ---
            if (session && localStorage.getItem('impersonate_id')) {
                try {
                    _sessionCache = JSON.parse(JSON.stringify(session));
                    _sessionCache.user.id = localStorage.getItem('impersonate_id');
                    
                    if (typeof window !== 'undefined') {
                        const injectBanner = () => {
                            if (document.getElementById('impersonate-banner')) return;
                            const b = document.createElement('div');
                            b.id = 'impersonate-banner';
                            b.style.cssText = 'position:fixed;top:6px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;z-index:999999;text-align:center;padding:6px 12px;font-weight:bold;font-size:12px;display:flex;justify-content:center;align-items:center;gap:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);width:max-content;max-width:90%;';
                            b.innerHTML = `⚠️ Acessando como Cliente <button onclick="localStorage.removeItem('impersonate_id'); window.location.href='admin-receitas-usuarios.html';" style="background:#fff;color:#ef4444;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;">Sair</button>`;
                            document.body.appendChild(b);
                        };
                        if (document.readyState === 'complete' || document.readyState === 'interactive') {
                            injectBanner();
                        } else {
                            document.addEventListener('DOMContentLoaded', injectBanner);
                        }
                    }
                } catch(e){}
            }
            // -------------------------

            _sessionPromise = null;
            return _sessionCache;
        })
        .catch(e => {
            console.warn('[getSession] erro:', e.message);
            _sessionPromise = null;
            return _sessionCache; // retorna cache anterior se houver
        });

    return _sessionPromise;
}

async function getUser() {
    const session = await getSession();
    return session?.user || null;
}

async function signOut() {
    _sessionCache = null;
    _sessionPromise = null;
    sessionStorage.removeItem('receitasx_session_id');
    localStorage.removeItem('impersonate_id');
    
    // O evento SIGNED_OUT do onAuthStateChange lidará com a limpeza completa
    await sb.auth.signOut();
    window.location.href = 'login.html';
}

sb.auth.onAuthStateChange((event, session) => {
    if (session) {
        _sessionCache = JSON.parse(JSON.stringify(session));
        if (localStorage.getItem('impersonate_id')) {
            _sessionCache.user.id = localStorage.getItem('impersonate_id');
        }
        
        const currentUid = _sessionCache.user.id;
        const cachedUid = localStorage.getItem('receitasx_uid');
        if (cachedUid && cachedUid !== currentUid) {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('receitasx_') && k !== 'receitasx_utm' && k !== 'receitasx_uid') keys.push(k);
            }
            keys.forEach(k => localStorage.removeItem(k));
        }
        localStorage.setItem('receitasx_uid', currentUid);
        
    } else {
        _sessionCache = session;
    }
    
    if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('receitasx_session_id');
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('receitasx_') && k !== 'receitasx_utm') keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    }
});

/* ─── Helpers de dados ────────────────────────────────────────── */
async function dbSelect(table, query = '*', filters = {}) {
    let q = sb.from(table).select(query);
    for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

async function dbInsert(table, payload) {
    const { data, error } = await sb.from(table).insert(payload).select().single();
    if (error) throw error;
    return data;
}

async function dbUpdate(table, id, payload) {
    const { data, error } = await sb.from(table).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

async function dbDelete(table, id) {
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) throw error;
}

async function dbUpsert(table, payload, onConflict) {
    const opts = onConflict ? { onConflict } : {};
    const { data, error } = await sb.from(table).upsert(payload, opts).select().single();
    if (error) throw error;
    return data;
}

/* ─── GOOGLE ANALYTICS (GA4) ──────────────────────────────────── */
(function() {
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    if (pagina.startsWith('admin')) return;

    const gaId = 'G-LFKEYKBBCD';
    
    // Injeta o script do Google
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Inicializa o DataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', gaId, {
        page_path: window.location.pathname + window.location.search
    });
})();

/* ─── PRESENÇA ONLINE (Heartbeat) ─────────────────────────────── */
(async function _heartbeat() {
    try {
        // Aguarda o auth-guard resolver a sessão primeiro (evita lock contention)
        await new Promise(r => setTimeout(r, 800));

        const session = await getSession();
        if (!session) { console.log('[Heartbeat] Sem sessão, heartbeat desativado'); return; }

        const pagina = window.location.pathname.split('/').pop() || 'index.html';
        console.log('[Heartbeat] Iniciado para', session.user.id, '| Página:', pagina);

        const ping = async () => {
            try {
                const { error } = await sb.from('presenca_online').upsert({
                    user_id: session.user.id,
                    last_seen: new Date().toISOString(),
                    pagina: pagina
                }, { onConflict: 'user_id' });
                
                if (error) {
                    // console.error('[Heartbeat] Erro no upsert:', error.message);
                }
            } catch(e) {
                // console.error('[Heartbeat] Exceção:', e);
            }
        };

        // Ping imediato + a cada 10 minutos (600000 ms) para economizar I/O de disco
        await ping();
        setInterval(ping, 600000);
    } catch(e) {
        console.error('[Heartbeat] Erro init:', e);
    }
})();

/* ─── SESSÃO DE ACESSO (Log de duração) ──────────────────────── */
(async function _sessionTracker() {
    try {
        await new Promise(r => setTimeout(r, 1000));
        const session = await getSession();
        if (!session) return;

        const pagina = window.location.pathname.split('/').pop() || 'index.html';
        // Não rastreia páginas admin
        if (pagina.startsWith('admin')) return;

        // Verifica se já registrou sessão nesta aba (evita duplicar ao navegar SPA)
        const existingSessionId = sessionStorage.getItem('receitasx_session_id');
        if (existingSessionId) return;

        // Registrar início da sessão
        const { data: sessao, error } = await sb.from('sessoes_usuario').insert({
            user_id: session.user.id,
            inicio: new Date().toISOString(),
            pagina_entrada: pagina,
            user_agent: navigator.userAgent || null
        }).select('id').single();

        if (error) {
            // console.error('[Sessão] Erro ao registrar:', error.message);
            return;
        }

        const sessionId = sessao.id;
        const sessionStart = Date.now();
        sessionStorage.setItem('receitasx_session_id', sessionId);
        console.log('[Sessão] Registrada ID:', sessionId);

        // Finalizar sessão ao sair da página
        const finalizarSessao = () => {
            const duracao = Math.round((Date.now() - sessionStart) / 1000);
            // Usa sendBeacon para garantir envio mesmo fechando a aba
            const body = JSON.stringify({
                fim: new Date().toISOString(),
                duracao_seg: duracao
            });
            // Fallback: tenta via fetch keepalive
            try {
                navigator.sendBeacon || fetch;
                fetch(`${SUPABASE_URL}/rest/v1/sessoes_usuario?id=eq.${sessionId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + (session.access_token || SUPABASE_KEY),
                        'Prefer': 'return=minimal'
                    },
                    body: body,
                    keepalive: true
                });
            } catch(_) {}
        };

        window.addEventListener('beforeunload', finalizarSessao);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') finalizarSessao();
        });
    } catch(e) {
        console.error('[Sessão] Erro init:', e);
    }
})();

/* ─── PAGE VIEW TRACKING (DESATIVADO para economizar Disk IO) ── */
// Tracking de page views foi desativado.
// Use o Google Analytics (GA4) para acompanhar visualizações.
