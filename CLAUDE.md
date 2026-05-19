# CLAUDE.md — AgentsAndSkills

Este repositório define um sistema de **agentes de IA especializados** para desenvolvimento de software. Não é um projeto de aplicação — é o meta-sistema que outros projetos importam via `.claude/commands/`.

---

## Estado atual

- **11 agentes**: orquestrador, arquiteto, tech-lead, dev-backend, dev-bff, dev-frontend, dev-mensageria, dev-qa, dev-ui-ux, dev-security, dev-devops
- **55 skills** em `Skills/`
- **12 guardrails** em `Guardrails/`
- **5 checklists** em `References/`

---

## O que é o quê

| Pasta | Conteúdo | Carregado como |
|---|---|---|
| `Agents/` | `AGENT.md` por agente: escopo, guardrails, skills, outputs esperados | `@Agents/<nome>/AGENT.md` nos commands |
| `Skills/` | `SKILL.md` por skill: processo passo a passo, anti-padrões, checklist | `@Skills/<nome>/SKILL.md` nos commands |
| `Guardrails/` | Regras idempotentes com seções numeradas para citação (`backend.md §2`) | `@Guardrails/<nome>.md` nos commands |
| `References/` | Checklists leves para consulta rápida durante execução | `**Referências rápidas:**` no cabeçalho da skill |
| `Guidelines/` | Guias de referência detalhados — **não** carregados automaticamente em contexto | Leitura manual ou via skill |
| `.claude/commands/` | Slash commands Claude Code — um por agente | `/nome-do-agente` no Claude Code |

---

## Adicionar uma nova skill

1. Criar `Skills/<nome-da-skill>/SKILL.md` seguindo a estrutura padrão (ver abaixo)
2. Adicionar à tabela do `Agents/<agente>/AGENT.md` correspondente
3. Adicionar `@Skills/<nome>/SKILL.md` no `.claude/commands/<agente>.md`
4. Adicionar linha na categoria correta em `Skills/README.md`
5. Atualizar a linha do agente em `## Resumo por agente` em `Skills/README.md`
6. Atualizar contagem de skills e tabela `## Agentes disponíveis` no `README.md` raiz

## Adicionar um novo guardrail

1. Criar `Guardrails/<nome>.md` com seções numeradas (`## §1 — Título`)
2. Atualizar a matriz em `Guardrails/README.md §3`
3. Adicionar ao `Agents/<agente>/AGENT.md` dos agentes afetados
4. Adicionar `@Guardrails/<nome>.md` nos `.claude/commands/` correspondentes

## Adicionar um novo agente

1. Criar `Agents/<nome>/AGENT.md`
2. Criar `.claude/commands/<nome>.md` com estrutura padrão (ver abaixo)
3. Adicionar linha em `## Agentes disponíveis` no `README.md` raiz
4. Adicionar linha em `## Resumo por agente` em `Skills/README.md`
5. Atualizar tabela de roteamento no `Agents/orquestrador/AGENT.md` e `.claude/commands/orquestrador.md`

## Adicionar uma nova Reference

1. Criar `References/<nome>.md` — checklist acionável durante execução de skill
2. Adicionar `**Referências rápidas:** \`References/<nome>.md\`` no cabeçalho das skills que devem usá-la
3. Adicionar entrada na árvore de diretórios do `README.md` raiz

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

## Estrutura padrão de .claude/commands/<agente>.md

```markdown
Você é o agente <nome> definido abaixo. Leia e siga exatamente o comportamento descrito.

@Agents/<nome>/AGENT.md

Guardrails que você deve seguir nesta sessão:

@Guardrails/00-core.md
@Guardrails/<guardrail>.md

---

Skills disponíveis para esta sessão (use conforme necessário):

@Skills/<skill>/SKILL.md

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
