# Checklist de Performance

> Uso: durante code review ou antes de abrir PR. Aplicar conforme a camada sendo revisada.
> Severidade: **CRITICAL** = bloqueia PR | **HIGH** = corrigir antes de produção | **MEDIUM** = corrigir no próximo ciclo

---

## Core Web Vitals — Metas Obrigatórias

| Métrica | Meta | O que mede |
|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | Velocidade de carregamento do conteúdo principal |
| **INP** (Interaction to Next Paint) | ≤ 200ms | Responsividade a interações do usuário |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | Estabilidade visual durante o carregamento |

> Medir com Lighthouse, Web Vitals extension ou `web-vitals` SDK no frontend.

---

## Frontend (React / Next.js)

### Imagens e Mídia
- [ ] **[HIGH]** Toda `<img>` tem `width` e `height` explícitos — evita layout shift (CLS)
- [ ] **[HIGH]** Imagens acima do fold têm `loading="eager"` ou sem atributo — não `loading="lazy"`
- [ ] **[HIGH]** Imagens abaixo do fold têm `loading="lazy"` — reduz bytes iniciais
- [ ] **[MEDIUM]** Imagens servidas em formato moderno (WebP/AVIF) com fallback — `<picture>` ou next/image
- [ ] **[MEDIUM]** Imagens responsivas com `srcset` e `sizes` — não servir 1200px para mobile

### Listas e Renderização
- [ ] **[HIGH]** Listas com mais de 50 itens usam virtualização (`react-window`, `react-virtual`) — sem renderizar todos no DOM
- [ ] **[HIGH]** `key` em listas usa identificador estável — não índice do array quando a lista é reordenável
- [ ] **[MEDIUM]** Componentes com re-renders frequentes auditados — `React.memo`, `useMemo`, `useCallback` onde o custo justifica
- [ ] **[MEDIUM]** `useEffect` sem dependência desnecessária — sem `[]` quando deveria ter deps, sem deps extras que disparam loop

### CSS e Animação
- [ ] **[HIGH]** `transition: all` não usado — especificar apenas as propriedades animadas (evita recalculation desnecessário)
- [ ] **[HIGH]** Animações usam `transform` e `opacity` — não animam `width`, `height`, `top`, `left` (causam reflow)
- [ ] **[MEDIUM]** CSS crítico inlined ou carregado de forma não-bloqueante — sem `<link>` de CSS grande bloqueando renderização

### Bundle e Carregamento
- [ ] **[HIGH]** Code splitting aplicado em rotas — sem bundle único com toda a aplicação
- [ ] **[HIGH]** Dependências pesadas importadas dinamicamente quando usadas sob demanda (`import()`)
- [ ] **[MEDIUM]** Bundle analisado com `webpack-bundle-analyzer` ou equivalente — sem dependências duplicadas ou inesperadamente grandes
- [ ] **[MEDIUM]** Fonts carregadas com `font-display: swap` e pré-conectadas via `<link rel="preconnect">`

---

## Backend (.NET / Node.js)

### Queries e Banco de Dados
- [ ] **[CRITICAL]** Sem N+1 queries — relacionamentos carregados via `Include`/`JOIN`/`DataLoader`, não em loop
- [ ] **[HIGH]** Campos usados em `WHERE`, `ORDER BY` ou `JOIN` têm índice — verificar query plan se necessário
- [ ] **[HIGH]** Todas as listagens têm paginação — sem `SELECT *` retornando tabela inteira
- [ ] **[HIGH]** Queries de leitura em operações de alta frequência usam projeção — sem carregar campos não utilizados
- [ ] **[MEDIUM]** Queries pesadas têm timeout configurado — não dependem do timeout padrão do banco

### Cache e Compressão
- [ ] **[HIGH]** Dados estáticos ou de baixa mutabilidade têm cache — Redis, memory cache ou cache de resposta HTTP
- [ ] **[HIGH]** Cache invalidado corretamente ao mutar o dado — sem cache stale por tempo indeterminado
- [ ] **[HIGH]** Respostas HTTP com `Content-Encoding: gzip` ou `br` — sem payloads JSON grandes sem compressão
- [ ] **[MEDIUM]** Headers de cache HTTP configurados para recursos estáticos (`Cache-Control: max-age`)

---

## BFF (NestJS / API Gateway)

- [ ] **[HIGH]** Chamadas a serviços independentes são paralelas (`Promise.all`, `Task.WhenAll`) — sem waterfall desnecessário
- [ ] **[HIGH]** Timeout configurado em todas as chamadas upstream — sem aguardar indefinidamente por serviço lento
- [ ] **[HIGH]** Resposta do BFF retorna apenas os campos que o frontend consome — sem passthrough de payload completo de domínio
- [ ] **[MEDIUM]** Circuit breaker ou retry com backoff exponencial em chamadas a serviços instáveis
- [ ] **[MEDIUM]** Respostas cacheáveis no BFF têm cache configurado — reduz carga nos serviços internos

---

## Referências

- `Guidelines/frontend/README.md` — guia completo de frontend, incluindo performance
- `Guidelines/backend/README.md` — guia completo de backend, incluindo otimização de queries
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developer.chrome.com/docs/lighthouse/
