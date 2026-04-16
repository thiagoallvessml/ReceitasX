# Instruções e Contexto do Projeto para IA (Claude / AI Assistants)

## 📌 Visão Geral do Projeto
* **Nome do Projeto:** ReceitasX
* **Tecnologias:** Vanilla JS, Tailwind CSS Padrão, HTML5, Supabase (Banco e Auth), Abacate Pay.
* **Descrição:** Uma aplicação focada em gestão de receitas, insumos e precificação para cozinheiros, autônomos e dark kitchens, com planos SaaS.

## 📐 Diretrizes Gerais de Arquitetura e Código
1. **Padrão de Código:** Utilizamos Vanilla JS diretamente nas páginas HTML ou importado em arquivos locais via modulos.
2. **Estilização:** CSS nativo nas tags `<style>` com classes do TailwindCSS vindas de CDN.
3. **Segurança (DB):** Row-Level Security (RLS) habilitada no Supabase por padrão para separar os diferentes utilizadores ('multi-tenant').
4. **Contexto Visual:** Preferir o uso do Dark-Mode como tema primário.

## 📝 Notas de Desenvolvimento em Aberto
(Preencha com o que estamos focando atualmente ou os próximos marcos aqui)

- [ ] Rate limiting para requisições na criação dos cobrancas.
- [ ] Integração nativa do Recaptcha V3.
- [ ] Otimização constante de Queries.

## 🤝 Histórico de Lógica
- O admin tem uma role específica em `perfis` (role='admin'). As consultas RLS em `insumos` ou outras tabelas devem refletir essa possibilidade de leitura geral via views ou bypass, não causando a quebra do filtro em tela de cliente.
- Pagamentos sendo testados em ambiente de Edge Functions rodando `AbacatePay`.
