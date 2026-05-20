# plans/.handoff/

Diretório do sistema de handoff entre agentes.

---

## Como funciona

1. Ao concluir, cada agente escreve `current.md` com contexto para o próximo
2. O hook `UserPromptSubmit` injeta `current.md` automaticamente na nova sessão
3. Após a injeção, o arquivo é arquivado em `archive/` com timestamp
4. O próximo agente já começa contextualizado sem ação manual do usuário

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| `current.md` | Handoff ativo — lido e arquivado pelo hook na próxima sessão |
| `sequence.md` | Sequência completa da tarefa — gerado pelo orquestrador na Fase 2 |
| `archive/` | Histórico de handoffs anteriores — nunca deletar |

---

## Formato de current.md

```markdown
## Handoff — <NomeDoAgente>

**Agente:** <nome do agente que concluiu>
**Ticket:** <id do ticket, ex: US-001>
**Status:** concluído | bloqueado
**Data:** <YYYY-MM-DD>

**Artefatos produzidos:**
- `<caminho/arquivo>` — <descrição curta do que contém>

**Resumo para o próximo agente:**
<2-4 frases: o que foi feito, decisões tomadas, o que o próximo agente precisa saber>

**Arquivos que você deve ler:**
- `plans/.handoff/sequence.md` — sequência completa da tarefa
- `<plano-gerado>` — <por quê é relevante>

**Bloqueios ou pendências:**
- nenhum | <descrição detalhada do bloqueio se houver>
```

---

## Formato de sequence.md

Gerado pelo orquestrador na Fase 2 com a sequência planejada:

```markdown
## Sequência de execução — <Ticket>

**Tarefa:** <descrição>
**Data do planejamento:** <YYYY-MM-DD>

| Etapa | Agente | Skill principal | Depende de |
|---|---|---|---|
| 1 | tech-lead | validar-dor, gerar-plano-tarefa | — |
| 2 | arquiteto | planejar-api, definir-evento | etapa 1 |
| 3 | dev-security | modelar-ameacas | etapa 2 |
| ... | ... | ... | ... |

**Etapa atual:** <número>
**Próxima etapa:** <número> → /IomobAgents:<agente>
```
