# Checklist de Acessibilidade — WCAG 2.1 AA

> Uso: durante code review ou auditoria de UI. Marque cada item aplicável ao componente/tela em análise.
> Severidade: **CRITICAL** = bloqueia PR | **HIGH** = corrigir antes de produção | **MEDIUM** = corrigir no próximo ciclo

---

## Estrutura Semântica

- [ ] **[CRITICAL]** Toda imagem significativa tem `alt` descritivo — imagens decorativas têm `alt=""`
- [ ] **[CRITICAL]** Headings seguem hierarquia correta (`h1` → `h2` → `h3`) — sem pular níveis
- [ ] **[HIGH]** Landmarks presentes: `<main>`, `<nav>`, `<header>`, `<footer>` — permite navegação por regiões
- [ ] **[HIGH]** Listas de itens usam `<ul>`/`<ol>`, não `<div>` com bullets CSS
- [ ] **[MEDIUM]** Ícones sem texto adjacente têm `aria-label` ou texto visualmente oculto (`sr-only`)
- [ ] **[MEDIUM]** Tabelas têm `<caption>` e `<th scope="col|row">` — screen readers leem cabeçalhos corretamente

---

## Teclado e Foco

- [ ] **[CRITICAL]** Todos os elementos interativos são alcançáveis via `Tab` — sem armadilhas de foco fora de modais
- [ ] **[CRITICAL]** Modal/dialog implementa focus trap: foco fica dentro enquanto aberto, retorna ao trigger ao fechar
- [ ] **[CRITICAL]** Indicador de foco visível em todos os elementos (`outline` não removido sem substituto)
- [ ] **[HIGH]** Ordem de tabulação (`tabindex`) reflete ordem visual — `tabindex > 0` é sinal de alerta
- [ ] **[HIGH]** Dropdown/menu abre com `Enter`/`Space`, navega com setas, fecha com `Escape`
- [ ] **[MEDIUM]** Componentes customizados (ex: slider, combobox) seguem padrões ARIA Authoring Practices

---

## Cores e Contraste

- [ ] **[CRITICAL]** Texto normal (< 18pt): contraste mínimo **4.5:1** — verificar com ferramenta (ex: Colour Contrast Analyser)
- [ ] **[CRITICAL]** Texto grande (≥ 18pt ou ≥ 14pt bold): contraste mínimo **3:1**
- [ ] **[HIGH]** Componentes de UI (bordas de input, ícones ativos): contraste mínimo **3:1** contra fundo
- [ ] **[HIGH]** Informação não transmitida apenas por cor — há ícone, texto ou padrão complementar
- [ ] **[MEDIUM]** Estado de erro/sucesso tem indicação além da cor (ícone + texto)

---

## Formulários

- [ ] **[CRITICAL]** Todo `<input>`, `<select>`, `<textarea>` tem `<label>` associado via `for`/`id` ou `aria-labelledby`
- [ ] **[CRITICAL]** Erros de validação identificam o campo com erro e descrevem o problema (não só "campo inválido")
- [ ] **[HIGH]** Campo com erro tem `aria-invalid="true"` e `aria-describedby` apontando para a mensagem de erro
- [ ] **[HIGH]** Campos com dados pessoais têm atributo `autocomplete` correto (ex: `name`, `email`, `tel`)
- [ ] **[MEDIUM]** Campos obrigatórios indicados visualmente e com `required` ou `aria-required="true"`
- [ ] **[MEDIUM]** Instruções de formato (ex: "DD/MM/AAAA") visíveis antes do campo, não só no placeholder

---

## Movimento e Animação

- [ ] **[HIGH]** Animações respeitam `prefers-reduced-motion: reduce` — usar `@media (prefers-reduced-motion: reduce)` para desativar ou reduzir
- [ ] **[HIGH]** Conteúdo que pisca/anima automaticamente pode ser pausado, parado ou ocultado
- [ ] **[MEDIUM]** Sem flashes mais de 3 vezes por segundo (risco de convulsão)

---

## Touch e Mobile

- [ ] **[HIGH]** Alvos de toque têm mínimo **44×44px** (ou área de clique equivalente via padding)
- [ ] **[HIGH]** Espaçamento entre alvos interativos adjacentes ≥ 8px — evita cliques acidentais
- [ ] **[MEDIUM]** Gestos complexos têm alternativa simples (ex: arrastar tem botão equivalente)
- [ ] **[MEDIUM]** `touch-action` configurado adequadamente em elementos com scroll customizado

---

## Screen Readers

- [ ] **[CRITICAL]** Elementos que atualizam dinamicamente têm `aria-live="polite"` (ou `"assertive"` para alertas urgentes)
- [ ] **[HIGH]** Conteúdo decorativo oculto com `aria-hidden="true"` — não vaza para o tree de acessibilidade
- [ ] **[HIGH]** Botões e links com texto descritivo — evitar "clique aqui", "saiba mais" sem contexto
- [ ] **[HIGH]** Estado de toggle/accordion comunicado: `aria-expanded`, `aria-selected`, `aria-checked`
- [ ] **[MEDIUM]** Loading states anunciados: `aria-busy="true"` no container ou `aria-live` com mensagem

---

## Referências

- `Guardrails/ux.md` — regras de UX obrigatórias na Junto
- `Guidelines/ux/README.md` — guia completo de UX e design system
- WCAG 2.1: https://www.w3.org/TR/WCAG21/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
