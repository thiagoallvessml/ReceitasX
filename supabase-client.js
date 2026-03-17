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
    }
});

/* ─── Helpers de Auth ─────────────────────────────────────────── */
async function getUser() {
    const { data: { user } } = await sb.auth.getUser();
    return user;
}

async function getSession() {
    const { data: { session } } = await sb.auth.getSession();
    return session;
}

async function signOut() {
    await sb.auth.signOut();
    window.location.href = 'login.html';
}

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
