// ─── auth-guard.js ────────────────────────────────────────────────
// Inclua nas páginas protegidas APÓS supabase-client.js
// • Redireciona para login.html se não autenticado
// • Expõe window.__userRole e window.__userProfile para uso nas páginas
// • Funções auxiliares: requireAdmin(), requireAfiliado()
// ─────────────────────────────────────────────────────────────────

const authInitPromise = (async () => {
    const session = await getSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }

    // Busca o perfil com o role
    try {
        const { data: profile, error } = await sb
            .from('perfis')
            .select('id, role, plano, nome, sobrenome')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) throw error;

        window.__userProfile = profile;
        window.__userRole    = profile?.role ?? 'afiliado';
    } catch (e) {
        console.warn('auth-guard: erro ao buscar perfil', e);
        window.__userProfile = null;
        window.__userRole    = 'afiliado';
    }
})();

// ── Helpers de Role ────────────────────────────────────────────────

/** Redireciona para index.html se o usuário NÃO for admin */
async function requireAdmin() {
    await _waitForRole();
    if (window.__userRole !== 'admin') {
        window.location.replace('index.html');
    }
}

/** Redireciona para index.html se o usuário NÃO estiver autenticado */
async function requireAfiliado() {
    await _waitForRole();
    // qualquer role autenticado pode acessar páginas de afiliado
}

/** Retorna true se o usuário logado é admin */
async function isAdmin() {
    await _waitForRole();
    return window.__userRole === 'admin';
}

/** Retorna o perfil completo do usuário logado */
async function getMyProfile() {
    await _waitForRole();
    return window.__userProfile;
}

/** Mostra/esconde elementos com data-role="admin" conforme o role */
async function applyRoleVisibility() {
    await _waitForRole();
    const role = window.__userRole;

    document.querySelectorAll('[data-role]').forEach(el => {
        const allowed = el.dataset.role.split(',').map(r => r.trim());
        el.style.display = allowed.includes(role) ? '' : 'none';
    });
}

// ── Interno: aguarda o role estar disponível ─────────────
function _waitForRole() {
    return authInitPromise;
}
