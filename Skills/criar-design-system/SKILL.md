# Skill: criar-design-system

Estabelece a fundação visual do produto: identidade estética, paleta de cores, tipografia, escala de espaçamento, tokens de animação e anti-padrões visuais do projeto. Produz `design-system/MASTER.md` no repositório do usuário — fonte única de verdade visual para todos os componentes.

**Agente:** dev-ui-ux  
**Guardrails aplicáveis:** `ux.md §1.1`, `ux.md §3`, `ux.md §4`

---

## Quando usar

- Ao iniciar um novo frontend antes de qualquer componente ser criado
- Quando o projeto não tem `design-system/MASTER.md`
- Quando a identidade visual precisa ser revisada ou expandida (dark mode, novo produto)

---

## Pré-requisitos

- Contexto do produto: tipo, público, palavras-chave de estilo
- Contrato BFF do arquiteto (para saber os tipos de dados exibidos)
- Stack do frontend (React/Next.js/Vite + Tailwind/CSS Modules/styled-components)
- `ui-ux-pro-max` instalado (opcional — ver Passo 1)

---

## Processo de execução

### Passo 1 — Verificar se ui-ux-pro-max está disponível

```bash
# Linux / macOS
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py --help 2>/dev/null && echo "disponível" || echo "não instalado"
# Windows (PowerShell)
python "$HOME\ui-ux-pro-max\skills\ui-ux-pro-max\scripts\search.py" --help 2>$null; if ($?) { "disponível" } else { "não instalado" }
```

**Se disponível:** usar o CLI nos passos seguintes para consultar o banco de dados de estilos, paletas e tipografia.

**Se não instalado:** executar o processo manual descrito abaixo. Informar ao usuário que a instalação da CLI enriquece as opções disponíveis (ver README.md do projeto, seção "Skills externas").

---

### Passo 2 — Coletar contexto (always-ask-first)

Antes de gerar qualquer token, o agente **pergunta**:

```
Para criar o design system, preciso entender o produto:

1. Qual o tipo de produto? 
   (fintech · saúde · e-commerce · SaaS B2B · marketplace · dashboard interno · outro)

2. Qual o público principal?
   (consumidor final · profissional técnico · operador interno · gestor · outro)

3. Que palavras descreveriam a identidade visual ideal?
   (ex: "confiança, moderno, limpo" · "ousado, expressivo, jovem" · "premium, sofisticado")

4. Há referências visuais existentes?
   (logo, paleta aprovada, concorrentes que admira ou que quer diferenciar-se)

5. O produto precisa de tema escuro (dark mode)?
```

**Nunca avançar sem respostas às perguntas 1, 2 e 3.**

---

### Passo 3 — Definir direção estética

Com base nas respostas, **comprometer-se com uma direção clara** — não ficar no meio-termo genérico:

| Tipo de produto | Direção recomendada |
|---|---|
| Fintech / Saúde | Minimalismo confiável — branco, azul institucional, espaço negativo generoso |
| SaaS B2B / Dashboard | Funcional denso — neutral dark, acentos vibrantes, tipografia técnica |
| E-commerce / Marketplace | Conversional expressivo — cor primária forte, hierarquia clara, CTAs destacados |
| Startup / Produto consumer | Contemporâneo ousado — tipografia marcante, paleta incomum, movimento intencional |
| Premium / Luxury | Refinamento contido — preto/branco/ouro, espaço, tipografia serif |

Declarar a direção ao usuário antes de gerar tokens:
```
Direção escolhida: [nome]
Conceito: [uma frase]
Confirma essa direção antes de eu gerar os tokens?
```

---

### Passo 4 — Gerar paleta de cores

**Com ui-ux-pro-max:**
```bash
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "[palavra-chave]" --domain color -n 3
```

**Manual:** Definir escala de 9 tons para a cor brand (50→900) + neutros + semânticos (success, warning, error, info). Sempre verificar contraste para os pares de uso primários (ver `ux.md §1.1` e template em `Guidelines/ux/README.md §1`).

**Obrigatório:** Verificar contraste de cada par texto/fundo antes de registrar:
- Texto primário sobre fundo page: ≥ 4.5:1
- Texto de botão sobre cor brand: ≥ 4.5:1
- Ícone/borda de UI sobre fundo: ≥ 3:1

---

### Passo 5 — Definir tipografia

**Com ui-ux-pro-max:**
```bash
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "[estilo]" --domain typography -n 3
```

**Critérios de seleção:**
- Produto técnico/B2B: preferir fontes com `tabular-nums` nativo e boa legibilidade em tamanhos pequenos
- Produto consumer: fontes com caráter — não Arial, Inter, Roboto sem decisão consciente
- Display + body podem ser a mesma família (escala de pesos) ou duas famílias complementares
- Máximo 2 famílias (3 se incluir mono para código)

**Gerar escala modular** seguindo razão 1.25 (Major Third) ou 1.333 (Perfect Fourth) conforme densidade visual do produto.

---

### Passo 6 — Definir tokens de espaçamento, borda e animação

Seguir a escala base-4 da `Guidelines/ux/README.md §1`. Ajustar os tokens de animação conforme a personalidade: produto de alto volume de ações (durações rápidas 100-200ms) vs produto expressivo (até 300ms com spring easing).

---

### Passo 7 — Documentar anti-padrões visuais do projeto

Lista de "nunca fazer neste produto" — derivada da direção estética escolhida. Exemplos para cada direção:

- **Minimalismo confiável:** nunca gradientes agressivos, nunca mais de 2 tons de cor principal, nunca animações desnecessárias
- **Funcional denso:** nunca whitespace excessivo que reduza densidade informacional, nunca tipografia display em tabelas
- **Contemporâneo ousado:** nunca paleta neutra sem acentos, nunca layout de grid rígido sem quebras

---

### Passo 8 — Escrever `design-system/MASTER.md`

Usar o template completo de `Guidelines/ux/README.md §1`. O arquivo deve ser auto-suficiente — qualquer desenvolvedor lendo deve entender as decisões sem contexto adicional.

```bash
# Com ui-ux-pro-max (gera e persiste automaticamente)
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py "[tipo de produto]" --design-system -p "[Nome]"
# Cria: design-system/MASTER.md + design-system/pages/
```

---

### Passo 9 — Preload de fontes no `<head>`

Gerar o snippet de preload para o HTML/layout base do projeto:

```html
<!-- Preload das fontes críticas — inserir no <head> antes de qualquer stylesheet -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  rel="preload"
  href="/fonts/[family]-variable.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

---

## Anti-padrões bloqueados

- Gerar tokens sem perguntar sobre o produto (`ux.md` — always-ask-first)
- Usar Inter, Roboto, Arial, system-ui como padrão sem decisão consciente
- Definir par de cores sem verificar contraste WCAG AA
- Criar paleta sem tokens semânticos (usar hex direto no código)
- Ignorar dark mode quando produto tem usuários em ambientes controlados
- Gradientes roxos/azuis genéricos em backgrounds — o padrão de "AI-generated UI"
- `transition: all` como token de animação padrão (`ux.md §3.2`)

---

## Checklist de conclusão

- [ ] Perguntas de contexto respondidas — direção estética definida e confirmada
- [ ] `design-system/MASTER.md` criado com todos os tokens (cores, tipografia, espaçamento, borda, animação)
- [ ] Contraste verificado para todos os pares de cor primários (≥ 4.5:1 texto, ≥ 3:1 UI)
- [ ] Tipografia escolhida com caráter — não Inter/Roboto genérico
- [ ] Tokens dark mode definidos (se aplicável)
- [ ] Anti-padrões visuais do projeto documentados
- [ ] Snippet de preload de fontes gerado
- [ ] Agente `dev-frontend` notificado do caminho `design-system/MASTER.md`
