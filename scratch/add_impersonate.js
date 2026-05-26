const fs = require('fs');

// 1. Update admin-receitas-usuarios.html
let html = fs.readFileSync('admin-receitas-usuarios.html', 'utf8');

const htmlDrawerTags = `<div style="padding:.75rem 1.25rem;border-bottom:1px solid #2A2A2A;display:flex;gap:.5rem;flex-wrap:wrap;flex-shrink:0" id="drawer-tags"></div>`;
const htmlDrawerActions = `
        <!-- ações admin -->
        <div style="padding:.5rem 1.25rem;border-bottom:1px solid #2A2A2A;display:flex;gap:.5rem;flex-shrink:0">
             <button class="pill" style="color:#25f4f4; border-color:#25f4f4; display:flex; align-items:center; gap:4px;" onclick="impersonateDrawerUser()">
                 <span class="material-symbols-outlined" style="font-size:14px">login</span> Acessar como este cliente
             </button>
        </div>`;

if (!html.includes('impersonateDrawerUser')) {
    html = html.replace(htmlDrawerTags, htmlDrawerTags + '\n' + htmlDrawerActions);
}

const jsAbrirDrawerTarget = `currentUserReceitas = found.receitas;`;
const jsAbrirDrawerReplace = `currentUserReceitas = found.receitas;\n    impersonateUserId = p.id;`;

if (!html.includes('impersonateUserId = p.id')) {
    html = html.replace(jsAbrirDrawerTarget, jsAbrirDrawerReplace);
    
    // Add impersonateDrawerUser function right before abrirDrawer
    const jsFunc = `
let impersonateUserId = null;
function impersonateDrawerUser() {
    if(!impersonateUserId) return;
    localStorage.setItem('impersonate_id', impersonateUserId);
    window.location.href = 'index.html';
}

function abrirDrawer(userId) {`;
    html = html.replace('function abrirDrawer(userId) {', jsFunc);
}

fs.writeFileSync('admin-receitas-usuarios.html', html);


// 2. Update supabase-client.js
let sc = fs.readFileSync('supabase-client.js', 'utf8');

const targetSC = `_sessionCache = session;
            _sessionPromise = null;
            return session;`;

const replaceSC = `_sessionCache = session;

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
                            b.innerHTML = \`⚠️ Acessando como Cliente <button onclick="localStorage.removeItem('impersonate_id'); window.location.href='admin-receitas-usuarios.html';" style="background:#fff;color:#ef4444;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;">Sair</button>\`;
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
            return _sessionCache;`;

if (!sc.includes('IMPERSONATE LOGIC')) {
    sc = sc.replace(targetSC, replaceSC);
    fs.writeFileSync('supabase-client.js', sc);
}

console.log('Done');
