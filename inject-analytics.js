const fs = require('fs');
const path = require('path');

function processDir(dir, level = 0) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.vercel') {
                processDir(fullPath, level + 1);
            }
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Só adiciona se não tiver o supabase-client nem o analytics
            if (!content.includes('supabase-client.js') && !content.includes('analytics.js')) {
                const scriptSrc = level === 0 ? 'analytics.js' : '../analytics.js';
                // Adiciona antes do </head>
                if (content.includes('</head>')) {
                    content = content.replace('</head>', `    <script src="${scriptSrc}"></script>\n</head>`);
                    fs.writeFileSync(fullPath, content);
                    console.log('Added analytics to:', fullPath);
                } else {
                    console.log('No </head> found in:', fullPath);
                }
            }
        }
    }
}

processDir(__dirname);
