const fs = require('fs');

let c = fs.readFileSync('gestao-produtos.html', 'utf8');

c = c.replace(
    /sb\.from\('produtos'\)\.select\('\*'\)\.eq\('user_id', user\.id\)\.order\('nome'\)/,
    "sb.from('produtos').select('*, receitas(custo_ing, custo_emb, custo_eqp)').eq('user_id', user.id).order('nome')"
);

c = c.replace(
    /produtos = \(resProd\.data \|\| \[\]\)\.map\(p => \(\{[\s\S]*?_supabase: true,[\s\S]*?\}\)\);/m,
    `produtos = (resProd.data || []).map(p => {
                let finalCusto = parseFloat(p.custo || 0);
                if (p.receitas) {
                    finalCusto = parseFloat(p.receitas.custo_ing || 0) + parseFloat(p.receitas.custo_emb || 0) + parseFloat(p.receitas.custo_eqp || 0);
                }
                return {
                    id:        p.id,
                    nome:      p.nome,
                    preco:     parseFloat(p.preco || 0),
                    custo:     finalCusto,
                    obs:       p.obs || '',
                    img:       p.imagem_url || '',
                    disp:      p.ativo !== false,
                    receitaId: p.receita_id || null,
                    cat:       p.categoria || 'Gourmet',
                    _supabase: true,
                };
            });`
);

fs.writeFileSync('gestao-produtos.html', c);
console.log("Done");
