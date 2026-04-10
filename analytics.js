// analytics.js
// Script dedicado para carregar Google Analytics nas páginas que não usam supabase-client.js
(function() {
    const gaId = 'G-LFKEYKBBCD';
    
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', gaId, {
        page_path: window.location.pathname + window.location.search
    });
})();
