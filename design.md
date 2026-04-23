# Design System & UI Guidelines - ReceitasX

Este documento define o padrão visual, componentes e comportamentos de interface da aplicação ReceitasX. Qualquer nova tela ou componente deve seguir estas diretrizes para manter a consistência visual focada na experiência "Premium" da plataforma.

---

## 🎨 Cores e Tema (Dark Mode First)
O ReceitasX é uma aplicação primariamente **Dark Mode**. Cores claras só devem ser usadas no texto e em pequenos destaques.

### Backgrounds e Superfícies
* **Background da Página:** `#121212` (`bg-background-dark`) - Usado no `body`.
* **Cards e Módulos Secundários:** `#1A1A1A` - Usado para o fundo de painéis, listas e cards de estatísticas.
* **Cards em Destaque:** `#1E1E1E` (`bg-card-dark`) - Usado em modais ou botões grandes em destaque.
* **Bordas (Subtis):** `#2A2A2A` (`border-border-dark`) - Essencial para separar elementos sem sobrecarregar a tela.

### Cores de Destaque (Accents) e Feedback
Sempre utilizadas com opacidade reduzida no fundo e opacidade total no texto/borda para gerar efeito de "Neón Suave" ou "Badge".
* **Primária / Ação Positiva:** Cyan/Esmeralda `#25f4f4` ou `#34d399` (ex: Botões de salvar, usuários online, badges de sucesso).
* **Administração / Aviso:** Laranja `#fb923c` ou Âmbar `#fbbf24` (ex: Avisos, badges de sistema, admin banners).
* **Destrutivo / Erro:** Vermelho `#f87171` (ex: Deletar receitas, forçar logout).
* **Premium / Vitálicio:** Roxo `#a78bfa` ou `#8b5cf6` (ex: Badges de usuários que compraram acesso vitalício).

---

## 🖋 Tipografia
* **Fonte Principal:** `Inter` (Google Fonts).
* **Pesos (Weights):** 
  * `300` e `400`: Textos longos, descrições secundárias (`text-slate-400`).
  * `500` e `600`: Títulos de cards, labels de inputs, botões.
  * `700` e `800`: Títulos de páginas, badges em destaque, valores numéricos em dashboards.
* **Tons de Texto:**
  * Principal: `#f1f5f9` (Branco fosco).
  * Secundário: `#94a3b8` ou `#64748b` (Cinza azulado para legendas e datas).

---

## 💠 Ícones
* **Biblioteca:** `Material Symbols Outlined` (Google).
* **Variações Base:** 
  * `FILL 0` (vazado para a maioria dos casos).
  * `FILL 1` (preenchido para botões primários ou destaque forte, como a estrela de "Vitálicio").
  * `wght 300` a `400`, `opsz 24`.

---

## 🔲 Formas, Efeitos e Componentes

### 1. Cantos Arredondados (Border Radius)
* **Cards e Painéis:** `.85rem` ou `rounded-xl`. O app utiliza curvas amigáveis e modernas.
* **Botões Padrão e Inputs:** `.5rem` ou `.75rem`.
* **Badges:** `9999px` (Completamente arredondado/Pill) ou `.4rem` dependendo do nível de detalhe.

### 2. Glassmorphism e Transparências
* **Header e Barras Flutuantes:** Fundo escuro com leve transparência (`bg-background-dark/90`) combinado com `backdrop-blur` para criar efeito de vidro opaco por cima do conteúdo.
* **Botões Ghost/Secundários:** Não usar fundo sólido. Usar `background: rgba(COR, 0.1)` com borda fina `border: 1px solid rgba(COR, 0.25)`.

### 3. Cards Interativos (Hovers)
Ao passar o mouse (`:hover`), os cards não mudam drasticamente de cor. O padrão é:
* A borda que era cinza (`#2A2A2A`) passa a brilhar com a cor primária (ex: `rgba(37,244,244, 0.4)`).
* Aplica-se um leve `box-shadow: 0 0 0 1px rgba(COR, 0.1)` junto a um `transform: translateY(-1px)` ou escala sutil.
* Sempre use transições suaves (`transition: all 0.2s ease`).

### 4. Feedbacks e Animações
* **Toasts (Avisos Flutuantes):** Surgem do bottom-center da tela (`translateY(0)` animando de `translateY(80px)`), fundo escuro (`#1E1E1E`), borda neon sutil e ícone.
* **Pulsos:** Elementos "Live" (como usuários online) usam uma bolinha verde com animação `@keyframes pulse-dot` (escala e opacidade).
* **Skeleton Loaders:** Antes do conteúdo carregar (ex: Lista de usuários), usa-se o efeito Shimmer (gradiente em movimento horizontal `background-size: 200% 100%`) na cor das superfícies.

---

## 📐 Padrão de Código Tailwind
Apesar de usar CSS nativo para classes complexas, o uso de Tailwind padrão via CDN é incentivado no esqueleto:
* Usar `flex flex-col gap-3`, `items-center`, `justify-between` extensivamente para alinhamento.
* Usar `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3` para cartões de dashboards.
* Respeitar espaçamentos em `rem` (`p-4`, `py-6`).
