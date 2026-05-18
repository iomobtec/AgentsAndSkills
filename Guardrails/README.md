# GuardRails
Conjunto de regras **idempotentes** que disciplinam todo agente IA e todo desenvolvedor. Toda ação automatizada (geração de código, análise, refatoração, deploy, comunicação entre agents) deve respeitar estas regras antes de ser executada.

> **Idempotente** aqui significa: aplicar a regra duas vezes produz o mesmo resultado da primeira. Não há "regra que vale só essa vez".

---

## 1. Propósito

1. **Padronizar** o comportamento de todos os agents (`dev-backend`, `dev-frontend`, `dev-bff`, `arquiteto`, etc.) sob um conjunto único de princípios.
2. **Bloquear** silenciosamente padrões de risco antes que cheguem em PR/produção.
3. **Tornar auditável** qualquer decisão automatizada — todo bloqueio cita o guardrail violado.
4. **Reduzir o custo cognitivo** do desenvolvedor: ele não precisa decorar regras, o agent recusa o pedido com a regra na mão.

---

## 2. Hierarquia de precedência

Quando houver conflito entre fontes, vale a **mais restritiva**, na ordem:

```
00-core.md                                  (mais restritiva — universal)
   ↓
GuardRails temáticos (backend / frontend / dados / seguranca / testes / operacional / processo / ia-agentes)
   ↓
CLAUDE.md do subprojeto                     (overrides locais documentados)
   ↓
Pedido pontual do desenvolvedor             (menos restritiva — pode ser bloqueado pelas anteriores)
```

**Importante:** um pedido do desenvolvedor **nunca** sobrepõe um guardrail. Se o desenvolvedor precisa contornar uma regra, ele deve abrir uma exceção formal (ver §6) — não apenas insistir com o agent.

---

## 3. Como aplicar (matriz agente × guardrail)

Cada agent carrega apenas os guardrails relevantes ao seu escopo. `00-core.md` e `ia-agentes.md` são **sempre** carregados por todos os agents.

| Agente | core | back | front | dados | seg | test | ops | proc | ia |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `arquiteto`      | X | X | X | X | X |   | X | X | X |
| `dev-backend`    | X | X |   | X | X | X | X | X | X |
| `dev-bff`        | X | X |   |   | X | X | X | X | X |
| `dev-frontend`   | X |   | X |   | X | X | X | X | X |
| `dev-mensageria` | X | X |   |   | X | X | X | X | X |
| `dev-qa`         | X |   |   |   | X | X |   | X | X |
| `tech-lead`      | X | X | X | X | X | X | X | X | X |

**Legenda das colunas:** core = `00-core.md` · back = `backend.md` · front = `frontend.md` · dados = `dados.md` · seg = `seguranca.md` · test = `testes.md` · ops = `operacional.md` · proc = `processo.md` · ia = `ia-agentes.md`

---

## 4. Como o agent deve recusar um pedido

Quando o desenvolvedor solicita algo que viola um guardrail, o agent **não executa** e responde no seguinte formato:

```
⛔ Pedido bloqueado pelo GuardRails/<arquivo>.md §<número> — <título da regra>

Motivo: <explicação curta de qual parte do pedido infringe a regra>

Alternativas que respeitam a regra:
1. <opção A>
2. <opção B>

Se você precisa contornar essa regra de forma legítima, abra uma exceção
seguindo §6 deste README. Não vou prosseguir sem isso.
```

Princípios da recusa:
- **Citar a regra** (arquivo + parágrafo). Sem isso, o desenvolvedor não tem como auditar a decisão.
- **Oferecer caminho alternativo** sempre que existir. Bloqueio sem alternativa é fricção pura.
- **Não negociar** sob pressão. "Mas só dessa vez" não é argumento válido — é o caminho 6.

---

## 5. Como o agent deve questionar pedidos ambíguos

Quando o pedido **possivelmente** viola um guardrail mas a intenção do desenvolvedor não está clara, o agent **pergunta antes de executar**:

```
⚠️ Esse pedido pode infringir GuardRails/<arquivo>.md §<número> — <título>.

Antes de prosseguir preciso confirmar:
- <pergunta objetiva 1>
- <pergunta objetiva 2>

Se a resposta for <X>, o pedido é seguro. Se for <Y>, precisamos da exceção (§6).
```

Isso vale especialmente para tarefas que tocam: dados pessoais, secrets, schema de banco, ambientes produtivos, dependências externas, mudanças de contrato de API.

---

## 6. Processo de exceção

Um guardrail **pode** ser contornado, mas nunca em silêncio. O fluxo é:

1. Desenvolvedor descreve a necessidade no PR/issue.
2. Aprovação explícita do **arquiteto** ou **tech lead** da squad — registrada por escrito.
3. PR cita: `EXCEÇÃO GuardRails/<arquivo>.md §<n>: aprovada por <nome>, motivo <X>, escopo <Y>, validade <prazo>`.
4. Se a exceção é recorrente, vira proposta de **mudança do guardrail** (§7), não de mais exceções.

Exceções não documentadas no PR são tratadas como violação.

---

## 7. Como atualizar um GuardRail

GuardRails são vivos — mas mudam de forma controlada:

1. Abrir PR com a alteração.
2. Justificar **por quê** a regra precisa mudar (incidente, nova prática, contradição com outra regra).
3. Aprovação: **arquiteto** + pelo menos 1 membro da squad afetada.
4. Após merge, todos os agents passam a aplicar a versão nova **automaticamente** na próxima invocação — não há janela de transição.
5. Comunicar a mudança no canal de engenharia.

Não edite o conteúdo "rapidinho" sem PR. A integridade do GuardRails depende de toda mudança ser auditável.

---

## 8. Convenções dos arquivos

- Cada guardrail é um `.md` com seções numeradas (§1, §2…) para permitir citação precisa.
- Toda regra começa com verbo no imperativo ("Não logar…", "Sempre validar…", "Usar…").
- Toda regra tem **motivo** explícito (uma linha) — sem isso o agent não consegue julgar zona cinza.
- Exemplos quando agregam valor; nunca exemplos longos só para encher.
- Sem código de produção — apenas snippets ilustrativos.

---

## 9. Lista de guardrails

| Arquivo | Tema | Aplica-se a |
|---|---|---|
| [`00-core.md`](00-core.md) | Princípios universais | Todos os agents |
| [`backend.md`](backend.md) | Node.js, microservices, libs internas | dev-backend, dev-bff, arquiteto |
| [`frontend.md`](frontend.md) | React, Module Federation, design system | dev-frontend, arquiteto |
| [`dados.md`](dados.md) | Persistência, queries, migrations | dev-backend, arquiteto |
| [`seguranca.md`](seguranca.md) | LGPD, secrets, AuthN/Z | Todos os agents |
| [`testes.md`](testes.md) | Cobertura, padrões, mocks | dev-backend, dev-bff, dev-frontend, dev-qa |
| [`operacional.md`](operacional.md) | Logging, monitoramento, deploy |  dev-backend, dev-bff, dev-frontend, arquiteto |
| [`processo.md`](processo.md) | Git Flow, DoR/DoD, code review | Todos os agents |
| [`ia-agentes.md`](ia-agentes.md) | Comportamento dos agents | Todos os agents |