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
│   ├── dev-qa/                # Gherkin, E2E com Playwright, regressão
│   ├── dev-ui-ux/             # Design system, especificação de componentes, auditoria de interface
│   ├── dev-security/          # Modelagem de ameaças, auditoria OWASP Top 10, revisão de dependências CVE
│   └── dev-devops/            # Pipelines CI/CD GitHub Actions *(fora do fluxo do orquestrador)*
│
├── Skills/                    # 47 skills reutilizáveis entre agentes (SKILL.md)
│   ├── criar-system-api/
│   ├── criar-design-system/
│   ├── especificar-componente/
│   ├── revisar-interface/
│   └── ...
│
├── Guardrails/                # Regras que todo agente deve seguir
│   ├── README.md              # Como aplicar, hierarquia, matriz agente × guardrail
│   ├── 00-core.md             # Universais — carregados por todos
│   ├── backend.md             # Node.js, NestJS, floating promises, env vars
│   ├── frontend.md            # React, TypeScript, estado (padrões de código)
│   ├── ux.md                  # Acessibilidade WCAG AA, animação, touch, tipografia, formulários
│   ├── dados.md               # Migrations, queries, paginação, transações
│   ├── appsec.md              # OWASP Top 10, injeção, auth, controle de acesso, XSS, SSRF, CVEs
│   ├── seguranca.md           # LGPD, secrets, migrations, boas práticas mínimas de codificação segura
│   ├── testes.md              # Nomenclatura, mocks, independência
│   ├── operacional.md         # PR quality, testes antes do PR, Docker obrigatório
│   ├── processo.md            # Git flow, DoR/DoD, conventional commits
│   ├── ia-agentes.md          # Comportamento de agentes em cadeia
│   └── devops.md              # Secrets em CI, rastreabilidade de imagens, gate de produção
│
└── Guidelines/                # Guias de referência de engenharia
    ├── arquitetura/
    ├── backend/
    ├── frontend/
    ├── ux/                    # Design system, tokens, acessibilidade, especificação de componentes
    ├── testes/
    ├── security/              # OWASP Top 10, STRIDE, autenticação, headers, CVEs, checklist por camada
    ├── infraestrutura/        # Docker: Dockerfile, docker-compose, templates por tipo de serviço
    └── devops/                # GitHub Actions: CI/CD, environments, secrets, estratégia de deploy
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
arquiteto — Fase 0 (define ambiente: broker, cloud, banco, orquestração, org GitHub)
    ↓
arquiteto (define microserviços → emite tabela de repositórios a criar
         → gerar-plano-tarefa: plans/arquitetura/<ticket>.md por serviço)
    ↓
orquestrador — Fase 2.5 (aguarda usuário criar repos no GitHub, clonar e confirmar caminhos locais)
    ↓
tech-lead (valida DoR → gerar-plano-tarefa: plans/<agente>/<ticket>.md por agente de dev,
          incluindo plans/dev-ui-ux/ quando há telas novas)
    ↓
orquestrador — Fase 2.6 (confirma que arquivos de plano estão gerados e revisados)
    ↓
arquiteto (define contratos, APIs, eventos, BFF, templates Docker)
    ↓
dev-security (modelar-ameacas: STRIDE por componente → plans/dev-security/<ticket>-threat-model.md
             → controles obrigatórios incorporados nos planos dos dev agents)
    ↓
dev-ui-ux (lê plans/dev-ui-ux/<ticket>.md → criar-design-system → especificar-componente
          → gera plans/dev-frontend/<ticket>-<componente>-spec.md)
    ↓  [em paralelo com dev-backend]
dev-backend / dev-bff / dev-mensageria (lê plans/<agente>/<ticket>.md → testes → implementação
                                       + revisar-seguranca-backend (DoD)
                                       + Dockerfile + docker-compose + ci-cd-staging.yml + ci-cd-production.yml)
    ↓
dev-qa (lê plans/dev-qa/<ticket>.md → Gherkin incluindo estados visuais)
    ↓
dev-frontend (lê plans/dev-frontend/<ticket>-<componente>-spec.md → testes → implementação
             + revisar-seguranca-frontend (DoD)
             + Dockerfile multi-stage + docker-compose + ci-cd-staging.yml + ci-cd-production.yml)
    ↓
dev-ui-ux (revisar-interface: auditoria de acessibilidade e qualidade visual no PR)
    ↓
dev-qa (E2E com Playwright)
    ↓
dev-security (auditar-seguranca + revisar-dependencias-cve: auditoria OWASP pré-merge
             → CRITICAL/HIGH: tech-lead aciona dev para correção → re-auditoria)
    ↓
tech-lead (revisão de PR — inclui checklist Docker, pipeline, revisão de interface e confirmação de segurança)
```

> Cada serviço vive em seu **próprio repositório** no GitHub. O orquestrador não libera os agentes de desenvolvimento enquanto os repos não forem clonados, os caminhos locais confirmados e os arquivos de plano gerados pelo tech-lead.

---

## Instalação no Claude Code

O Claude Code suporta **comandos personalizados** via arquivos `.md` na pasta `.claude/commands/` do repositório. Este projeto já inclui um comando por agente — basta copiar a pasta `.claude/` para o seu projeto e ajustar os caminhos.

### 1. Copiar os comandos

```bash
# Na raiz do seu projeto
cp -r /caminho/para/AgentsAndSkills/.claude ./
```

Abra cada arquivo em `.claude/commands/` e substitua os caminhos relativos pelos caminhos absolutos corretos no seu ambiente. Os arquivos usam referências como:

```
@Agents/orquestrador/AGENT.md
@Guardrails/00-core.md
```

Que devem apontar para o repositório `AgentsAndSkills` no seu disco.

### 2. Comandos disponíveis

| Comando | Quando usar |
|---|---|
| `/orquestrador` | **Ponto de entrada.** Coleta a especificação, faz perguntas, coordena os demais agentes na sequência correta com TDD |
| `/arquiteto` | Definir contratos de API, eventos, schemas e arquitetura de serviços |
| `/tech-lead` | Validar DoR antes de iniciar desenvolvimento; revisar PRs; refinar histórias |
| `/dev-backend` | Implementar lógica de domínio, endpoints, persistência (NestJS + Prisma) |
| `/dev-bff` | Implementar camada BFF — agregar e adaptar dados do backend para o frontend |
| `/dev-frontend` | Implementar componentes React, hooks, estado e testes RTL |
| `/dev-mensageria` | Implementar producers, consumers e sagas (@nestjs/microservices) |
| `/dev-ui-ux` | Criar design system, especificar componentes antes da implementação, auditar qualidade de interface |
| `/dev-security` | Modelar ameaças (STRIDE), auditar segurança OWASP pré-merge, revisar dependências CVE |
| `/dev-qa` | Escrever Gherkin, testes E2E com Playwright e planejar regressão |
| `/dev-devops` | Criar pipelines CI/CD GitHub Actions, configurar environments e auditar workflows |

### 3. Usar os comandos

```
# Iniciar pelo orquestrador — ele coordena tudo
/orquestrador quero criar um endpoint de cancelamento de pedido

# Ou acionar um agente diretamente
/arquiteto preciso definir o contrato do endpoint POST /orders
/dev-backend implementar o serviço OrderService com validação de estoque
/dev-qa escrever cenários Gherkin para o fluxo de cancelamento
/tech-lead revisar o PR #42 — mudança no serviço de pagamento
```

Cada comando carrega **somente os guardrails do seu agente** — o contexto da janela não é poluído com regras irrelevantes para aquele domínio.

### 4. Carregar uma skill diretamente (opcional)

Para executar uma skill pontual sem carregar o agente completo, referencie o `SKILL.md` diretamente no chat:

```
Leia e siga as instruções de @/caminho/para/AgentsAndSkills/Skills/criar-componente/SKILL.md

Preciso criar um componente UserCard que exibe nome, email e foto do usuário.
```

### Nota — CLAUDE.md

Se preferir que o orquestrador seja o comportamento padrão de **toda** conversa no projeto (sem precisar digitar o comando), crie ou edite `CLAUDE.md` na raiz do seu projeto:

```markdown
@/caminho/para/AgentsAndSkills/.claude/commands/orquestrador.md
```

Com isso, cada nova conversa no Claude Code já parte do comportamento do orquestrador automaticamente.

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

## Regras obrigatórias — Docker (operacional.md §4)

1. Todo serviço entrega `Dockerfile` com multi-stage build (builder + runner)
2. Imagem base com versão fixa — nunca `:latest`
3. Container não roda como root — `USER node` antes do `CMD`
4. `.dockerignore` obrigatório — exclui `node_modules`, `.env*`, `dist`, `.git`
5. `docker-compose.yml` sobe o serviço + todas as dependências (banco, broker)
6. `healthcheck` em todas as dependências; `depends_on: condition: service_healthy`
7. `.env.example` documenta todas as variáveis sem valores reais
8. `docker compose up --build` deve funcionar sem etapas manuais

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

**`.cursor/rules/infra.mdc`:**
```
---
description: Regras de containers Docker
globs: ["**/Dockerfile", "**/docker-compose*.yml", "**/.dockerignore"]
---

[cole o conteúdo de Guardrails/operacional.md §4]
[cole os templates de Guidelines/infraestrutura/README.md]
```

**`.cursor/rules/devops.mdc`:**
```
---
description: Regras de CI/CD e pipelines
globs: ["**/.github/workflows/*.yml", "**/.github/workflows/*.yaml"]
---

[cole o conteúdo de Guardrails/devops.md]
[cole os templates de Guidelines/devops/README.md]
```

### Opção 2 — `.cursorrules` (legado)

Crie `.cursorrules` na raiz do projeto com o conteúdo dos guardrails mais relevantes concatenados.

---

## Ferramentas externas (sem instalação obrigatória)

As skills deste sistema que dependem de diretrizes externas as buscam automaticamente via `WebFetch` no momento do uso — sempre na versão mais recente, sem nenhuma instalação manual.

### `ui-ux-pro-max` — CLI de design system

Banco de dados com 67 estilos visuais, 161 paletas, 57 pares tipográficos e 99 guidelines UX. Usado pela skill `criar-design-system` para consultar combinações por tipo de produto e stack.

**Pré-requisito:** Python 3.x — verificar com `python3 --version` (Linux/macOS) ou `python --version` (Windows).

#### Opção 1 — via npm (recomendado)

```bash
# Linux / macOS
npm install -g uipro-cli

# Windows (PowerShell)
npm install -g uipro-cli
```

#### Opção 2 — instalação manual

**Linux / macOS:**
```bash
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ~/ui-ux-pro-max
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill "$HOME\ui-ux-pro-max"
```

#### Verificar instalação

**Linux / macOS:**
```bash
python3 ~/ui-ux-pro-max/skills/ui-ux-pro-max/scripts/search.py --help
```

**Windows (PowerShell):**
```powershell
python "$HOME\ui-ux-pro-max\skills\ui-ux-pro-max\scripts\search.py" --help
```

**Sem instalação:** a skill `criar-design-system` executa o processo manual guiado por perguntas, gerando o `design-system/MASTER.md` sem consultar o banco de dados externo.

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
3. Atualize os templates Docker em `Guidelines/infraestrutura/README.md` para a nova imagem base
4. Mantenha os guardrails de processo, segurança e testes — são agnósticos de linguagem

### Adicionar suporte a novo broker de mensageria

1. Adicione o template de `docker-compose.yml` com o novo broker em `Guidelines/infraestrutura/README.md`
2. Atualize a Fase 0 do arquiteto (`Agents/arquiteto/AGENT.md`) para listar o novo broker nas opções
3. Atualize `Skills/definir-evento/SKILL.md` com as configurações específicas do broker

---

## Agentes disponíveis

| Agente | Responsabilidade principal | Skills exclusivas |
|---|---|---|
| `orquestrador` | Ponto de contato com o usuário, coordena os demais | — |
| `arquiteto` | Contratos de API, eventos, arquitetura de serviços | revisar-arquitetura, definir-microservico, planejar-api, definir-evento, implementar-saga, gerar-plano-tarefa |
| `tech-lead` | Valida DoR, revisa PR, facilita refinamento | validar-dor, refinar-historia, revisar-pr, gerar-plano-tarefa |
| `dev-backend` | System API e Process API (NestJS + Prisma) | criar-system-api, criar-process-api, configurar-prisma, configurar-auth |
| `dev-bff` | BFF — adapter entre frontend e serviços | criar-bff, revisar-bff, otimizar-performance |
| `dev-ui-ux` | Design system, especificação de componentes, auditoria de interface | criar-design-system, especificar-componente, revisar-interface |
| `dev-frontend` | React, hooks, estado, testes RTL | criar-componente, criar-hook, organizar-estado, revisar-frontend |
| `dev-mensageria` | Producers, consumers, sagas, idempotência | — (usa skills de arquiteto e dev-backend) |
| `dev-qa` | Gherkin, E2E Playwright, regressão | criar-teste-e2e, escrever-gherkin, planejar-regressao |
| `dev-devops` | Pipelines CI/CD GitHub Actions, environments, secrets *(fora do fluxo do orquestrador)* | criar-pipeline-servico, criar-pipeline-frontend, configurar-environments-github, auditar-pipeline |

## Skills disponíveis (42)

| Categoria | Skills |
|---|---|
| Arquitetura | `revisar-arquitetura` `definir-microservico` `planejar-api` `mapear-contrato` `definir-evento` `avaliar-impacto` `avaliar-dependencias` `gerar-diagrama` `implementar-saga` `validar-idempotencia` `padronizar-erros` |
| Planejamento | `gerar-plano-tarefa` |
| UI/UX | `criar-design-system` `especificar-componente` `revisar-interface` |
| Backend | `criar-system-api` `criar-process-api` `implementar-endpoint` `configurar-prisma` `configurar-auth` `revisar-backend` |
| BFF | `criar-bff` `revisar-bff` `otimizar-performance` |
| Frontend | `criar-componente` `criar-hook` `organizar-estado` `revisar-frontend` |
| Testes | `criar-teste-unitario` `criar-teste-integracao` `gerar-teste-componente` `criar-teste-e2e` `auditar-cobertura` |
| QA / Processo | `escrever-gherkin` `planejar-regressao` `validar-dor` `refinar-historia` `revisar-pr` |
| DevOps | `criar-pipeline-servico` `criar-pipeline-frontend` `configurar-environments-github` `auditar-pipeline` |
