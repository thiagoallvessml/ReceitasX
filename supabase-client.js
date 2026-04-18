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
            _sessionPromise = null;
            return session;
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
    await sb.auth.signOut();
    window.location.href = 'login.html';
}

// Atualiza cache quando sessão muda (refresh, login, logout)
sb.auth.onAuthStateChange((_event, session) => {
    _sessionCache = session;
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
                    console.error('[Heartbeat] Erro no upsert:', error.message);
                }
            } catch(e) {
                console.error('[Heartbeat] Exceção:', e);
            }
        };

        // Ping imediato + a cada 30s
        await ping();
        setInterval(ping, 30000);
    } catch(e) {
        console.error('[Heartbeat] Erro init:', e);
    }
})();

