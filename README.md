# AgentsAndSkills

Sistema de **agentes de IA especializados** para desenvolvimento de software: cada agente conhece seu domínio, carrega apenas as regras relevantes (guardrails) e executa skills bem definidas. O orquestrador coordena a conversa com o usuário e aciona os agentes na sequência certa, garantindo TDD e conformidade com os padrões de engenharia.

---

## Estrutura do repositório

```
AgentsAndSkills/
├── Agents/                    # Definição de cada agente (AGENT.md)
│   ├── orquestrador/          # Ponto de entrada — coordena todos os outros
│   ├── arquiteto/             # Contratos, APIs, eventos, arquitetura
│   ├── tech-lead/             # DoR, revisão de PR, refinamento
│   ├── dev-backend/           # System API e Process API (NestJS + Prisma)
│   ├── dev-bff/               # BFF — adapter entre frontend e backend
│   ├── dev-frontend/          # React 18+, hooks, estado, testes RTL
│   ├── dev-mensageria/        # Producers, consumers, sagas (NestJS microservices)
│   └── dev-qa/                # Gherkin, E2E com Playwright, regressão
│
├── Skills/                    # 34 skills reutilizáveis entre agentes (SKILL.md)
│   ├── criar-system-api/
│   ├── criar-componente/
│   ├── escrever-gherkin/
│   └── ...
│
├── Guardrails/                # Regras que todo agente deve seguir
│   ├── README.md              # Como aplicar, hierarquia, matriz agente × guardrail
│   ├── 00-core.md             # Universais — carregados por todos
│   ├── backend.md             # Node.js, NestJS, floating promises, env vars
│   ├── frontend.md            # React, TypeScript, acessibilidade, estado
│   ├── dados.md               # Migrations, queries, paginação, transações
│   ├── seguranca.md           # LGPD, secrets, autenticação
│   ├── testes.md              # Nomenclatura, mocks, independência
│   ├── operacional.md         # Logging, CI, branch atualizada
│   ├── processo.md            # Git flow, DoR/DoD, conventional commits
│   └── ia-agentes.md         # Comportamento de agentes em cadeia
│
└── Guidelines/                # Guias de referência de engenharia
    ├── arquitetura/
    ├── backend/
    ├── frontend/
    └── testes/
```

---

## Como funciona

### Agentes

Cada `AGENT.md` define:
- **O que o agente faz** e o que está fora do seu escopo
- **Quais guardrails carrega** — somente os relevantes ao domínio
- **Quais skills usa** — referências a `SKILL.md` específicos
- **Como se comporta** — quando perguntar, quando bloquear, o que entregar

### Skills

Cada `SKILL.md` define um processo reproduzível: quando usar, como executar passo a passo, anti-padrões bloqueados e checklist de conclusão. Skills são **reutilizadas entre agentes** — escritas uma vez, referenciadas por vários.

### Guardrails

Regras idempotentes e auditáveis. Quando um agente bloqueia algo, cita o arquivo e a seção exata (ex: `backend.md §2`). Exceções seguem processo formal documentado em `Guardrails/README.md §6`.

### Fluxo com TDD

```
Usuário → orquestrador (coleta spec, faz perguntas)
    ↓
tech-lead (valida DoR)
    ↓
arquiteto (define contratos, APIs, eventos)
    ↓
dev-qa (escreve Gherkin antes do código)
    ↓
dev-backend / dev-bff / dev-mensageria (testes → implementação)
    ↓
dev-frontend (testes → implementação)
    ↓
dev-qa (E2E)
    ↓
tech-lead (revisão de PR)
```

---

## Instalação no Claude Code

### Opção 1 — Carregar o orquestrador via CLAUDE.md (recomendado)

Crie ou edite o `CLAUDE.md` na raiz do **seu projeto** (não deste repositório) e referencie o orquestrador:

```markdown
# Instruções do agente

@/caminho/para/AgentsAndSkills/Agents/orquestrador/AGENT.md
@/caminho/para/AgentsAndSkills/Guardrails/00-core.md
@/caminho/para/AgentsAndSkills/Guardrails/ia-agentes.md
@/caminho/para/AgentsAndSkills/Guardrails/processo.md
```

Com isso, toda conversa no Claude Code dentro do seu projeto parte do comportamento do orquestrador — ele coletará a especificação e acionará os demais agentes automaticamente.

**Para carregar um agente específico diretamente** (sem o orquestrador), substitua pelo `AGENT.md` desejado:

```markdown
@/caminho/para/AgentsAndSkills/Agents/dev-backend/AGENT.md
@/caminho/para/AgentsAndSkills/Guardrails/00-core.md
@/caminho/para/AgentsAndSkills/Guardrails/backend.md
@/caminho/para/AgentsAndSkills/Guardrails/dados.md
@/caminho/para/AgentsAndSkills/Guardrails/seguranca.md
@/caminho/para/AgentsAndSkills/Guardrails/testes.md
@/caminho/para/AgentsAndSkills/Guardrails/operacional.md
@/caminho/para/AgentsAndSkills/Guardrails/processo.md
@/caminho/para/AgentsAndSkills/Guardrails/ia-agentes.md
```

> **Dica:** referencie apenas os guardrails que o agente declara na sua seção "Guardrails carregados" para não poluir o contexto com regras irrelevantes.

---

### Opção 2 — Comandos personalizados (slash commands)

O Claude Code suporta comandos personalizados via arquivos `.md` na pasta `.claude/commands/` do seu projeto. Cada arquivo vira um `/comando` que pode ser invocado no chat.

**Estrutura:**
```
seu-projeto/
└── .claude/
    └── commands/
        ├── arquitetar.md
        ├── backend.md
        ├── frontend.md
        ├── qa.md
        └── revisar.md
```

**Exemplo — `.claude/commands/arquitetar.md`:**
```markdown
Você é o agente arquiteto definido em:
@/caminho/para/AgentsAndSkills/Agents/arquiteto/AGENT.md

Guardrails aplicáveis:
@/caminho/para/AgentsAndSkills/Guardrails/00-core.md
@/caminho/para/AgentsAndSkills/Guardrails/backend.md
@/caminho/para/AgentsAndSkills/Guardrails/frontend.md
@/caminho/para/AgentsAndSkills/Guardrails/dados.md
@/caminho/para/AgentsAndSkills/Guardrails/seguranca.md
@/caminho/para/AgentsAndSkills/Guardrails/operacional.md
@/caminho/para/AgentsAndSkills/Guardrails/processo.md
@/caminho/para/AgentsAndSkills/Guardrails/ia-agentes.md

O usuário fornecerá a seguir a demanda de arquitetura. Siga o comportamento
definido no AGENT.md e utilize as skills disponíveis conforme necessário.
```

Uso no Claude Code:
```
/arquitetar preciso definir o contrato do endpoint de cancelamento de pedido
```

**Exemplo — `.claude/commands/revisar.md`:**
```markdown
Você é o agente tech-lead definido em:
@/caminho/para/AgentsAndSkills/Agents/tech-lead/AGENT.md

Guardrails aplicáveis:
@/caminho/para/AgentsAndSkills/Guardrails/00-core.md
@/caminho/para/AgentsAndSkills/Guardrails/backend.md
@/caminho/para/AgentsAndSkills/Guardrails/frontend.md
@/caminho/para/AgentsAndSkills/Guardrails/dados.md
@/caminho/para/AgentsAndSkills/Guardrails/seguranca.md
@/caminho/para/AgentsAndSkills/Guardrails/testes.md
@/caminho/para/AgentsAndSkills/Guardrails/operacional.md
@/caminho/para/AgentsAndSkills/Guardrails/processo.md
@/caminho/para/AgentsAndSkills/Guardrails/ia-agentes.md

Execute a skill `revisar-pr` com o diff ou PR fornecido pelo usuário a seguir.
```

Uso:
```
/revisar <cole o diff aqui ou informe o PR>
```

---

### Opção 3 — Carregar uma skill diretamente

Para executar uma skill pontual sem carregar o agente completo, referencie o `SKILL.md` diretamente no chat:

```
Leia e siga as instruções de @/caminho/para/AgentsAndSkills/Skills/criar-componente/SKILL.md

Preciso criar um componente UserCard que exibe nome, email e foto do usuário.
```

---

## Instalação no GitHub Copilot

O GitHub Copilot carrega instruções do arquivo `.github/copilot-instructions.md` no repositório. Esse arquivo é o equivalente ao `CLAUDE.md` — define o comportamento padrão do Copilot para todo o workspace.

### Configuração

Crie `.github/copilot-instructions.md` no seu projeto:

```markdown
# Instruções para o GitHub Copilot

## Comportamento geral

Siga as regras de engenharia definidas abaixo antes de gerar qualquer código.
Quando um pedido violar uma regra, recuse e cite a regra pelo nome e seção.

---

## Stack técnica

- **Backend:** Node.js 20+, NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend:** React 18+, TypeScript, Jest, React Testing Library
- **Testes:** Jest (unitário/integração), Playwright (E2E)
- **Mensageria:** @nestjs/microservices (Kafka / RabbitMQ / SQS)

---

## Regras obrigatórias — Backend

1. Nunca deixar Promise sem `await` ou `.catch()` (floating promise)
2. Sempre validar entrada na fronteira da API com `class-validator` ou `zod`
3. Erros no formato RFC 7807: `{ type, title, status, detail, instance }`
4. Sem `console.log` — usar `Logger` do NestJS
5. Variáveis de ambiente validadas com `zod` no startup — nunca `process.env.X` direto
6. Nunca bloquear o event loop com operações síncronas em handlers
7. Paginação obrigatória em endpoints que retornam listas

---

## Regras obrigatórias — Banco de dados

1. Nunca concatenar SQL — usar ORM (Prisma) ou queries parametrizadas
2. Migrations sempre aditivas — nunca `DROP`, `TRUNCATE` sem estratégia expand-contract
3. Transações para escritas em múltiplas tabelas
4. Soft delete com `deletedAt` para registros de negócio

---

## Regras obrigatórias — Frontend

1. Sempre componentes funcionais — nunca class components
2. Sem manipulação direta de DOM (`document.getElementById`, `classList`)
3. Estado o mais local possível — não usar global para dado que poderia ser local
4. Sem `any` em TypeScript — tipos explícitos derivados do contrato do BFF
5. Elementos interativos sempre `<button>` ou `<a>` — nunca `<div onClick>`
6. Sem `style={{ }}` inline para layout, espaçamento ou cor estática
7. Chaves estáveis em listas — nunca índice como `key` em lista mutável

---

## Regras obrigatórias — Segurança

1. Nunca logar CPF, cartão, senha, token ou dado pessoal em claro
2. Secrets nunca no código — apenas variáveis de ambiente
3. JWT nunca em `localStorage` — usar `httpOnly cookie`

---

## Regras obrigatórias — Testes

1. Nomear testes como: `should <comportamento> when <condição>`
2. Mocks apenas nas fronteiras externas (HTTP, banco, fila) — nunca de módulos internos
3. Cada teste independente — sem estado compartilhado entre casos
4. Sem dados pessoais reais em fixtures — usar dados sintéticos
5. Sem `if (process.env.NODE_ENV === 'test')` no código de produção

---

## Processo

1. Branch: `<tipo>/<ticket>-<descrição>` (feat/, fix/, chore/, refactor/, test/)
2. Commits: Conventional Commits — `feat(escopo): descrição`
3. Sem commit direto em `main` — sempre via PR
4. PR com descrição: o que muda e por que muda

---

## TDD — ordem obrigatória

Ao implementar qualquer funcionalidade:
1. Definir tipos derivados do contrato
2. Escrever testes que falham (red)
3. Implementar para fazer os testes passarem (green)
4. Refatorar sem quebrar os testes
```

> **Limitação:** O Copilot não executa uma sequência de agentes como o orquestrador faz no Claude Code. As instruções acima definem o comportamento padrão de geração de código, mas o fluxo de coordenação entre agentes deve ser feito manualmente.

### Ativar instruções por workspace no VS Code

1. Abra as configurações (`Ctrl+Shift+P` → `Open User Settings (JSON)`)
2. Adicione:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": ".github/copilot-instructions.md"
    }
  ]
}
```

### Usar agentes específicos no Copilot Chat

Para invocar o comportamento de um agente específico no Copilot Chat, use o conteúdo do `AGENT.md` como contexto do chat. Cole o arquivo no início da conversa ou referencie com `#file`:

```
#file:AgentsAndSkills/Agents/arquiteto/AGENT.md

Preciso definir o contrato do endpoint de criação de pedido.
```

---

## Instalação no Cursor

O Cursor suporta regras via `.cursor/rules/` (arquivos `.mdc`) ou o arquivo legado `.cursorrules`.

### Opção 1 — Cursor Rules (recomendado, Cursor 0.43+)

Crie arquivos na pasta `.cursor/rules/` do seu projeto:

```
seu-projeto/
└── .cursor/
    └── rules/
        ├── 00-always.mdc          # Guardrails universais — sempre ativos
        ├── backend.mdc            # Ativo em arquivos *.service.ts, *.controller.ts
        ├── frontend.mdc           # Ativo em arquivos *.tsx, *.jsx
        └── testes.mdc             # Ativo em arquivos *.spec.ts, *.test.ts
```

**`.cursor/rules/00-always.mdc`:**
```
---
description: Regras universais de engenharia
alwaysApply: true
---

[cole o conteúdo de Guardrails/00-core.md]
[cole o conteúdo de Guardrails/processo.md]
[cole o conteúdo de Guardrails/seguranca.md]
```

**`.cursor/rules/backend.mdc`:**
```
---
description: Regras de backend Node.js/NestJS
globs: ["**/*.service.ts", "**/*.controller.ts", "**/*.module.ts", "**/*.repository.ts"]
---

[cole o conteúdo de Guardrails/backend.md]
[cole o conteúdo de Guardrails/dados.md]
```

**`.cursor/rules/frontend.mdc`:**
```
---
description: Regras de frontend React/TypeScript
globs: ["**/*.tsx", "**/*.jsx", "**/hooks/*.ts"]
---

[cole o conteúdo de Guardrails/frontend.md]
```

### Opção 2 — `.cursorrules` (legado)

Crie `.cursorrules` na raiz do projeto com o conteúdo dos guardrails mais relevantes concatenados.

---

## Customização

### Adicionar um novo guardrail

1. Crie `Guardrails/<nome>.md` seguindo as convenções (`Guardrails/README.md §8`)
2. Atualize a matriz em `Guardrails/README.md §3` com os agentes que devem carregar a nova regra
3. Atualize os `AGENT.md` afetados para incluir o novo guardrail na seção "Guardrails carregados"
4. Abra PR com aprovação do arquiteto (`Guardrails/README.md §7`)

### Adicionar uma nova skill

1. Crie a pasta `Skills/<nome-da-skill>/`
2. Crie `SKILL.md` seguindo a estrutura: quando usar → processo passo a passo → anti-padrões → checklist
3. Referencie os guardrails aplicáveis por seção (ex: `backend.md §2`) — não repita o conteúdo
4. Adicione a skill na tabela do `AGENT.md` do agente responsável

### Adaptar para outra stack

Os guardrails e agentes foram escritos para **Node.js + React**. Para adaptar:

1. Atualize `Guardrails/backend.md` com as convenções da nova stack
2. Atualize os `SKILL.md` de criação de serviço (`criar-system-api`, `criar-bff`, etc.)
3. Mantenha os guardrails de processo, segurança e testes — são agnósticos de linguagem

---

## Agentes disponíveis

| Agente | Responsabilidade principal | Skills exclusivas |
|---|---|---|
| `orquestrador` | Ponto de contato com o usuário, coordena os demais | — |
| `arquiteto` | Contratos de API, eventos, arquitetura de serviços | revisar-arquitetura, definir-microservico, planejar-api, definir-evento, implementar-saga |
| `tech-lead` | Valida DoR, revisa PR, facilita refinamento | validar-dor, refinar-historia, revisar-pr |
| `dev-backend` | System API e Process API (NestJS + Prisma) | criar-system-api, criar-process-api, configurar-prisma, configurar-auth |
| `dev-bff` | BFF — adapter entre frontend e serviços | criar-bff, revisar-bff, otimizar-performance |
| `dev-frontend` | React, hooks, estado, testes RTL | criar-componente, criar-hook, organizar-estado, revisar-frontend |
| `dev-mensageria` | Producers, consumers, sagas, idempotência | — (usa skills de arquiteto e dev-backend) |
| `dev-qa` | Gherkin, E2E Playwright, regressão | criar-teste-e2e, escrever-gherkin, planejar-regressao |

## Skills disponíveis (34)

| Categoria | Skills |
|---|---|
| Arquitetura | `revisar-arquitetura` `definir-microservico` `planejar-api` `mapear-contrato` `definir-evento` `avaliar-impacto` `avaliar-dependencias` `gerar-diagrama` `implementar-saga` `validar-idempotencia` `padronizar-erros` |
| Backend | `criar-system-api` `criar-process-api` `implementar-endpoint` `configurar-prisma` `configurar-auth` `revisar-backend` |
| BFF | `criar-bff` `revisar-bff` `otimizar-performance` |
| Frontend | `criar-componente` `criar-hook` `organizar-estado` `revisar-frontend` |
| Testes | `criar-teste-unitario` `criar-teste-integracao` `gerar-teste-componente` `criar-teste-e2e` `auditar-cobertura` |
| QA / Processo | `escrever-gherkin` `planejar-regressao` `validar-dor` `refinar-historia` `revisar-pr` |
