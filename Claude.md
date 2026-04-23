# Contexto do Projeto "ReceitasX" para Assistentes de IA

Este documento serve como um **System Prompt** e guia de contexto para apresentar toda a arquitetura, regras de negócio, tecnologias e funcionalidades do **ReceitasX** a qualquer nova sessão de Inteligência Artificial.

---

## 📌 Visão Geral do Projeto
O **ReceitasX** é uma aplicação web SaaS (Software as a Service) focada no setor gastronômico (confeitarias, dark kitchens, autônomos). Ele permite que os usuários cadastrem ingredientes (insumos), criem fichas técnicas de receitas e calculem automaticamente o custo de produção, precificação de venda (inclusive para marketplaces como iFood) e margem de lucro. 

A plataforma possui um modelo de monetização **Freemium com Upgrade Vitálicio**, sistema integrado de cupons/afiliados e um dashboard administrativo próprio.

## 🛠 Stack Tecnológico
* **Frontend:** HTML5, Vanilla JavaScript, CSS nativo em blocos `<style>`, e **Tailwind CSS via CDN**.
* **Ícones e Tipografia:** Material Symbols Outlined (Google) e fonte Inter (Google Fonts).
* **Backend & Banco de Dados:** **Supabase** (PostgreSQL).
* **Autenticação:** Supabase Auth (Email/Senha).
* **Deploy e Hospedagem:** Vercel.
* **Pagamentos:** Checkout integrado com Abacate Pay (via Supabase Edge Functions).

---

## 📂 Estrutura de Módulos e Frontend

### 1. Área do Cliente (Usuário Comum)
A interface do usuário foca na gestão do negócio gastronômico, orientada a um **Dark Mode** premium.
* **`index.html`:** Dashboard principal do usuário com atalhos rápidos e resumo de informações.
* **`insumos.html` & `embalagens.html`:** Gestão de matérias-primas e embalagens com custo, quantidade e cálculo automático de preço unitário.
* **`equipamentos.html`:** Cadastro de equipamentos (depreciação e custo hora/máquina).
* **`receitas.html` & `receita.html`:** O coração da plataforma. Ficha técnica interativa onde o usuário anexa insumos, define rendimentos e visualiza o custo de produção e o lucro líquido.
* **`precificacao-marketplace.html`:** Simulação de taxas de aplicativos (iFood, etc) sobre os produtos.
* **`despesas.html`:** Gestão de custos fixos (água, luz, aluguel, pro-labore).
* **`carrinho.html` & `pedidos.html`:** Módulo de PDV e gestão de pedidos/vendas do usuário.
* **`perfil.html` & `configuracoes.html`:** Controle da conta e preferência do usuário.

### 2. Área Administrativa (Admin)
O painel administrativo é isolado e só pode ser acessado por contas com `role = 'admin'` no banco.
* **`admin.html`:** Dashboard administrativo exclusivo. Redirecionamento automático barra usuários comuns de acessá-lo.
* **`admin-usuarios.html`:** Gestão completa da base de clientes. Mostra contadores em tempo real (Total de usuários, Premium, Usuários Online agora). Permite forçar logout, banir contas, e conceder/revogar acessos vitálicios manualmente.
* **`admin-cadastros.html`, `admin-progresso.html`, `admin-vitalicio.html`:** Telas analíticas focadas em conversões e funis de vendas.

### 3. SEO e Marketing
* **`blog/`:** Artigos focados em SEO estruturados em HTML estático com metadados ricos para atração orgânica de leads ("Como precificar bolo no pote", etc).

---

## 💾 Banco de Dados (Supabase) - Tabelas Principais
A base de dados é protegida por **Row-Level Security (RLS)**, garantindo que usuários (tenant) só vejam seus próprios dados.

1. **`perfis`:** Dados do usuário, vinculada à `auth.users`. 
   * Colunas-chave: `id`, `nome`, `sobrenome`, `role` (admin/afiliado), `plano` (gratuito/vitalicio).
2. **`insumos`, `embalagens`, `equipamentos`, `receitas`, `despesas`, `pedidos`:** Tabelas de dados operativos. Todas possuem a coluna `user_id` e RLS ativada.
3. **`presenca_online`:** Tabela usada para rastrear usuários em tempo real. Atualiza o `last_seen` via "heartbeat" no client.
4. **`cupons_afiliado`:** Gerencia os cupons e o comissionamento.

---

## ⚙️ Regras de Negócio e Limitações
1. **Regra do Plano Gratuito (Paywall):**
   * **Insumos, Embalagens, Equipamentos e afins:** Liberado sem limites.
   * **Receitas:** Limitado a **2 cadastros no total**.
   * **Atenção:** O cálculo do limite baseia-se na **quantidade total já cadastrada no histórico**, e não no "saldo ativo". Excluir uma receita não libera "espaço" para outra. Ao bater o limite, bloqueia a criação com um paywall para comprar o acesso Vitalício.
2. **Controle de Acessos (Roles):**
   * O script `auth-guard.js` busca o perfil na inicialização de cada página. 
   * `window.__userRole` guarda o privilégio. O método `requireAdmin()` derruba qualquer usuário comum que tentar entrar nas páginas de admin, redirecionando para `index.html`. Da mesma forma, admins que abrem o site são jogados para a `admin.html`.
3. **Presença Online:**
   * Usuários mandam um sinal ("heartbeat") atualizando a coluna `last_seen`. No Admin, uma consulta aos que atualizaram nos últimos 2 minutos acende a badge de "Usuários Online".

---

## 🎨 Padrão de Estilo e UI (CSS)
Sempre que programar no ReceitasX, deve-se adotar:
* **Dark-First:** Fundos baseados em `#121212` e cartões em `#1A1A1A` ou `#1E1E1E`.
* **Glassmorphism e Bordas Sutis:** Uso forte de `border border-border-dark` ou `border-slate-800`, além de gradientes muito fracos e opacidades (`rgba(251,146,60,0.1)`) para badges e botões secundários.
* **Interatividade Suave:** Transitions ativas (`transition-all duration-200`) para hovers em cartões e botões. Botões "Call To Action" costumam ter efeitos de pulse sutil ou cores neon (Verde Esmeralda ou Azul Cyan).
* **Ícones:** Uso da classe `<span class="material-symbols-outlined">icone</span>`.

---

## 🚀 Status de Deploy
A plataforma está em produção e sincronizada via **Vercel** através da branch `main` do GitHub. Qualquer commit na `main` reflete em produção em cerca de 1 a 2 minutos. Todo o JS e CSS precisa estar otimizado e rodar diretamente no navegador sem build steps adicionais (exceto pelo próprio processamento do Vercel, se houver).
