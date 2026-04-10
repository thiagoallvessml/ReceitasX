const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'blog');
const files = fs.readdirSync(dir);
for (const f of files) {
  if (f.endsWith('.html')) {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace('src="../analytics.js"', 'src="/analytics.js"');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
