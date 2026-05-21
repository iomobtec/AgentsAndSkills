# IomobAgents

Sistema de **agentes de IA especializados** para desenvolvimento de software: cada agente conhece seu domínio, carrega apenas as regras relevantes (guardrails) e executa skills bem definidas. O orquestrador coordena a conversa com o usuário e aciona os agentes na sequência certa, garantindo TDD e conformidade com os padrões de engenharia.

---

## Estrutura do repositório

```
IomobAgents/
├── agents/                    # Definição de cada agente (AGENT.md)
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
├── skills/                    # 56 skills reutilizáveis entre agentes (SKILL.md)
│   ├── handoff/               # Protocolo de conclusão de sessão e passagem de contexto entre agentes
│   ├── criar-system-api/
│   ├── criar-design-system/
│   ├── especificar-componente/
│   ├── revisar-interface/
│   └── ...
│
├── commands/                  # Slash commands Claude Code — um por agente
│   ├── orquestrador.md
│   ├── arquiteto.md
│   └── ...
│
├── plans/                     # Artefatos gerados pelos agentes durante execução
│   └── .handoff/              # Handoff entre sessões: current.md, sequence.md e archive/
│
├── scripts/                   # Scripts auxiliares invocados pelos hooks
│   └── inject-handoff.js      # Lido pelo hook UserPromptSubmit — injeta contexto do agente anterior
│
├── .claude/                   # Configuração local do Claude Code
│   └── settings.json          # Permissões e hook UserPromptSubmit para injeção de handoff
│
├── .claude-plugin/            # Metadados do plugin Claude Code
│   ├── plugin.json            # Manifesto do plugin
│   └── marketplace.json       # Configuração de marketplace
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
├── References/                # Checklists leves para consulta rápida durante execução de skills
│   ├── accessibility-checklist.md  # WCAG 2.1 AA por componente
│   ├── security-checklist.md       # OWASP Top 10 2025 por camada
│   ├── performance-checklist.md    # Core Web Vitals + anti-padrões por camada
│   ├── testing-patterns.md         # Pirâmide, DAMP vs DRY, mock hierarchy, Beyonce Rule
│   └── adr-template.md             # Template pronto para Architecture Decision Records
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
    ↓
dev-qa (lê plans/dev-qa/<ticket>.md → Gherkin incluindo estados visuais
       → critérios de aceite formalizados antes de qualquer implementação)
    ↓  [em paralelo]
dev-backend / dev-bff / dev-mensageria
    (plans/<agente>/<ticket>.md + Gherkin → testes → implementação
     + revisar-seguranca-backend (DoD) + Dockerfile + docker-compose + pipelines CI/CD)
dev-frontend
    (plans/dev-frontend/<ticket>-<componente>-spec.md + Gherkin → testes → implementação
     + revisar-seguranca-frontend (DoD) + Dockerfile multi-stage + pipelines CI/CD)
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

Este projeto é distribuído como um **plugin Claude Code**. A instalação é feita em dois comandos — sem clonar o repositório manualmente.

### 1. Adicionar o marketplace

Dentro do Claude Code, execute:

```
/plugin marketplace add iomobtec/IomobAgents
```

### 2. Instalar o plugin

```
/plugin install IomobAgents
```

### 3. Usar os agentes

Após a instalação, todos os agentes ficam disponíveis como comandos namespaceados:

| Comando | Quando usar |
|---|---|
| `/IomobAgents:orquestrador` | **Ponto de entrada.** Coleta a especificação, faz perguntas, coordena os demais agentes na sequência correta com TDD |
| `/IomobAgents:arquiteto` | Definir contratos de API, eventos, schemas e arquitetura de serviços |
| `/IomobAgents:tech-lead` | Validar DoR antes de iniciar desenvolvimento; revisar PRs; refinar histórias |
| `/IomobAgents:dev-backend` | Implementar lógica de domínio, endpoints, persistência (NestJS + Prisma) |
| `/IomobAgents:dev-bff` | Implementar camada BFF — agregar e adaptar dados do backend para o frontend |
| `/IomobAgents:dev-frontend` | Implementar componentes React, hooks, estado e testes RTL |
| `/IomobAgents:dev-mensageria` | Implementar producers, consumers e sagas (@nestjs/microservices) |
| `/IomobAgents:dev-ui-ux` | Criar design system, especificar componentes antes da implementação, auditar qualidade de interface |
| `/IomobAgents:dev-security` | Modelar ameaças (STRIDE), auditar segurança OWASP pré-merge, revisar dependências CVE |
| `/IomobAgents:dev-qa` | Escrever Gherkin, testes E2E com Playwright e planejar regressão |
| `/IomobAgents:dev-devops` | Criar pipelines CI/CD GitHub Actions, configurar environments e auditar workflows |

```
# Iniciar pelo orquestrador — ele coordena tudo
/IomobAgents:orquestrador quero criar um endpoint de cancelamento de pedido

# Ou acionar um agente diretamente
/IomobAgents:arquiteto preciso definir o contrato do endpoint POST /orders
/IomobAgents:dev-backend implementar o serviço OrderService com validação de estoque
/IomobAgents:tech-lead revisar o PR #42 — mudança no serviço de pagamento
```

Cada comando carrega **somente os guardrails do seu agente** — o contexto da janela não é poluído com regras irrelevantes para aquele domínio.

### 4. Carregar uma skill diretamente (opcional)

Para executar uma skill pontual sem carregar o agente completo, referencie o `SKILL.md` diretamente no chat:

```
Leia e siga as instruções de @/caminho/para/IomobAgents/skills/criar-componente/SKILL.md

Preciso criar um componente UserCard que exibe nome, email e foto do usuário.
```

### Nota — CLAUDE.md

Se preferir que o orquestrador seja o comportamento padrão de **toda** conversa no projeto (sem precisar digitar o comando), crie ou edite `CLAUDE.md` na raiz do seu projeto:

```markdown
@/caminho/para/IomobAgents/commands/orquestrador.md
```

Com isso, cada nova conversa no Claude Code já parte do comportamento do orquestrador automaticamente.

---

## Ferramentas externas (sem instalação obrigatória)

As skills deste sistema que dependem de diretrizes externas as buscam automaticamente via `WebFetch` no momento do uso — sempre na versão mais recente, sem nenhuma instalação manual.

### `ui-ux-pro-max` — plugin de design system

Banco de dados com 67 estilos visuais, 161 paletas, 57 pares tipográficos e 99 guidelines UX. Usado pela skill `criar-design-system` para consultar combinações por tipo de produto e stack.

#### Instalação do plugin Claude Code

```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**Sem instalação:** a skill `criar-design-system` executa o processo manual guiado por perguntas, gerando o `design-system/MASTER.md` sem consultar o banco de dados externo.

---

## Customização

> Para contribuir com novos agentes, skills, guardrails ou references, siga os checklists passo a passo em `CLAUDE.md`.

### Adaptar para outra stack

Os guardrails e agentes foram escritos para **Node.js + React**. Para adaptar:

1. Atualize `Guardrails/backend.md` com as convenções da nova stack
2. Atualize os `SKILL.md` de criação de serviço (`criar-system-api`, `criar-bff`, etc.)
3. Atualize os templates Docker em `Guidelines/infraestrutura/README.md` para a nova imagem base
4. Mantenha os guardrails de processo, segurança e testes — são agnósticos de linguagem

### Adicionar suporte a novo broker de mensageria

1. Adicione o template de `docker-compose.yml` com o novo broker em `Guidelines/infraestrutura/README.md`
2. Atualize a Fase 0 do arquiteto (`agents/arquiteto/AGENT.md`) para listar o novo broker nas opções
3. Atualize `skills/definir-evento/SKILL.md` com as configurações específicas do broker

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
