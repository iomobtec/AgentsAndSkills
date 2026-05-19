# GuardRails — UX / Interface

Regras de qualidade de interface: acessibilidade, animação, tipografia, toque, formulários e performance visual. Complementa `frontend.md` — enquanto `frontend.md` cobre padrões React/TypeScript, este arquivo cobre **qualidade percebida e inclusividade**. Carregado por: `dev-ui-ux`, `dev-frontend`, `tech-lead`.

---

## §1 — Acessibilidade (CRITICAL)

**Padrão mínimo obrigatório:** WCAG 2.1 nível AA.

### §1.1 — Contraste de cor

| Contexto | Mínimo |
|---|---|
| Texto normal (< 18pt / < 14pt bold) | 4.5:1 |
| Texto grande (≥ 18pt / ≥ 14pt bold) | 3:1 |
| Componentes de UI e bordas | 3:1 |
| Texto decorativo / logotipos | isento |

**Bloqueado:** Definir cor sem verificar contraste. Ferramentas aceitáveis: `axe-core`, Lighthouse, browser DevTools → Accessibility → Color contrast.

### §1.2 — Elementos interativos

```tsx
// ⛔ Ação em div sem role nem keyboard handler
<div onClick={handleDelete}>Deletar</div>

// ⛔ Botão icon-only sem label
<button onClick={handleClose}><XIcon /></button>

// ✅ Semântica correta
<button onClick={handleClose} aria-label="Fechar modal">
  <XIcon aria-hidden="true" />
</button>

// ✅ Link vs botão: link navega, botão age
<a href="/pedidos">Ver pedidos</a>   // ✅ navegação
<button onClick={cancelar}>Cancelar</button>  // ✅ ação
<div onClick={cancelar}>Cancelar</div>  // ⛔ nunca
```

### §1.3 — Formulários

```tsx
// ⛔ input sem label
<input type="email" placeholder="Digite seu e-mail" />

// ✅ label associada
<label htmlFor="email">E-mail</label>
<input id="email" type="email" autoComplete="email" />

// ✅ ou aria-label quando label visível não cabe no layout
<input type="search" aria-label="Buscar produtos" />
```

### §1.4 — Navegação por teclado

- Todo fluxo principal deve ser completável sem mouse
- Ordem de foco segue o fluxo visual — nunca embaralha com `tabIndex` positivo
- `tabIndex={-1}` aceitável para controlar foco programaticamente (modais, drawers)
- Modais/drawers: foco entra ao abrir, retorna ao elemento que disparou ao fechar (focus trap)

### §1.5 — ARIA

- Usar ARIA apenas quando HTML semântico não resolve — ARIA não substitui semântica
- `aria-hidden="true"` em ícones decorativos e elementos puramente visuais
- `aria-live="polite"` em regiões que atualizam de forma assíncrona (notificações, contagens)
- `aria-expanded`, `aria-controls` em accordions, dropdowns e menus
- Headings hierárquicos: `h1` → `h2` → `h3` — nunca pular nível para estilo

### §1.6 — Bloqueados por violação crítica de acessibilidade

- `user-scalable=no` ou `maximum-scale=1` — nunca bloquear zoom do usuário
- `outline: none` / `outline: 0` sem estilo de foco substituto (`focus-visible:ring-*`)
- Cor como único diferenciador de estado (ex.: vermelho = erro sem ícone ou texto)
- Imagens significativas sem `alt` descritivo

---

## §2 — Touch & Interação (CRITICAL)

**Regra:** Todo alvo interativo deve ter área mínima de toque de **44×44pt** (iOS HIG / Material Design) — independente do tamanho visual do elemento.

```css
/* ✅ alvo de toque expandido sem alterar layout */
.icon-button {
  padding: 10px;          /* 24px ícone + 10px padding = 44px total */
  touch-action: manipulation;  /* obrigatório — desativa double-tap zoom */
}
```

**Regras adicionais:**
- `touch-action: manipulation` em todos os elementos interativos para eliminar delay de 300ms
- Espaçamento mínimo de 8px entre alvos de toque adjacentes
- `overscroll-behavior: contain` em modais, drawers e scroll containers aninhados — evita que o scroll vaze para a página
- Desabilitar seleção de texto durante drag: `user-select: none` no elemento arrastável
- Não usar `autoFocus` em mobile — abre teclado inesperadamente

---

## §3 — Animação (HIGH)

### §3.1 — Propriedades seguras para animar

```css
/* ✅ GPU-friendly — animar apenas estas */
transform: translateX() translateY() scale() rotate();
opacity: 0 → 1;

/* ⛔ Causar layout thrashing — nunca animar */
width, height, top, left, right, bottom, margin, padding
```

### §3.2 — Regras obrigatórias

```css
/* ✅ Sempre respeitar preferência do usuário */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ⛔ Proibido */
transition: all 0.3s;   /* afeta propriedades que causam layout */
transition: all;         /* idem */
```

### §3.3 — Duração e easing

| Tipo | Duração | Easing |
|---|---|---|
| Micro-interação (hover, focus) | 100–150ms | `ease-out` |
| Transição de estado (loading, toggle) | 150–250ms | `ease-in-out` |
| Entrada de elemento na tela | 200–300ms | `ease-out` |
| Saída de elemento | 150–200ms | `ease-in` |
| Nunca | > 400ms | — |

- Animações devem ser **interrompíveis** — usuário pode reverter antes de terminar
- `transform-origin` explícito em elementos que escalam ou rotacionam

---

## §4 — Tipografia (MEDIUM)

### §4.1 — Regras tipográficas

```tsx
// ✅ Ellipsis correto
const label = "Texto longo…"   // U+2026
// ⛔ Três pontos
const label = "Texto longo..."  // três caracteres separados

// ✅ Aspas tipográficas
"Confira o produto"   // " " U+201C / U+201D
// ⛔ Aspas retas
"Confira o produto"

// ✅ Non-breaking space em unidades e atalhos
"10&nbsp;MB"  "⌘&nbsp;K"
// ⛔ Espaço comum — pode quebrar no meio
"10 MB"  "⌘ K"
```

### §4.2 — Propriedades CSS obrigatórias por contexto

```css
/* Colunas numéricas — alinha dígitos perfeitamente */
.metric-column { font-variant-numeric: tabular-nums; }

/* Títulos e headings — evita linhas ímpares de 1-2 palavras */
h1, h2, h3, .card-title {
  text-wrap: balance;   /* ou text-pretty para parágrafos */
}

/* Texto corrido */
p, li { line-height: 1.5; }  /* mínimo 1.5 — nunca abaixo */
```

### §4.3 — Anti-padrões de tipografia

- Arial, Roboto, Inter, system-ui como escolha padrão sem decisão consciente de design
- Mais de 3 famílias tipográficas na mesma interface
- `font-size` menor que 12px em texto funcional
- Itálico em texto maior que 2 linhas
- All-caps em textos longos (legibilidade)

---

## §5 — Formulários (MEDIUM)

### §5.1 — Regras obrigatórias

```tsx
// ✅ Sempre label + autocomplete
<label htmlFor="cpf">CPF</label>
<input
  id="cpf"
  type="text"
  inputMode="numeric"       // abre teclado numérico no mobile
  autoComplete="off"        // CPF: off (dado sensível)
  name="cpf"
/>

// ✅ Erros inline, próximos ao campo
<input id="email" aria-describedby="email-error" aria-invalid={!!error} />
{error && <span id="email-error" role="alert">{error}</span>}
```

### §5.2 — Bloqueados em formulários

- Bloquear `paste` (`onPaste + preventDefault`) — nunca impedir colar senha/código
- Validação only on submit sem feedback — validar `onBlur` para campos visitados
- Placeholder como substituto de label — placeholder some ao digitar
- Desabilitar o botão de submit antes do envio — desabilitar apenas enquanto request está em andamento
- Avisar antes de navegar com alterações não salvas (`beforeunload`)

---

## §6 — Performance Visual (HIGH)

### §6.1 — Imagens

```tsx
// ✅ Sempre width + height explícitos — previne CLS (Cumulative Layout Shift)
<img src="/banner.webp" width={800} height={400} alt="Banner promocional" />

// ✅ Lazy loading abaixo do fold
<img src="/card.webp" loading="lazy" width={300} height={200} alt="..." />

// ✅ Prioridade para imagem above-the-fold (LCP candidate)
<Image src="/hero.webp" priority fetchPriority="high" ... />

// ⛔ Imagem sem dimensões — causa layout shift
<img src="/banner.webp" alt="Banner" />
```

### §6.2 — Listas longas

```tsx
// ✅ Virtualizar listas com > 50 itens
import { VList } from 'virtua';
// ou: content-visibility: auto com contain-intrinsic-size

// ⛔ Renderizar tudo no DOM
{items.map(item => <Row key={item.id} {...item} />)}  // quando items.length > 50
```

### §6.3 — Fontes

```css
/* ✅ Previne FOIT (flash of invisible text) */
@font-face {
  font-display: swap;
}

/* ✅ Preload de fonte crítica no <head> */
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
```

### §6.4 — Layout

- `flex` e `grid` para layout — nunca medir com JS (`getBoundingClientRect`, `offsetHeight`) durante render
- Filhos de flex/grid com texto truncado precisam de `min-width: 0` (ou `min-w-0`)
- `overflow-x: hidden` no body/html — nunca scroll horizontal não intencional

---

## §7 — Anti-padrões bloqueados (resumo)

Lista de verificação rápida — qualquer ocorrência bloqueia aprovação de PR:

| Anti-padrão | Guardrail |
|---|---|
| `user-scalable=no` / `maximum-scale=1` | §1.6 |
| `outline: none` sem substituto de foco | §1.6 |
| `<div onClick>` sem `role` e `keyboard handler` | §1.2 |
| Botão icon-only sem `aria-label` | §1.2 |
| Input sem `<label>` ou `aria-label` | §1.3 |
| Cor como único diferenciador | §1.6 |
| `transition: all` | §3.2 |
| Animação sem `prefers-reduced-motion` | §3.2 |
| Emoji como ícone funcional na UI | §4.3 |
| Imagem sem `width` e `height` | §6.1 |
| Lista > 50 itens sem virtualização | §6.2 |
| Bloquear `paste` em inputs | §5.2 |
| `autoFocus` em mobile sem justificativa | §2 |
