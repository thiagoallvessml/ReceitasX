// ─── auth-guard.js ────────────────────────────────────────────────
// Inclua nas páginas protegidas APÓS supabase-client.js
// Redireciona para login.html se o usuário não estiver autenticado

(async () => {
    const session = await getSession();
    if (!session) {
        window.location.replace('login.html');
    }
})();
