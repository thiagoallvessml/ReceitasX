const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;
try {
  db = new Database(path.join(__dirname, 'produtos.db'), { readonly: true });
} catch(e) {
  console.error('Erro ao abrir banco:', e.message);
  process.exit(1);
}

console.log('Exportando produtos para JSON...\n');

let produtos;
try {
  produtos = db.prepare(`
    SELECT
      code,
      product_name,
      brands,
      categories,
      nutriscore,
      nova_group,
      energy_kcal,
      proteins,
      fat,
      carbohydrates,
      sodium,
      ingredients,
      image_url,
      quantity,
      stores
    FROM produtos
    WHERE product_name != ''
    ORDER BY product_name ASC
  `).all();
} catch(e) {
  console.error('Erro na query:', e.message);
  db.close();
  process.exit(1);
}

db.close();

// Remove campos nulos/vazios
const limpo = produtos.map(p => {
  const obj = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== null && v !== '' && v !== undefined) {
      obj[k] = v;
    }
  }
  return obj;
});

const outputPath = path.join(__dirname, '..', 'produtos_exportados.json');

try {
  fs.writeFileSync(outputPath, JSON.stringify(limpo, null, 2), 'utf8');
} catch(e) {
  console.error('Erro ao salvar arquivo:', e.message);
  process.exit(1);
}

const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

console.log(`Exportação concluída!`);
console.log(`  Produtos exportados: ${limpo.length.toLocaleString('pt-BR')}`);
console.log(`  Tamanho: ${sizeMB} MB`);
console.log(`  Arquivo: ${outputPath}`);
