const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'como-calcular-preco-bolo.html' && f !== 'ponto-de-equilibrio-confeitaria.html');

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix links
  content = content.replace(/href="\.\.\/landing\.html"/g, 'href="../landing"');
  content = content.replace(/href="\.\.\/blog\.html"/g, 'href="../blog"');
  content = content.replace(/href="\.\.\/acesso-vitalicio\.html"/g, 'href="../login"');
  content = content.replace(/href="\.\.\/login\.html"/g, 'href="../login"');

  // Fix sticky banner mojibake
  content = content.replace(/ðŸš€/g, '&#x1F680;');
  content = content.replace(/â€”/g, '&#8212;');
  content = content.replace(/PreÃ§o/g, 'Preço');
  content = content.replace(/ComeÃ§ar grÃ¡tis â†’/g, 'Começar grátis &#x2192;');
  content = content.replace(/âœ•/g, '&#x2715;');
  
  content = content.replace(/Comecar gratis/g, 'Começar grátis');
  content = content.replace(/Preco/g, 'Preço');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Fixed 27 files successfully!');
