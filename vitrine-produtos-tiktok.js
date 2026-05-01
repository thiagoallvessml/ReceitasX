/**
 * Vitrine de Produtos TikTok — Componente Dinâmico
 * 
 * Carrega os produtos do arquivo vitrine-produtos-data.json
 * e renderiza automaticamente em qualquer página que tenha
 * <div id="vitrine-tiktok"></div>
 * 
 * Os produtos são gerenciados via admin-vitrine-tiktok.html
 * que gera o arquivo JSON via download.
 */
document.addEventListener("DOMContentLoaded", async function () {
    const container = document.getElementById("vitrine-tiktok");
    if (!container) return;

    let produtos = [];

    try {
        const res = await fetch('/vitrine-produtos-data.json?v=' + Date.now());
        if (res.ok) produtos = await res.json();
    } catch(e) {
        // fallback: tenta localStorage (para preview no admin)
        produtos = JSON.parse(localStorage.getItem('receitasx_vitrine_tiktok') || '[]');
    }

    // Se não houver produtos cadastrados, não mostra nada
    if (!produtos.length) {
        container.innerHTML = '';
        return;
    }

    // Gera os cards dos produtos
    const cardsHTML = produtos.map(p => {
        const link = p.link && p.link !== '#' ? p.link : '#';
        const hasImg = p.imagem && p.imagem.length > 10;

        const imgHTML = hasImg
            ? `<img src="${esc(p.imagem)}" alt="${esc(p.nome)}" style="width:100%;height:100%;object-fit:cover;border-radius:.5rem" />`
            : `<span class="material-symbols-outlined text-slate-500 text-3xl">inventory_2</span>`;

        return `
            <a href="${esc(link)}" target="_blank" rel="noopener" class="product-card group">
                <div class="product-img">
                    ${imgHTML}
                </div>
                <div class="product-info">
                    <p class="product-title">${esc(p.nome)}</p>
                    <p class="text-xs text-slate-400 mt-1">Ver valor atualizado no TikTok</p>
                </div>
                <div class="btn-buy">
                    Ver Loja
                    <span class="material-symbols-outlined" style="font-size:1.1rem">storefront</span>
                </div>
            </a>`;
    }).join('');

    container.innerHTML = `
        <section>
            <div class="flex items-center gap-2 mb-4">
                <span class="material-symbols-outlined text-primary">shopping_bag</span>
                <h2 class="text-lg font-bold">Produtos Recomendados</h2>
            </div>
            <p class="text-sm text-slate-500 mb-4">Compre os mesmos equipamentos que usei no vídeo:</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${cardsHTML}
            </div>
            
            <p class="text-xs text-slate-600 mt-4 text-center">
                *Os links acima direcionam para a nossa lojinha no TikTok. Você ajuda a página comprando por eles!
            </p>
        </section>
    `;

    function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
});
