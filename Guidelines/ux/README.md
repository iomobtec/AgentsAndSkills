# Guidelines — UX / Interface

Guias de referência para design de interfaces: sistema de design, especificação de componentes, acessibilidade e identidade visual. Usado pelo agente `dev-ui-ux` e consultado por `dev-frontend` e `tech-lead`.

---

## 1. Sistema de Design — Estrutura do `MASTER.md`

O arquivo `design-system/MASTER.md` é a fonte única de verdade visual do projeto. Criado pelo `dev-ui-ux` com `criar-design-system`, mantido ao longo da vida do produto.

### Template de MASTER.md

```markdown
# Design System — [Nome do Produto]

> Gerado em: [data] | Stack: [React/Next.js/Vite] | Tema: [light/dark/ambos]

---

## Identidade Visual

**Conceito:** [Uma frase que descreve a direção estética — ex: "Minimalismo funcional com acentos de energia"]
**Público:** [Quem usa este produto]
**Tom:** [Profissional / Amigável / Técnico / Premium]

---

## Paleta de Cores

### Tokens semânticos (usar sempre — nunca valores hexadecimais diretos)

```css
:root {
  /* Brand */
  --color-brand-50:  #f0f9ff;
  --color-brand-100: #e0f2fe;
  --color-brand-500: #0ea5e9;  /* cor primária */
  --color-brand-600: #0284c7;  /* hover */
  --color-brand-900: #0c4a6e;

  /* Neutros */
  --color-neutral-0:   #ffffff;
  --color-neutral-50:  #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-500: #64748b;
  --color-neutral-700: #334155;
  --color-neutral-900: #0f172a;

  /* Semânticos */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error:   #dc2626;
  --color-info:    #2563eb;

  /* Superfícies */
  --color-bg-page:    var(--color-neutral-50);
  --color-bg-card:    var(--color-neutral-0);
  --color-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Texto */
  --color-text-primary:   var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-disabled:  var(--color-neutral-200);
  --color-text-inverse:   var(--color-neutral-0);
}

[data-theme="dark"] {
  --color-bg-page:  var(--color-neutral-900);
  --color-bg-card:  var(--color-neutral-700);
  --color-text-primary:   var(--color-neutral-0);
  --color-text-secondary: var(--color-neutral-200);
}
```

### Verificação de contraste obrigatória

| Par de cores | Uso | Relação | WCAG AA |
|---|---|---|---|
| `--text-primary` / `--bg-page` | Texto corrido | ≥ 4.5:1 | ✅ |
| `--brand-500` / `--bg-page` | Botão primário texto | ≥ 4.5:1 | ✅ |
| `--text-secondary` / `--bg-card` | Labels, captions | ≥ 4.5:1 | ✅ |

---

## Tipografia

```css
:root {
  /* Famílias */
  --font-display: '[Fonte display]', sans-serif;   /* títulos, headings */
  --font-body:    '[Fonte corpo]', sans-serif;      /* texto corrido, UI */
  --font-mono:    '[Fonte mono]', monospace;        /* código, dados técnicos */

  /* Escala modular (razão 1.25 — Major Third) */
  --text-xs:   0.75rem;   /* 12px — captions, labels secundários */
  --text-sm:   0.875rem;  /* 14px — body small, botões pequenos */
  --text-base: 1rem;      /* 16px — body padrão */
  --text-lg:   1.25rem;   /* 20px — subtítulos */
  --text-xl:   1.5rem;    /* 24px — títulos de seção */
  --text-2xl:  2rem;      /* 32px — títulos de página */
  --text-3xl:  2.5rem;    /* 40px — hero */

  /* Pesos */
  --font-regular:   400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;

  /* Line heights */
  --leading-tight:  1.25;   /* headings */
  --leading-normal: 1.5;    /* body — mínimo */
  --leading-relaxed: 1.75;  /* texto longo */

  /* Letter spacing */
  --tracking-tight:  -0.025em;  /* headings grandes */
  --tracking-normal:  0;
  --tracking-wide:    0.05em;   /* all-caps labels */
}
```

---

## Espaçamento

Escala base-4 (múltiplos de 4px):

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

**Regra:** Nunca usar valores arbitrários de espaçamento. Todo padding, margin, gap e tamanho deve referenciar um token ou ser múltiplo de 4.

---

## Raios de borda e sombras

```css
:root {
  /* Border radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;  /* pills, avatars */

  /* Sombras — escala de elevação */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
}
```

---

## Tokens de animação

```css
:root {
  --duration-instant:  0ms;     /* nunca usar para transições visíveis */
  --duration-fast:   150ms;     /* hover, focus */
  --duration-normal: 200ms;     /* toggle, loading state */
  --duration-slow:   300ms;     /* entrada de elementos */
  --duration-slower: 400ms;     /* máximo absoluto */

  --easing-out:     cubic-bezier(0, 0, 0.2, 1);   /* entrada de elementos */
  --easing-in:      cubic-bezier(0.4, 0, 1, 1);   /* saída */
  --easing-in-out:  cubic-bezier(0.4, 0, 0.2, 1); /* transições de estado */
  --easing-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* bouncy — modais */
}
```

---

## Anti-padrões visuais do projeto

Liste aqui o que especificamente **não deve aparecer** neste produto:

```markdown
- [ ] Gradientes roxos/azuis genéricos em backgrounds
- [ ] Ícones emoji como elementos funcionais da UI
- [ ] Tipografia system-ui sem font-display customizada
- [ ] Cards com sombra intensa em fundo escuro
- [ ] Botões com texto em ALL CAPS sem tracking adequado
- [ ] [adicionar anti-padrões específicos do projeto]
```

---

## 2. Template de Especificação de Componente

Usado pela skill `especificar-componente`. Um arquivo por componente em `plans/dev-frontend/`.

```markdown
# Especificação: [NomeDoComponente]

**Ticket:** [US-XXX]  
**Tipo:** Componente de UI / Tela / Seção  
**Stack:** React 18+ / TypeScript / [Tailwind | CSS Modules | styled-components]

---

## Propósito

[O que este componente faz, de onde consome dados, qual problema resolve para o usuário]

---

## Estados

| Estado | Descrição | Gatilho |
|---|---|---|
| `default` | [aparência normal] | [renderização inicial] |
| `hover` | [mudança visual no hover] | [mouse over] |
| `focus` | [ring de foco visível] | [tabulação / clique] |
| `loading` | [skeleton ou spinner] | [requisição em andamento] |
| `empty` | [estado vazio com CTA] | [lista sem itens] |
| `error` | [mensagem de erro inline] | [falha na requisição] |
| `disabled` | [visual atenuado, cursor not-allowed] | [prop disabled=true] |

---

## Dados esperados (contrato do BFF)

```typescript
interface [ComponentName]Props {
  // derivado do endpoint definido pelo arquiteto
}
```

---

## Requisitos de acessibilidade

- [ ] Role semântica: `<[elemento]>` ou `role="[role]"`
- [ ] Label: `aria-label="[texto]"` ou `aria-labelledby="[id]"`
- [ ] Keyboard: [quais teclas funcionam — Enter, Space, Escape, Arrow keys]
- [ ] Focus: retorna ao elemento correto após [ação específica]
- [ ] Contraste: [par de cores] → [relação] ≥ [4.5:1 | 3:1]
- [ ] Screen reader: [o que o leitor anuncia]

---

## Responsividade

| Breakpoint | Comportamento |
|---|---|
| mobile (< 768px) | [layout e comportamento] |
| tablet (768–1024px) | [ajustes] |
| desktop (> 1024px) | [layout padrão] |

---

## Tokens usados

| Token | Uso |
|---|---|
| `--color-brand-500` | cor do botão primário |
| `--space-4` | padding interno |
| `--radius-md` | borda arredondada |
| `--duration-fast` | transição de hover |

---

## Referências visuais

[Descrição do visual, ou link para Figma/screenshot se disponível]
```

---

## 3. Checklist de acessibilidade por tipo de componente

### Botões e links

- [ ] Texto descritivo (não "Clique aqui", não "Saiba mais")
- [ ] `aria-label` quando texto não está visível (icon-only)
- [ ] `aria-disabled` + `tabIndex={0}` quando visualmente desabilitado mas anunciável
- [ ] Estados `hover` e `focus-visible` visualmente distintos
- [ ] Alvo de toque ≥ 44×44px

### Formulários

- [ ] `<label>` para todo input (não só placeholder)
- [ ] `autocomplete` adequado ao campo
- [ ] `inputMode` no mobile (numeric, email, tel, url)
- [ ] Erro inline próximo ao campo com `aria-describedby`
- [ ] `aria-invalid="true"` no campo com erro
- [ ] Não bloquear paste

### Modais e Drawers

- [ ] Focus vai para o modal ao abrir
- [ ] Foco fica preso no modal (focus trap) enquanto aberto
- [ ] Fechar com `Escape`
- [ ] Foco retorna ao elemento que abriu ao fechar
- [ ] `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- [ ] `overscroll-behavior: contain` no container interno

### Listas e Tabelas

- [ ] `<ul>/<ol>` para listas semânticas
- [ ] `<table>` com `<thead>`, `<th scope>` para dados tabulares
- [ ] `aria-label` ou `<caption>` na tabela
- [ ] Virtualização para > 50 itens
- [ ] Estado vazio tratado com mensagem descritiva

### Notificações e Alertas

- [ ] `role="alert"` para erros críticos (anuncia imediatamente)
- [ ] `aria-live="polite"` para notificações não urgentes
- [ ] `aria-live="assertive"` apenas para erros bloqueantes
- [ ] Não depende só de cor para transmitir status

---

## 4. Uso do ui-ux-pro-max (quando instalado)

```bash
# Gerar design system completo para o projeto
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard" --design-system -p "MeuProjeto"
# Cria: design-system/MASTER.md + design-system/pages/

# Buscar por domínio específico
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "azul confiança" --domain color -n 5
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "Inter" --domain typography
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain style

# Stack específica
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "card component" --stack react

# Persistir spec de página específica (sobrepõe MASTER.md para aquela página)
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "checkout" --design-system -p "MeuProjeto" --persist
```

**Hierarquia de precedência:** `plans/dev-frontend/<ticket>-ui-spec.md` > `design-system/pages/<page>.md` > `design-system/MASTER.md`

---

## 5. Verificação com web-interface-guidelines

A skill `revisar-interface` busca as diretrizes de `vercel-labs/web-interface-guidelines` automaticamente via `WebFetch` a cada execução — nenhuma instalação necessária. Basta invocar a skill normalmente:

```
revisar-interface src/components/**/*.tsx
revisar-interface src/pages/checkout.tsx
```

Output esperado — agrupado por arquivo, formato `file:line`:
```
## src/components/Button.tsx
src/components/Button.tsx:42 - icon button missing aria-label
src/components/Button.tsx:55 - animation missing prefers-reduced-motion

## src/components/Card.tsx
✓ pass
```

Se o repositório estiver indisponível, a skill registra um aviso no relatório e opera com a checklist interna derivada de `ux.md`.

---

## Referências

- https://github.com/vercel-labs/web-interface-guidelines
- https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
- https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills
- https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
- https://github.com/AccessLint/claude-marketplace/blob/main/plugins/accesslint/skills/audit/SKILL.md
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/bencium/bencium-marketplace
