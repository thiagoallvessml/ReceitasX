const fs = require('fs');
let c = fs.readFileSync('admin-usuarios-config.html', 'utf8');

c = c.replace(
    /<div class="cfg-grid">[\s\S]*?<div class="cfg-metric">[\s\S]*?<div class="cfg-metric-label"><span class="material-symbols-outlined">trending_up<\/span> Margem Padrão<\/div>[\s\S]*?<div class="cfg-metric-val">\$\{fmtPct\(c\.meta_margem\)\}<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
    `<div class="cfg-grid">
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">account_balance_wallet</span> Custo Fixo (Mês)</div>
                    <div class="cfg-metric-val">R$ \${fmtR(
                        (parseFloat(c.cf_aluguel)||0) + (parseFloat(c.cf_agua)||0) + (parseFloat(c.cf_luz)||0) + 
                        (parseFloat(c.cf_telefone)||0) + (parseFloat(c.cf_internet)||0) + (parseFloat(c.cf_limpeza)||0) + 
                        (parseFloat(c.cf_maquininha)||0) + (parseFloat(c.cf_mei)||0) + (parseFloat(c.cf_gasolina)||0) + 
                        (parseFloat(c.cf_salario)||0) + (parseFloat(c.cf_outros)||0)
                    )}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">request_quote</span> Impostos</div>
                    <div class="cfg-metric-val">\${fmtPct(c.taxa_imposto)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">percent</span> Comissões</div>
                    <div class="cfg-metric-val">\${fmtPct(c.taxa_comissao)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">trending_up</span> Margem Padrão</div>
                    <div class="cfg-metric-val">\${fmtPct(c.meta_margem)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">local_fire_department</span> Gás / Kg</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.gas_custo)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">bolt</span> Energia kWh</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.energia_kwh)}</div>
                </div>
                <div class="cfg-metric" style="opacity: 0.5">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">engineering</span> Mão de Obra/h (Antigo)</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.mao_obra_hora)}</div>
                </div>
            </div>`
);

fs.writeFileSync('admin-usuarios-config.html', c);
console.log("Done");
