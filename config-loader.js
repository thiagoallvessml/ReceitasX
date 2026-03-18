/**
 * config-loader.js
 * Carrega configurações de config_afiliados e expõe globalmente.
 * Usado por checkout.html e acesso-vitalicio.html.
 */

window.AppConfig = {
    valorPlano:   46.90,   // default
    comissaoPct:  10,
    saqueMinimo:  50,
    loaded:       false,
};

(async function loadAppConfig() {
    try {
        // sb é definido pelo supabase-client.js (já carregado antes)
        const { data } = await sb
            .from('config_afiliados')
            .select('valor_plano, comissao_pct, saque_minimo')
            .eq('id', 1)
            .single();

        if (data) {
            window.AppConfig.valorPlano  = parseFloat(data.valor_plano)  || 46.90;
            window.AppConfig.comissaoPct = parseFloat(data.comissao_pct) || 10;
            window.AppConfig.saqueMinimo = parseFloat(data.saque_minimo) || 50;
        }
    } catch (e) {
        // Usa defaults silenciosamente
    }

    window.AppConfig.loaded = true;
    document.dispatchEvent(new Event('appconfig:loaded'));
})();
