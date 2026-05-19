# Template de ADR (Architecture Decision Record)

> Uso: copie o template abaixo para `docs/decisions/ADR-NNN.md` e preencha cada seção.
> Convenção de numeração: NNN = 3 dígitos, zero-padded. Exemplos: `ADR-001`, `ADR-042`, `ADR-100`.

---

## Quando criar um ADR

**Crie um ADR quando a decisão:**
- Afeta a arquitetura do sistema (estrutura, padrões, tecnologias)
- É difícil ou custosa de reverter depois
- Impacta múltiplos times ou serviços
- Gerou debate significativo antes de ser tomada
- Substituiu uma decisão anterior

**Não crie um ADR para:**
- Decisões de implementação que cabem num comentário de código
- Escolhas de estilo ou formatação (isso vai no linter/guia)
- Decisões facilmente reversíveis sem impacto sistêmico
- Decisões já capturadas em documentação existente

---

## Regras de Manutenção

- **Nunca delete um ADR** — crie um novo com status `Substituído` e referência ao ADR anterior
- **Atualize o status** quando a decisão mudar: `Proposto` → `Aceito` → `Substituído` / `Depreciado`
- **ADRs são imutáveis no conteúdo** — o contexto histórico deve ser preservado; adicione notas de atualização ao final se necessário

---

## Template

```markdown
# ADR-NNN: [Título Curto e Descritivo da Decisão]

**Data:** AAAA-MM-DD
**Status:** Proposto | Aceito | Substituído | Depreciado
**Decisores:** [Nome(s) de quem tomou a decisão]
**Substituído por:** [ADR-NNN] *(preencher apenas se Status = Substituído)*

---

## Contexto

[Descreva o problema ou situação que motivou a decisão. O que está acontecendo?
Quais são as forças em jogo — técnicas, de negócio, de equipe, de prazo?
Escreva como se o leitor não conhecesse o contexto original.]

## Decisão

[Descreva a decisão tomada de forma afirmativa e direta.
"Vamos usar X para Y porque Z."
Sem ambiguidade — quem ler deve saber exatamente o que foi decidido.]

## Consequências

### Positivas
- [Benefício 1]
- [Benefício 2]

### Negativas / Trade-offs
- [Custo ou limitação 1]
- [Custo ou limitação 2]

### Neutras / Observações
- [O que muda operacionalmente, mas não é necessariamente bom ou ruim]

## Alternativas Consideradas

### Alternativa 1: [Nome]
[Breve descrição e por que foi descartada]

### Alternativa 2: [Nome]
[Breve descrição e por que foi descartada]

## Referências

- [Link para RFC, ticket, documento, benchmark ou discussão relevante]
- [Link para ADR relacionado, se houver]
```

---

## Guia de Preenchimento por Seção

**Título:** Deve descrever a decisão, não o problema. Use verbos: "Adotar", "Migrar", "Substituir", "Padronizar".
- Bom: `ADR-007: Adotar NestJS como framework padrão para BFFs`
- Ruim: `ADR-007: Framework de BFF`

**Status:**
- `Proposto` — em discussão, ainda não aprovado
- `Aceito` — aprovado e em vigor
- `Substituído` — foi válido, mas foi trocado por outro (referenciar o substituto)
- `Depreciado` — não é mais aplicável, mas não foi ativamente substituído

**Contexto:** Escreva em tempo passado/presente. Capture o "por quê agora". Inclua restrições de negócio, tamanho de equipe, legado existente.

**Decisão:** Uma ou duas frases principais. O restante vai em "Consequências". Não misture justificativa aqui.

**Consequências:** Liste tanto os ganhos quanto os custos. ADRs sem trade-offs negativos geralmente estão incompletos.

**Alternativas:** Obrigatório pelo menos uma alternativa considerada. Demonstra que houve análise, não apenas escolha aleatória.

---

## Referências

- `Skills/documentar-decisoes/SKILL.md` — skill de documentação de decisões arquiteturais da Junto
