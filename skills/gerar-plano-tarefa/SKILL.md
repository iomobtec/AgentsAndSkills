# Skill: gerar-plano-tarefa

Gera arquivos de plano de tarefa na pasta `plans/` do repositório do projeto do usuário, seguindo o formato definido em `TEMPLATE.md`. Cada arquivo detalha completamente o que um agente de desenvolvimento deve implementar — sem ambiguidade, sem lacunas.

**Agente:** arquiteto · tech-lead  
**Guardrails aplicáveis:** `processo.md`, `ia-agentes.md`

---

## Quando usar

- **Arquiteto**: após concluir a definição de um microserviço com `definir-microservico`, gerar o plano arquitetural em `plans/arquitetura/`
- **Tech Lead**: após aprovar o DoR de uma história, gerar os planos por agente de desenvolvimento em `plans/<agente>/`
- Sempre que um agente de dev precisar de um arquivo de referência claro para executar sua tarefa

---

## Estrutura de pastas

Os planos são salvos no **repositório do projeto do usuário** (não no repositório IomobAgents):

```
plans/
├── arquitetura/          ← gerado pelo arquiteto
│   └── <ticket>-<descricao>.md
├── dev-backend/          ← gerado pelo tech-lead
│   └── <ticket>-<servico>.md
├── dev-bff/              ← gerado pelo tech-lead
│   └── <ticket>-<servico>.md
├── dev-frontend/         ← gerado pelo tech-lead
│   └── <ticket>-<funcionalidade>.md
├── dev-mensageria/       ← gerado pelo tech-lead
│   └── <ticket>-<evento>.md
└── dev-qa/               ← gerado pelo tech-lead
    └── <ticket>-<funcionalidade>.md
```

**Convenção de nomenclatura:**
- `<ticket>`: identificador do ticket/história (ex: `US-001`, `JIRA-423`, `feat-cancelamento`)
- `<descricao>`: slug em kebab-case do que a tarefa entrega (ex: `endpoint-cancelamento`, `consumer-pedido-criado`)

---

## Seções por agente gerador

### Arquiteto — `plans/arquitetura/<ticket>-<descricao>.md`

O arquiteto preenche as seções de decisão técnica:

| Seção | Responsável | O que preencher |
|-------|-------------|-----------------|
| §4.1 Resumo Executivo | Arquiteto | Objetivo, decisões principais, stakeholders |
| §4.2 Contexto | Arquiteto | Problema que motivou a feature, cenário atual |
| §4.3 Análise Técnica | Arquiteto | Alternativas consideradas, benchmarks/dados |
| §4.4 Decisão Tomada | Arquiteto | Solução escolhida, justificativa, impactos |
| §4.5 Arquitetura Definida | Arquiteto | Tabelas, endpoints, integrações, infraestrutura |
| §4.6 Plano de Ação | Arquiteto | Lista de tarefas por agente dev (para o tech-lead usar) |
| §6 Decisão de Arquitetura | Arquiteto | Quais camadas precisam de implementação |

As seções §1, §2, §3 e §5 ficam **em branco ou como rascunho** — o tech-lead as preenche.

---

### Tech Lead — `plans/<agente>/<ticket>-<servico>.md`

O tech-lead preenche todas as seções com base na história + plano do arquiteto:

| Seção | O que preencher |
|-------|-----------------|
| §1 Estrutura Clássica | Como/Quero/Para que — perspectiva de quem usa |
| §2 Regras de Negócio | Tabela com RN01, RN02... — regras em linguagem de negócio |
| §3 Critérios de Aceitação | Checklist DoR — específico e mensurável |
| §4 Tech Review | Completo — copiar do plano do arquiteto ou preencher se ausente |
| §5 Cenários de Testes | Tabelas com Objetivo, Pré-condições, Passos, Resultado, Dados |
| §6 Decisão de Arquitetura | Checklist de camadas + projetos a criar/alterar |

Um arquivo por agente dev por serviço — não misturar tarefas de agentes diferentes no mesmo arquivo.

---

## Processo de execução

### Passo 1 — Identificar o escopo do plano

Antes de gerar, confirmar:

```
- Qual é o identificador da história?
- Qual serviço ou funcionalidade este plano cobre?
- O plano do arquiteto já existe em plans/arquitetura/? (para o tech-lead referenciar)
```

### Passo 2 — Criar o arquivo

Usar o template completo de `Skills/gerar-plano-tarefa/TEMPLATE.md`. Nunca deixar seção com `[placeholder]` não preenchido — cada campo deve ter conteúdo real derivado da especificação.

**Para o arquiteto:** preencher §4 e §6 completamente. Colocar `> A ser preenchido pelo tech-lead` nas seções §1, §2, §3 e §5.

**Para o tech-lead:** preencher todas as seções. Se o plano do arquiteto existe, copiar §4.4 e §4.5 de lá e completar as demais seções com contexto de negócio.

### Passo 3 — Estrutura mínima obrigatória por tipo de agente

#### `plans/dev-backend/<ticket>-<servico>.md`

Deve conter, no mínimo:
- §2: Regras de Negócio (pelo menos 3 regras)
- §3: Critérios de Aceitação com itens mensuráveis
- §4.5: Tabelas de novas tabelas OU tabelas existentes + endpoints necessários
- §5: Cenários Happy Path, Fluxo Alternativo e Erro/Exceção
- §6: Projetos a criar/alterar com `ms-<nome>-system` ou `ms-<nome>-process`

#### `plans/dev-bff/<ticket>-<servico>.md`

Deve conter, no mínimo:
- §4.5: Endpoints do BFF (rota, método, request, response)
- §4.5: Integração com System/Process APIs upstream
- §5: Cenários de transformação e erro de upstream

#### `plans/dev-frontend/<ticket>-<funcionalidade>.md`

Deve conter, no mínimo:
- §1: Estrutura Clássica (perspectiva do usuário final da tela)
- §4.5: Endpoint do BFF que a tela consome (rota, response shape)
- §5: Cenários de loading, erro, vazio e sucesso

#### `plans/dev-mensageria/<ticket>-<evento>.md`

Deve conter, no mínimo:
- §4.5: Schema do evento (produtor, consumidor, tópico, payload)
- §4.5: Integrações (qual serviço produz, qual consome)
- §5: Cenários de mensagem válida, duplicada (idempotência) e falha (DLQ)

#### `plans/dev-qa/<ticket>-<funcionalidade>.md`

Deve conter, no mínimo:
- §2: Regras de Negócio (para saber o que validar)
- §3: Critérios de Aceitação (base para os cenários Gherkin)
- §5: Cenários completos que se tornarão cenários Gherkin e testes E2E

---

## Exemplo de arquivo gerado

```markdown
# História de Usuário: Cancelamento de Pedido — Backend

---

## 1. Estrutura Clássica

**Como** cliente,
**Quero** poder cancelar um pedido até 2 horas após a compra,
**Para que** eu possa evitar cobranças indevidas caso mude de ideia.

---

## 2. Regras de Negócio

| # | Regra | Descrição |
|---|-------|-----------|
| RN01 | Status permitido | Cancelamento só é permitido se o pedido estiver com status "Em processamento" |
| RN02 | Prazo máximo | Prazo máximo de 2 horas após confirmação do pedido |
| RN03 | Produtos personalizados | Pedidos com produtos personalizados não podem ser cancelados |

---

## 3. Critérios de Aceitação (DoR)

- [ ] Endpoint POST /orders/:id/cancel retorna 200 para pedido elegível
- [ ] Endpoint retorna 422 com mensagem específica para pedido fora do prazo
- [ ] Endpoint retorna 422 com mensagem específica para produto personalizado
- [ ] Status do pedido atualizado para "Cancelado" no banco
- [ ] Regras de negócio documentadas e validadas
- [ ] Tech Review realizado
- [ ] Cenários de teste definidos

---

## 4. Tech Review

### 4.1 Resumo Executivo
- **Objetivo:** Endpoint de cancelamento self-service no ms-orders-system
- **Decisões principais:** Validação síncrona, estorno via evento assíncrono
- **Stakeholders:** João (PO), Maria (Tech Lead)

### 4.2 Contexto
- **Problema:** Cancelamentos manuais via SAC, 50 ligações/dia de custo operacional
- **Cenário atual:** Não há endpoint; operação feita via painel interno

### 4.3 Análise Técnica

| Alternativa | Prós | Contras |
|-------------|------|---------|
| Cancelamento síncrono | Resposta imediata ao cliente | Timeout se estorno demorar |
| Cancelamento assíncrono via evento | Resiliente | Cliente aguarda confirmação por e-mail |

### 4.4 Decisão Tomada
- **Solução:** Cancelamento síncrono para validação + evento `OrderCancelled` para estorno
- **Justificativa:** Validação imediata melhora UX; estorno eventual evita timeout
- **Impactos:**
  - Performance: sem impacto — validação é local
  - Segurança: validar ownership do pedido antes de cancelar
  - Custo: redução de 30% nas ligações de SAC

### 4.5 Arquitetura Definida

**Tabelas EXISTENTES a utilizar:**
| Tabela | Motivo |
|--------|--------|
| orders | Atualizar status para "Cancelado" e registrar timestamp |

**Endpoints Necessários:**
| Método | Rota | Descrição | Request | Response |
|--------|------|-----------|---------|----------|
| POST | /api/v1/orders/:id/cancel | Cancelar pedido | - | `{ orderId, status, cancelledAt }` |

**Integrações:**
| Sistema | Tipo | Descrição |
|---------|------|-----------|
| ms-payments-system | Evento | Publicar `OrderCancelled` para iniciar estorno |

**Requisitos de Infraestrutura:**
- [x] Banco de dados: existente (orders)
- [ ] Cache: não
- [x] Jobs background: não (estorno via evento)
- [x] Autenticação: Keycloak (validar ownership)

### 4.6 Plano de Ação

| # | Ação | Responsável | Projeto |
|---|------|-------------|---------|
| 1 | Implementar endpoint POST /orders/:id/cancel | dev-backend | ms-orders-system |
| 2 | Publicar evento OrderCancelled | dev-mensageria | ms-orders-system |
| 3 | Expor endpoint no BFF | dev-bff | ms-orders-bff |

---

## 5. Cenários de Testes

### Cenário 1: Cancelamento com sucesso (Happy Path)

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Validar cancelamento de pedido elegível |
| **Pré-condições** | Pedido com status "Em processamento", criado há menos de 2 horas, sem produto personalizado |
| **Passos** | 1. POST /api/v1/orders/12345/cancel com token válido do cliente dono do pedido |
| **Resultado Esperado** | 200 com `{ orderId: "12345", status: "Cancelado", cancelledAt: "<timestamp>" }` |
| **Dados de Teste** | orderId: 12345, userId: 99, createdAt: agora - 30min |

### Cenário 2: Pedido fora do prazo (Exceção)

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Validar bloqueio de cancelamento após 2 horas |
| **Pré-condições** | Pedido criado há mais de 2 horas |
| **Passos** | 1. POST /api/v1/orders/12346/cancel |
| **Resultado Esperado** | 422 com `{ error: "CANCELLATION_DEADLINE_EXCEEDED", message: "Prazo para cancelamento expirado" }` |
| **Dados de Teste** | orderId: 12346, createdAt: agora - 3h |

### Cenário 3: Produto personalizado (Regra RN03)

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Validar bloqueio para pedido com produto personalizado |
| **Pré-condições** | Pedido contém item com flag `isCustomized: true` |
| **Passos** | 1. POST /api/v1/orders/12347/cancel |
| **Resultado Esperado** | 422 com `{ error: "CUSTOMIZED_ORDER_CANNOT_BE_CANCELLED", message: "Pedidos com produtos personalizados não podem ser cancelados" }` |
| **Dados de Teste** | orderId: 12347, items: [{ productId: 1, isCustomized: true }] |

---

## 6. Decisão de Arquitetura

- [x] Precisa de SYSTEM API (banco de dados próprio) — atualizar status do pedido
- [ ] Precisa de PROCESS API (orquestração) — não necessário para este endpoint
- [ ] Precisa de BFF (interface usuário) — coberto em plano separado do dev-bff

| Projeto | Tipo | Ação | Motivo |
|---------|------|------|--------|
| ms-orders-system | System | Alterar | Adicionar endpoint de cancelamento e publicar evento |
```

---

## Checklist de conclusão

- [ ] Arquivo criado em `plans/<agente>/<ticket>-<descricao>.md`
- [ ] Nenhuma seção contém `[placeholder]` não preenchido
- [ ] §2 tem pelo menos 3 regras de negócio em linguagem de negócio (sem termos de implementação)
- [ ] §3 tem critérios mensuráveis (verificáveis por teste ou inspeção)
- [ ] §4.5 tem tabelas de endpoints/schemas preenchidas com campos reais
- [ ] §5 tem pelo menos 3 cenários (happy path, alternativo, exceção)
- [ ] §6 identifica claramente quais projetos criar ou alterar
- [ ] Tech-lead revisou o arquivo antes de passar ao orquestrador
