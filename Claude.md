# Contexto do Projeto "ReceitasX" para Assistentes de IA

Este documento serve como um **System Prompt** e guia de contexto para apresentar toda a arquitetura, regras de negócio, tecnologias e funcionalidades do **ReceitasX** a qualquer nova sessão de Inteligência Artificial.

---

## 📌 Visão Geral do Projeto
O **ReceitasX** é uma aplicação web SaaS (Software as a Service) focada no setor gastronômico (confeitarias, dark kitchens, autônomos). Ele permite que os usuários cadastrem ingredientes (insumos), criem fichas técnicas de receitas e calculem automaticamente o custo de produção, precificação de venda (inclusive para marketplaces como iFood) e margem de lucro.

A plataforma possui um modelo de monetização **Freemium com Upgrade Vitalício**, sistema integrado de cupons/afiliados, programa de indicação, e um dashboard administrativo completo.

## 🛠 Stack Tecnológico
* **Frontend:** HTML5, Vanilla JavaScript, CSS nativo em blocos `<style>`, e **Tailwind CSS via CDN**.
* **Ícones e Tipografia:** Material Symbols Outlined (Google) e fonte Inter (Google Fonts).
* **Backend & Banco de Dados:** **Supabase** (PostgreSQL).
* **Autenticação:** Supabase Auth (Email/Senha). Client compartilhado via `supabase-client.js` (variável global `sb`). Sessão via `getSession()` (cache local).
* **Deploy e Hospedagem:** Vercel (auto-deploy na branch `main`).
* **Pagamentos:** Checkout integrado com Abacate Pay (via Supabase Edge Functions).
* **Analytics:** Google Analytics 4 (GA4) + Google Ads conversion tracking (`analytics.js`).
* **PDF Export:** html2pdf.js via CDN (usado na Lista de Compras).

---

## 📂 Estrutura de Módulos e Frontend

### 1. Área do Cliente (Usuário Comum)
A interface do usuário foca na gestão do negócio gastronômico, orientada a um **Dark Mode** premium.

| Página | Descrição |
|---|---|
| `index.html` | Dashboard principal com atalhos rápidos, alertas de dados faltantes, guia de configuração e controle de visibilidade por role (`data-role`). Card "Painel Admin" visível apenas para admins. |
| `gerenciar-insumos.html` | Gestão de matérias-primas com custo, quantidade e cálculo automático de preço unitário. |
| `gerenciar-embalagens.html` | Cadastro e gestão de embalagens. |
| `gerenciar-equipamentos.html` | Cadastro de equipamentos (depreciação e custo hora/máquina). |
| `receitas.html` | Coração da plataforma. Ficha técnica interativa com insumos, embalagens, rendimentos, custo de produção e lucro líquido. |
| `gestao-produtos.html` | Gestão de produtos derivados das receitas. |
| `combos.html` | Criação de combos/kits de produtos. |
| `lista-compras.html` | **Novo!** Selecionar receitas via checkbox, ajustar quantidade, e gerar lista consolidada de ingredientes/embalagens com exportação em PDF. |
| `precificacao-marketplace.html` | Simulação de taxas de aplicativos (iFood, etc) sobre os produtos. |
| `despesas.html` | Gestão de custos fixos (água, luz, aluguel, pró-labore). |
| `ponto-equilibrio.html` | Cálculo do ponto de equilíbrio financeiro. |
| `configuracoes.html` | Preferências do usuário (gás, energia, mão de obra, margem). |
| `perfil.html` | Controle da conta do usuário. |
| `extrato-vendas.html` | Extrato de vendas e faturamento. |
| `meus-ganhos.html` | Dashboard de ganhos do afiliado. |
| `indique-ganhe.html` | Programa de indicação entre usuários. |
| `meus-feedbacks.html` | Envio de feedbacks para o admin. |
| `como-usar.html` | Tutoriais e guias de uso. |
| `guia-configuracao.html` | Passo a passo para configuração inicial. |
| `acesso-vitalicio.html` | Informações sobre o plano vitalício. |
| `checkout.html` | Página de pagamento (integrada com Abacate Pay). |
| `solicitar-reembolso.html` | Formulário de solicitação de reembolso. |

### 2. Área Administrativa (Admin)
O painel administrativo é isolado e só pode ser acessado por contas com `role = 'admin'` no banco. Organizado em seções temáticas: **Métricas, Usuários, Financeiro, Conteúdo, Configurações**.

| Página | Descrição |
|---|---|
| `admin.html` | Dashboard administrativo com seções organizadas e link de volta ao `index.html`. |
| `admin-analytics.html` | Analytics e métricas do sistema. |
| `admin-sessoes.html` | Monitoramento de sessões de acesso dos usuários. |
| `admin-progresso.html` | Visão de progresso dos usuários no funil. |
| `admin-cliques-afiliados.html` | Rastreamento de cliques em links de afiliados. |
| `admin-usuarios.html` | Gestão completa da base de clientes (total, premium, online). |
| `admin-usuarios-config.html` | Monitoramento das configurações de cada usuário (gás, energia, impostos). |
| `admin-vitalicio.html` | Ativação/revogação de planos premium. |
| `admin-cupons.html` | Gestão de cupons com tracking de cliques e usos. |
| `admin-emails.html` | Email marketing em massa. |
| `admin-feedbacks.html` | Visualização de feedbacks dos usuários. |
| `admin-pedidos.html` | Monitoramento de pedidos do sistema. |
| `admin-avisos.html` | Publicação de avisos/notificações para os usuários. |
| `admin-tutoriais.html` | Gestão de tutoriais e guias. |
| `admin-cadastros.html` | Análise de cadastros. |
| `admin-faturamento-afiliados.html` | Faturamento e comissões dos afiliados. |
| `admin-historico-pagamentos.html` | Histórico completo de pagamentos. |
| `admin-reembolsos.html` | Gestão de solicitações de reembolso. |
| `admin-configuracoes.html` | Configurações globais do sistema. |
| `admin-vitrine-tiktok.html` | Gestão de produtos afiliados TikTok. |
| `admin-insumos-usuarios.html` | Visualização de insumos por usuário. |
| `admin-embalagens-usuarios.html` | Visualização de embalagens por usuário. |
| `admin-receitas-usuarios.html` | Visualização de receitas por usuário, com cálculo automático de médias (custo, preço, lucro e margem) no card do usuário. |
| `admin-produtos-vinculados.html` | Produtos vinculados a receitas. |

### 3. Landing Pages e Marketing
| Página | Descrição |
|---|---|
| `landing.html` | Landing page principal de vendas. |
| `calculadora.html` | Calculadora grátis de precificação (lead magnet para Google Ads). Inclui prova social, depoimentos, CTA otimizado e tracking de conversão. |
| `blog.html` | Hub de artigos SEO. |
| `receitas-geladinho.html` | Landing page de receita de geladinho. |
| `login.html` | Login/Cadastro com suporte a parâmetros `tab=signup&origin=calculadora`. |
| `promo.html` / `oferta.html` | Páginas promocionais. |

### 4. Scripts Compartilhados
| Arquivo | Descrição |
|---|---|
| `supabase-client.js` | Client Supabase compartilhado. Expõe `sb` (client), `getSession()` (com cache) e `getUser()`. |
| `auth-guard.js` | Guard de autenticação. Expõe `window.__userRole`, `window.__userProfile`, `requireAdmin()`, `requireAfiliado()`. |
| `plano-guard.js` | Guard de plano (verifica se o usuário tem acesso a funcionalidades premium). |
| `config-loader.js` | Carregamento de configurações do usuário. |
| `analytics.js` | Integração com Google Analytics 4. |
| `notificacoes-afiliado.js` | Sistema de notificações para afiliados. |
| `vitrine-produtos-tiktok.js` | Renderização da vitrine de produtos TikTok. |

---

## 💾 Banco de Dados (Supabase) - Tabelas Principais
A base de dados é protegida por **Row-Level Security (RLS)**, garantindo que usuários (tenant) só vejam seus próprios dados. Admins possuem policies de leitura global para tabelas específicas.

### Tabelas Operacionais
| Tabela | Descrição |
|---|---|
| `perfis` | Dados do usuário, vinculada à `auth.users`. Colunas-chave: `id`, `nome`, `sobrenome`, `role` (admin/afiliado), `plano` (gratuito/vitalicio), `origem_cadastro`. |
| `insumos` | Matérias-primas com custo e quantidade. |
| `embalagens` | Embalagens com custo unitário. |
| `equipamentos` | Equipamentos com depreciação. |
| `receitas` | Fichas técnicas. Campos JSONB: `ingredientes`, `embalagens`, `equipamentos`. |
| `produtos` | Produtos derivados das receitas. |
| `combos` | Combos de produtos. |
| `despesas` | Custos fixos mensais. |
| `pedidos` | Registro de vendas/pedidos. |
| `configuracoes` | Preferências do usuário (gás, energia, mão de obra, margem). |

### Tabelas de Rastreamento e Analytics
| Tabela | Descrição |
|---|---|
| `presenca_online` | Heartbeat de usuários online (campo `last_seen`). |
| `sessoes_usuario` | Log de entrada/saída de sessões. |
| `page_views` | Visualizações de páginas. |
| `cliques_afiliados` | Tracking de cliques em links afiliados. |

### Tabelas de Monetização
| Tabela | Descrição |
|---|---|
| `cupons_afiliado` | Cupons de desconto com comissionamento. |
| `indicacoes` | Programa de indicação entre usuários. |
| `saques_afiliado` | Controle de saques de comissões. |
| `reembolsos` | Solicitações de reembolso. |

### Tabelas de Conteúdo
| Tabela | Descrição |
|---|---|
| `avisos_admin` | Avisos/notificações publicados pelo admin. |
| `tutoriais` | Tutoriais e guias de uso. |
| `feedbacks` | Feedbacks enviados pelos usuários. |
| `vitrine_tiktok` | Produtos afiliados da vitrine TikTok. |
| `insumos_catalogo` | Catálogo compartilhado de insumos. |

---

## ⚙️ Regras de Negócio e Limitações
1. **Regra do Plano Gratuito (Paywall):**
   * **Insumos, Embalagens, Equipamentos e afins:** Liberado sem limites.
   * **Receitas:** Limitado a **2 cadastros no total**.
   * **Atenção:** O cálculo do limite baseia-se na **quantidade total já cadastrada no histórico**, e não no "saldo ativo". Excluir uma receita não libera "espaço" para outra. Ao bater o limite, bloqueia a criação com um paywall para comprar o acesso Vitalício.
2. **Controle de Acessos (Roles):**
   * O script `auth-guard.js` busca o perfil na inicialização de cada página.
   * `window.__userRole` guarda o privilégio. O método `requireAdmin()` derruba qualquer usuário comum que tentar entrar nas páginas de admin, redirecionando para `index.html`.
   * No `index.html`, elementos com `data-role="admin"` ficam ocultos por padrão e só são exibidos se o role do usuário for admin.
3. **Presença Online:**
   * Usuários mandam um sinal ("heartbeat") atualizando a coluna `last_seen`. No Admin, uma consulta aos que atualizaram nos últimos 2 minutos acende a badge de "Usuários Online".
4. **Sessões de Acesso:**
   * Tabela `sessoes_usuario` registra login/logout de todos os usuários. Visível em `admin-sessoes.html`.
5. **Lista de Compras:**
   * Busca receitas filtradas por `user_id` (não carrega receitas de outros usuários).
   * Agrega ingredientes e embalagens de múltiplas receitas com multiplicador de quantidade.
   * Exporta em PDF via `html2pdf.js`.

---

## 🎨 Padrão de Estilo e UI (CSS)
Sempre que programar no ReceitasX, deve-se adotar:
* **Dark-First:** Fundos baseados em `#121212` (ou `#0F0F0F` no estilo "Gray Mandate") e cartões em `#1A1A1A` ou `#1E1E1E`.
* **Cor Primária:** Cyan `#25f4f4` para CTAs, destaques e ícones interativos.
* **Cores Secundárias:** Verde `#34d399`, Amarelo `#fbbf24`, Laranja `#fb923c` (admin), Vermelho `#f87171`.
* **Glassmorphism e Bordas Sutis:** Uso forte de `border border-border-dark` ou `border-slate-800`, além de gradientes muito fracos e opacidades (`rgba(251,146,60,0.1)`) para badges e botões secundários.
* **Interatividade Suave:** Transitions ativas (`transition-all duration-200`) para hovers em cartões e botões. Botões "Call To Action" costumam ter efeitos de pulse sutil ou cores neon (Verde Esmeralda ou Azul Cyan).
* **Ícones:** Uso da classe `<span class="material-symbols-outlined">icone</span>`.
* **Tipografia:** Fonte Inter via Google Fonts com pesos 300-900.
* **Padrão Admin:** Cards admin usam classe `.nav-card-admin` com borda laranja sutil.

---

## 🔐 Segurança
* **RLS ativo** em todas as tabelas operacionais com policy `auth.uid() = user_id`.
* **Admins** possuem policies de leitura separadas (`*_admin_read`) para visualizar dados de todos os usuários.
* **RPCs administrativas** com `SECURITY DEFINER` para operações que bypass RLS (ex: `rpc_admin_progresso`, `rpc_ativar_vitalicio`).
* **reCAPTCHA v3** integrado em formulários críticos.
* **UTM Tracking:** Parâmetros UTM e `gclid` são capturados no `localStorage` e vinculados ao perfil no cadastro (`origem_cadastro`).

---

## 🚀 Status de Deploy
A plataforma está em produção em **receitasx.com.br** e sincronizada via **Vercel** através da branch `main` do GitHub. Qualquer commit na `main` reflete em produção em cerca de 1 a 2 minutos. Todo o JS e CSS precisa estar otimizado e rodar diretamente no navegador sem build steps adicionais.

### Convenções de Código
* Variável do Supabase: `sb` (não `supabase`)
* Sessão: usar `await getSession()` (não `sb.auth.getSession()`)
* Usuário: usar `await getUser()` ou `session.user`
* Role: `window.__userRole` (definido por `auth-guard.js`)
* Todas as queries devem filtrar por `user_id` quando no contexto do usuário
* Arquivos HTML são self-contained (CSS + JS inline), exceto scripts compartilhados
