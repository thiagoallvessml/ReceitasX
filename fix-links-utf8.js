const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}

const htmlFiles = walk('.');

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    // Fix canonical
    newContent = newContent.replace(/<link rel="canonical" href="([^"]+)\.html"/g, '<link rel="canonical" href="$1"');
    
    // Fix internal hrefs
    newContent = newContent.replace(/href="([^"h]+)\.html"/g, 'href="$1"'); // Try not to match external links starting with http? Actually internal links might start with ../ or just letters. But wait, what if it's href="https://example.com/page.html"? 
    // Usually internal links in this app are relative like "../blog" or "admin-usuarios.html"
    // The previous regex was href="([^"]+)\.html" which also matched external. 
    // Let's refine the regex: we only want to replace internal links.
    // If it starts with http, we only replace if it's receitasx.com.br
    
    // Let's do it manually.
    
    // 1. Canonical tags specifically
    newContent = newContent.replace(/<link rel="canonical" href="([^"]+)\.html"/g, '<link rel="canonical" href="$1"');
    
    // 2. All hrefs.
    // Let's match all hrefs.
    newContent = newContent.replace(/href="([^"]+)\.html"/g, (match, p1) => {
        // if it's an external link NOT pointing to receitasx.com.br, ignore.
        if (p1.startsWith('http') && !p1.includes('receitasx.com.br')) {
            return match;
        }
        return `href="${p1}"`;
    });

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed ' + file);
    }
});
