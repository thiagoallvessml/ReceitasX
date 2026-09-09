const fs = require('fs');
const data = JSON.parse(fs.readFileSync('rafael_vendas.json'));
let sql = '-- 1. Inserir as vendas na tabela de indicacoes (evitando duplicatas pelo email)\n';
let afiliadosToUpdate = new Set();
data.forEach(d => {
  sql += `INSERT INTO indicacoes (afiliado_id, indicado_email, converteu, valor_pago, comissao, created_at) SELECT '${d.afiliado_id}', '${d.indicado_email}', ${d.converteu}, ${d.valor_pago || 'NULL'}, ${d.comissao || 'NULL'}, '${d.created_at}' WHERE NOT EXISTS (SELECT 1 FROM indicacoes WHERE afiliado_id = '${d.afiliado_id}' AND indicado_email = '${d.indicado_email}');\n`;
  afiliadosToUpdate.add(d.afiliado_id);
});
sql += `\n-- 2. Atualizar o saldo total dos afiliados\n`;
afiliadosToUpdate.forEach(afId => {
  sql += `UPDATE afiliados SET total_vendas = (SELECT count(*) FROM indicacoes WHERE afiliado_id = '${afId}' AND converteu = true), total_ganhos = (SELECT COALESCE(SUM(comissao), 0) FROM indicacoes WHERE afiliado_id = '${afId}' AND converteu = true) WHERE id = '${afId}';\n`;
});
fs.writeFileSync('fix_vendas_rafael.sql', sql);
