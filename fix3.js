const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'como-calcular-preco-bolo.html' && f !== 'ponto-de-equilibrio-confeitaria.html');

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert analytics.js if not present
  if (!content.includes('analytics.js')) {
    content = content.replace('</head>', '    <script src="/analytics.js"></script>\n</head>');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Added analytics.js to 27 files successfully!');
