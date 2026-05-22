# CLAUDE.md — IomobAgents

Sistema de agentes de IA especializados para desenvolvimento de software. Este repositório contém as definições de agentes, skills e guardrails — não é um projeto de aplicação.

## Estado atual

- **11 agentes**: orquestrador, arquiteto, tech-lead, dev-backend, dev-bff, dev-frontend, dev-mensageria, dev-qa, dev-ui-ux, dev-security, dev-devops
- **58 skills** em `skills/`
- **13 guardrails** em `Guardrails/`
- **5 checklists** em `References/`

---

## O que é o quê

| Pasta | Conteúdo | Carregado como |
|---|---|---|
| `agents/` | `AGENT.md` por agente: escopo, guardrails, skills, outputs esperados | `@agents/<nome>/AGENT.md` nos commands |
| `skills/` | `SKILL.md` por skill: processo passo a passo, anti-padrões, checklist | `@skills/<nome>/SKILL.md` nos commands |
| `Guardrails/` | Regras idempotentes com seções numeradas para citação (`backend.md §2`) | `@Guardrails/<nome>.md` nos commands |
| `References/` | Checklists leves para consulta rápida durante execução | `**Referências rápidas:**` no cabeçalho da skill |
| `Guidelines/` | Guias de referência detalhados — **não** carregados automaticamente em contexto | Leitura manual ou via skill |
| `commands/` | Slash commands Claude Code — um por agente | `/IomobAgents:<nome>` no Claude Code |

---

## Adicionar uma nova skill

1. Criar `skills/<nome-da-skill>/SKILL.md` seguindo a estrutura padrão (ver abaixo)
2. Adicionar à tabela do `agents/<agente>/AGENT.md` correspondente
3. Adicionar `@skills/<nome>/SKILL.md` no `commands/<agente>.md`
4. Adicionar linha na categoria correta em `skills/README.md`
5. Atualizar a linha do agente em `## Resumo por agente` em `skills/README.md`
6. Atualizar contagem de skills na tabela `## Agentes disponíveis` do `README.md` raiz e em `## Estado atual` deste arquivo

## Adicionar um novo guardrail

1. Criar `Guardrails/<nome>.md` com seções numeradas (`## §1 — Título`)
2. Atualizar a matriz em `Guardrails/README.md §3`
3. Adicionar ao `agents/<agente>/AGENT.md` dos agentes afetados
4. Adicionar `@Guardrails/<nome>.md` nos `commands/` correspondentes
5. Atualizar contagem de guardrails em `## Estado atual` deste arquivo e árvore `## Estrutura do repositório` do `README.md` raiz

## Adicionar um novo agente

1. Criar `agents/<nome>/AGENT.md`
2. Criar `commands/<nome>.md` com estrutura padrão (ver abaixo)
3. Adicionar linha em `## Agentes disponíveis` no `README.md` raiz
4. Adicionar linha em `## Resumo por agente` em `skills/README.md`
5. Atualizar tabela de roteamento no `agents/orquestrador/AGENT.md` e `commands/orquestrador.md`
6. Atualizar contagem de agentes e tabela de comandos em `## Estado atual` deste arquivo e no `README.md` raiz

## Adicionar uma nova Reference

1. Criar `References/<nome>.md` — checklist acionável durante execução de skill
2. Adicionar `**Referências rápidas:** \`References/<nome>.md\`` no cabeçalho das skills que devem usá-la
3. Adicionar entrada na árvore de diretórios do `README.md` raiz
4. Atualizar contagem de checklists em `## Estado atual` deste arquivo

---

## Estrutura padrão de SKILL.md

```markdown
# Skill: <nome>

<descrição em uma linha>

**Agente:** <nome>
**Guardrails aplicáveis:** `<guardrail>.md §N`, ...
**Referências rápidas:** `References/<nome>.md`   ← omitir se não houver

---

## Quando usar
## Processo de execução
### Passo 1 — ...

## Racionalizações bloqueadas

| Racionalização | Rebate |
|---|---|
| "..." | "..." |

## Anti-padrões bloqueados   ← quando relevante

## Checklist de conclusão

- [ ] ...
```

**Seções obrigatórias em toda skill:** Quando usar · Processo · Racionalizações bloqueadas · Checklist de conclusão.

---

## Estrutura padrão de commands/<agente>.md

> O índice completo de skills disponíveis por agente está em `skills/README.md`.

```markdown
Você é o agente <nome> definido abaixo. Leia e siga exatamente o comportamento descrito.

@agents/<nome>/AGENT.md

Guardrails que você deve seguir nesta sessão:

@Guardrails/00-core.md
@Guardrails/<guardrail>.md

---

Skills disponíveis para esta sessão (use conforme necessário):

@skills/<skill>/SKILL.md

---

Demanda do usuário: $ARGUMENTS
```

---

## Invariantes do sistema

- **Skills são protocolos, não código**: `SKILL.md` é lido pelo agente como instrução de comportamento
- **Guardrails são idempotentes**: cada regra tem seção numerada para citação exata em bloqueios (`backend.md §2`)
- **References são consultadas, não carregadas**: o agente busca o arquivo quando precisa, não carrega no contexto principal
- **`dev-mensageria` não tem skills próprias** — usa skills de `arquiteto` e `dev-backend`
- **`dev-devops` fica fora do fluxo do orquestrador** — é acionado diretamente pelo usuário para pipelines e infraestrutura
- **Nunca deletar ADRs** — se uma decisão foi supersedida, criar novo ADR e atualizar o status do anterior
- **Racionalizações bloqueadas** são a principal defesa contra agentes que pulam etapas — toda skill que tem processo crítico deve ter essa seção
- **Comandos são namespaceados**: após instalação via plugin, os comandos ficam disponíveis como `/IomobAgents:<agente>`
