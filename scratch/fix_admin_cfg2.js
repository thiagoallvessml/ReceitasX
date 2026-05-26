const fs = require('fs');
let c = fs.readFileSync('admin-usuarios-config.html', 'utf8');

const replacement = `
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">payments</span> Salário / Mão de Obra</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_salario)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">home</span> Aluguel</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_aluguel)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">water_drop</span> Água</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_agua)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">lightbulb</span> Luz</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_luz)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">phone_iphone</span> Telefone</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_telefone)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">wifi</span> Internet</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_internet)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">cleaning_services</span> Limpeza</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_limpeza)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">point_of_sale</span> Maquininha</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_maquininha)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">receipt_long</span> MEI</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_mei)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">local_gas_station</span> Gasolina</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_gasolina)}</div>
                </div>
                <div class="cfg-metric">
                    <div class="cfg-metric-label"><span class="material-symbols-outlined">more_horiz</span> Outros</div>
                    <div class="cfg-metric-val">R$ \${fmtR(c.cf_outros)}</div>
                </div>
`;

// regex to find the Custo Fixo (Mês) box and replace it with the individual boxes
c = c.replace(
    /<div class="cfg-metric">\s*<div class="cfg-metric-label"><span class="material-symbols-outlined">account_balance_wallet<\/span> Custo Fixo \(Mês\)<\/div>[\s\S]*?<\/div>/,
    replacement
);

fs.writeFileSync('admin-usuarios-config.html', c);
console.log("Done");
