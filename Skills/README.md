# Skills

Biblioteca de skills disponíveis para os agentes. Cada skill é um conjunto de instruções especializadas que o agente carrega sob demanda — não são código executável, são protocolos de comportamento.

> **Convenção:** skills ficam em `Skills/<nome-da-skill>/SKILL.md`. O agente inclui o arquivo via `@Skills/<nome>/SKILL.md` no contexto da sessão.

---

## Categorias

- [Arquitetura](#arquitetura)
- [Backend](#backend)
- [BFF](#bff)
- [Frontend](#frontend)
- [UI/UX](#uiux)
- [QA](#qa)
- [Tech Lead / Processo](#tech-lead--processo)
- [DevOps](#devops)

---

## Arquitetura

| Skill | O que faz | Quem chama |
|---|---|---|
| [`revisar-arquitetura`](revisar-arquitetura/SKILL.md) | Avalia soluções arquiteturais contra princípios e guardrails do projeto | `arquiteto` |
| [`planejar-api`](planejar-api/SKILL.md) | Projeta especificação REST completa: endpoints, schemas e tratamento de erros | `arquiteto` |
| [`mapear-contrato`](mapear-contrato/SKILL.md) | Formaliza contratos de comunicação entre serviços (formatos de request/response) | `arquiteto` |
| [`definir-evento`](definir-evento/SKILL.md) | Define schema de evento, topologia de mensageria e relações produtor-consumidor | `arquiteto` |
| [`avaliar-dependencias`](avaliar-dependencias/SKILL.md) | Analisa viabilidade, risco e licenciamento de dependências externas | `arquiteto` |
| [`gerar-diagrama`](gerar-diagrama/SKILL.md) | Produz diagramas de arquitetura, sequência e fluxo para documentação | `arquiteto` |
| [`implementar-saga`](implementar-saga/SKILL.md) | Projeta orquestração de transações distribuídas e lógica de compensação | `arquiteto` |
| [`validar-idempotencia`](validar-idempotencia/SKILL.md) | Verifica segurança de operações para múltiplas execuções sem corrupção de estado | `arquiteto` |
| [`padronizar-erros`](padronizar-erros/SKILL.md) | Define formato de resposta de erro e padrões de código HTTP | `arquiteto` |
| [`avaliar-impacto`](avaliar-impacto/SKILL.md) | Estima impacto e esforço de mudanças técnicas em sistemas existentes | `arquiteto`, `tech-lead` |
| [`definir-microservico`](definir-microservico/SKILL.md) | Especifica estrutura de novo microsserviço: APIs, eventos e modelo de deploy | `arquiteto` |

---

## Backend

| Skill | O que faz | Quem chama |
|---|---|---|
| [`criar-system-api`](criar-system-api/SKILL.md) | Inicializa System API em NestJS com banco de dados, ORM e endpoints | `dev-backend` |
| [`criar-process-api`](criar-process-api/SKILL.md) | Inicializa Process API em NestJS com orquestração e publicação de eventos | `dev-backend` |
| [`implementar-endpoint`](implementar-endpoint/SKILL.md) | Implementa endpoints REST em NestJS com validação e tratamento de erros | `dev-backend` |
| [`configurar-auth`](configurar-auth/SKILL.md) | Configura autenticação JWT com guards do Passport e validação de token | `dev-backend` |
| [`configurar-prisma`](configurar-prisma/SKILL.md) | Configura Prisma ORM com schema, migrations e geração de client | `dev-backend` |
| [`criar-teste-unitario`](criar-teste-unitario/SKILL.md) | Escreve testes unitários Jest com mocking e testes de componente isolados | `dev-backend` |
| [`criar-teste-integracao`](criar-teste-integracao/SKILL.md) | Escreve testes de integração NestJS com banco de dados e mocking de serviços | `dev-backend` |
| [`auditar-cobertura`](auditar-cobertura/SKILL.md) | Analisa relatórios de cobertura Jest e identifica lacunas na suíte de testes | `dev-backend`, `tech-lead` |
| [`revisar-backend`](revisar-backend/SKILL.md) | Revisa código backend quanto a arquitetura, testes e conformidade de segurança | `dev-backend` |

---

## BFF

| Skill | O que faz | Quem chama |
|---|---|---|
| [`criar-bff`](criar-bff/SKILL.md) | Inicializa BFF em NestJS com clientes HTTP e integração com upstream | `dev-bff` |
| [`otimizar-performance`](otimizar-performance/SKILL.md) | Aplica estratégias de otimização de performance nos tempos de resposta do BFF | `dev-bff` |
| [`revisar-bff`](revisar-bff/SKILL.md) | Revisa código BFF quanto a padrões de integração e tratamento de erros upstream | `dev-bff` |

---

## Frontend

| Skill | O que faz | Quem chama |
|---|---|---|
| [`criar-componente`](criar-componente/SKILL.md) | Cria componentes React reutilizáveis com props, tipagem e stories | `dev-frontend` |
| [`criar-hook`](criar-hook/SKILL.md) | Extrai lógica React em custom hooks para reusabilidade | `dev-frontend` |
| [`organizar-estado`](organizar-estado/SKILL.md) | Define estratégia de gerenciamento de estado React (Context API, Zustand ou Redux) | `dev-frontend` |
| [`gerar-teste-componente`](gerar-teste-componente/SKILL.md) | Escreve testes de componente com React Testing Library | `dev-frontend` |
| [`revisar-frontend`](revisar-frontend/SKILL.md) | Revisa código React/TypeScript quanto a padrões, performance e acessibilidade | `dev-frontend` |

---

## UI/UX

| Skill | O que faz | Quem chama |
|---|---|---|
| [`criar-design-system`](criar-design-system/SKILL.md) | Estabelece fundações do design system: cores, tipografia, espaçamento e animações — gera `design-system/MASTER.md` | `dev-ui-ux` |
| [`especificar-componente`](especificar-componente/SKILL.md) | Produz especificação visual detalhada de componente: estados, acessibilidade, responsividade e tokens — gera `plans/dev-frontend/<ticket>-spec.md` | `dev-ui-ux` |
| [`revisar-interface`](revisar-interface/SKILL.md) | Audita implementação de UI contra guardrails de acessibilidade (WCAG 2.1 AA), tipografia e performance visual — modo `report` ou `fix` | `dev-ui-ux`, `tech-lead` |

---

## QA

| Skill | O que faz | Quem chama |
|---|---|---|
| [`escrever-gherkin`](escrever-gherkin/SKILL.md) | Escreve cenários BDD em sintaxe Gherkin para testes de aceitação | `dev-qa` |
| [`planejar-regressao`](planejar-regressao/SKILL.md) | Define estratégia de testes de regressão e seleção de casos de teste | `dev-qa` |
| [`criar-teste-e2e`](criar-teste-e2e/SKILL.md) | Escreve testes end-to-end com Playwright para fluxos completos do usuário | `dev-qa` |

---

## Tech Lead / Processo

| Skill | O que faz | Quem chama |
|---|---|---|
| [`refinar-historia`](refinar-historia/SKILL.md) | Refina histórias de usuário até o Definition of Ready com critérios de aceite | `tech-lead` |
| [`validar-dor`](validar-dor/SKILL.md) | Valida Definition of Ready contra checklist e guardrails antes do desenvolvimento | `tech-lead` |
| [`revisar-pr`](revisar-pr/SKILL.md) | Conduz revisão técnica de Pull Request com gates de qualidade | `tech-lead` |
| [`gerar-plano-tarefa`](gerar-plano-tarefa/SKILL.md) | Gera arquivos de plano por agente em `plans/<agente>/` com tech review, cenários e critérios de aceite | `arquiteto`, `tech-lead` |

---

## DevOps

| Skill | O que faz | Quem chama |
|---|---|---|
| [`configurar-environments-github`](configurar-environments-github/SKILL.md) | Configura environments do GitHub, secrets e workflows de aprovação | `dev-devops` |
| [`auditar-pipeline`](auditar-pipeline/SKILL.md) | Revisa workflows de CI/CD quanto a corretude e conformidade de segurança | `dev-devops`, `tech-lead` |
| [`criar-pipeline-servico`](criar-pipeline-servico/SKILL.md) | Cria workflows de CI/CD (staging/produção) para serviços Node.js | `dev-devops`, `dev-backend`, `dev-bff`, `dev-mensageria` |
| [`criar-pipeline-frontend`](criar-pipeline-frontend/SKILL.md) | Cria workflows de CI/CD (staging/produção) para frontend React com Vite/CRA | `dev-devops`, `dev-frontend` |

---

## Resumo por agente

| Agente | Skills disponíveis |
|---|---|
| `arquiteto` | revisar-arquitetura, planejar-api, mapear-contrato, definir-evento, avaliar-dependencias, gerar-diagrama, implementar-saga, validar-idempotencia, padronizar-erros, avaliar-impacto, definir-microservico, gerar-plano-tarefa |
| `dev-backend` | criar-system-api, criar-process-api, implementar-endpoint, configurar-auth, configurar-prisma, criar-teste-unitario, criar-teste-integracao, auditar-cobertura, revisar-backend |
| `dev-bff` | criar-bff, otimizar-performance, revisar-bff |
| `dev-frontend` | criar-componente, criar-hook, organizar-estado, gerar-teste-componente, revisar-frontend |
| `dev-ui-ux` | criar-design-system, especificar-componente, revisar-interface |
| `dev-qa` | escrever-gherkin, planejar-regressao, criar-teste-e2e |
| `tech-lead` | refinar-historia, validar-dor, revisar-pr, gerar-plano-tarefa, avaliar-impacto, auditar-cobertura, revisar-interface, auditar-pipeline |
| `dev-devops` | configurar-environments-github, auditar-pipeline, criar-pipeline-servico, criar-pipeline-frontend |
