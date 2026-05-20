# Skill: handoff

Protocolo de conclusão de sessão: escreve o arquivo de handoff para o próximo agente e exibe ao usuário o comando exato a executar.

**Agente:** todos
**Guardrails aplicáveis:** `ia-agentes.md §1`, `ia-agentes.md §4`

---

## Quando usar

Ao final de cada sessão, quando todas as entregas foram concluídas **ou** quando um bloqueio impede a continuação. Nunca encerrar uma sessão sem executar este protocolo.

---

## Processo de execução

### Passo 1 — Verificar conclusão antes de prosseguir

Confirme que o checklist de conclusão do seu agente foi satisfeito:

- Todos os artefatos esperados foram criados?
- Os testes da camada passam?
- O PR está aberto (se aplicável)?

Se algum item falhar, **não execute o handoff** — resolva o bloqueio primeiro ou declare-o explicitamente no handoff (status: bloqueado).

### Passo 2 — Determinar o próximo agente

Leia `plans/.handoff/sequence.md` e localize a linha correspondente ao seu agente. O campo "Próxima etapa" indica qual agente deve ser acionado a seguir.

Se `sequence.md` não existir, use a sequência padrão do orquestrador:

```
tech-lead → arquiteto → dev-security → dev-ui-ux → dev-qa
→ dev-backend → dev-bff → dev-mensageria → dev-frontend
→ dev-ui-ux (revisão) → dev-qa (E2E) → dev-security (auditoria)
→ tech-lead (revisar-pr) → dev-qa (regressão)
```

Etapas condicionais (BFF, mensageria, UI) só ocorrem se a tarefa as exigir.

### Passo 3 — Escrever plans/.handoff/current.md

Crie ou sobrescreva o arquivo com o seguinte formato:

```markdown
## Handoff — <NomeDoAgente>

**Agente:** <nome>
**Ticket:** <id do ticket, ex: US-001>
**Status:** concluído | bloqueado
**Data:** <YYYY-MM-DD>

**Artefatos produzidos:**
- `<caminho/arquivo>` — <descrição do que contém>

**Resumo para o próximo agente:**
<2-4 frases: o que foi feito, decisões tomadas, o que o próximo agente precisa saber para começar>

**Arquivos que você deve ler:**
- `plans/.handoff/sequence.md` — etapa atual e próxima
- `<arquivo de plano mais relevante>` — <por quê é necessário>

**Bloqueios ou pendências:**
- nenhum | <descrição detalhada — o que falta, quem precisa resolver, impacto>
```

### Passo 4 — Imprimir o bloco de próximo passo

Exiba **obrigatoriamente** ao final da resposta, com o bloco correto para o status:

**Se status = concluído:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  <NomeDoAgente> — concluído

📋  PRÓXIMO PASSO — execute em uma NOVA conversa:

    /IomobAgents:<próximo-agente>

    O contexto desta sessão será injetado automaticamente
    pelo hook ao abrir a nova conversa.

    Se o hook não estiver ativo: cole o conteúdo de
    plans/.handoff/current.md no início da nova conversa.

📁  Artefatos gerados:
    - <lista com caminho completo de cada artefato>

⚠️  Confirme em plans/.handoff/sequence.md se o próximo
    agente indicado acima está correto para esta tarefa.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Se status = bloqueado:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔  <NomeDoAgente> — BLOQUEADO

    Motivo: <descrição clara do bloqueio>

📋  AÇÃO NECESSÁRIA antes de avançar:
    <o que o usuário ou outro agente precisa fazer>

    Após resolver o bloqueio, retorne a esta sessão
    ou execute novamente: /IomobAgents:<este-agente>

📁  Artefatos gerados até o bloqueio:
    - <lista, se houver>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Racionalizações bloqueadas

| Racionalização | Rebate |
|---|---|
| "O usuário vai saber o que fazer a seguir" | Não vai — o bloco de próximo passo é a única garantia de continuidade |
| "O handoff é opcional se a sessão foi simples" | Não é — toda sessão gera um handoff, independente do tamanho |
| "Posso pular o sequence.md se já sei o próximo" | Não — o orquestrador pode ter adaptado a sequência para esta tarefa |
| "O status é concluído mesmo com testes falhando" | Não — testes falhando = status bloqueado, sempre |

---

## Checklist de conclusão

- [ ] `plans/.handoff/sequence.md` foi lido para confirmar o próximo agente
- [ ] `plans/.handoff/current.md` foi escrito com todos os campos preenchidos
- [ ] Status reflete a realidade: concluído só se testes passam e artefatos existem
- [ ] Bloco de próximo passo foi exibido na resposta com o comando exato
- [ ] Artefatos listados no handoff realmente existem no disco
