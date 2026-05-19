# Template: Padrão de Escrita para Histórias de Usuário

Este template define a estrutura obrigatória para documentação de histórias de usuário.

---

## Estrutura Completa do Documento

```markdown
# História de Usuário: [Nome da Funcionalidade]

---

## 1. Estrutura Clássica

**Como** [tipo de usuário],
**Quero** [ação ou funcionalidade],
**Para que** [benefício ou valor].

---

## 2. Regras de Negócio

As regras de negócio definem o comportamento esperado do sistema com base nas necessidades
e restrições do negócio. Servem como critérios que guiam o desenvolvimento e garantem que
a funcionalidade entregue esteja alinhada com os objetivos da empresa.

| # | Regra | Descrição |
|---|-------|-----------|
| RN01 | [Nome da Regra] | [Descrição clara e objetiva usando linguagem do negócio] |
| RN02 | [Nome da Regra] | [Descrição clara e objetiva usando linguagem do negócio] |
| RN03 | [Nome da Regra] | [Descrição clara e objetiva usando linguagem do negócio] |

### Dicas para Boas Regras de Negócio
- **Seja claro e objetivo:** Evite ambiguidade
- **Use linguagem do negócio:** Evite termos técnicos demais
- **Separe regras de interface:** Não misture com implementação
- **Valide com stakeholders:** Confirme que reflete a necessidade real

---

## 3. Critérios de Aceitação (DoR - Definition of Ready)

Para esta história ser considerada pronta para desenvolvimento:

- [ ] [Critério 1 - específico e mensurável]
- [ ] [Critério 2 - específico e mensurável]
- [ ] [Critério 3 - específico e mensurável]
- [ ] Regras de negócio documentadas e validadas
- [ ] Tech Review realizado
- [ ] Cenários de teste definidos

---

## 4. Tech Review

A Tech Review é uma análise técnica para avaliar qualidade, arquitetura, performance,
segurança, escalabilidade e aderência a boas práticas de desenvolvimento.

### 4.1 Resumo Executivo
- **Objetivo da revisão:** [Breve descrição do objetivo]
- **Decisões principais:** [Resumo das decisões tomadas]
- **Stakeholders:** [Nomes dos envolvidos na decisão]

### 4.2 Contexto
- **Problema/Necessidade:** [O que motivou esta funcionalidade]
- **Cenário atual:** [Como funciona hoje - infraestrutura, arquitetura, processos]

### 4.3 Análise Técnica

#### Alternativas Consideradas

| Alternativa | Prós | Contras |
|-------------|------|---------|
| [Opção A] | [benefícios] | [desvantagens] |
| [Opção B] | [benefícios] | [desvantagens] |

#### Benchmarks/Dados
- [Dados ou testes que embasam a decisão]

### 4.4 Decisão Tomada
- **Solução escolhida:** [Qual alternativa foi selecionada]
- **Justificativa:** [Por que esta foi a melhor opção]
- **Impactos esperados:**
  - Performance: [impacto esperado]
  - Segurança: [impacto esperado]
  - Custo: [impacto esperado]
  - Escalabilidade: [impacto esperado]

### 4.5 Arquitetura Definida

#### Estrutura de Dados

**Tabelas NOVAS:**
| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| [nome] | [desc]    | [campos]          |

**Tabelas EXISTENTES a utilizar:**
| Tabela | Motivo |
|--------|--------|
| [nome] | [motivo] |

**Relacionamentos:**
- [Tabela A] 1:N [Tabela B]
- [Tabela B] N:1 [Tabela C]

#### Endpoints/Rotas Necessárias

| Método | Rota | Descrição | Request | Response |
|--------|------|-----------|---------|----------|
| POST   | /api/v1/[recurso] | Criar | {campos} | {id, ...} |
| GET    | /api/v1/[recurso] | Listar | ?filtros | [{...}] |
| GET    | /api/v1/[recurso]/:id | Buscar | - | {...} |
| PUT    | /api/v1/[recurso]/:id | Atualizar | {campos} | {...} |
| DELETE | /api/v1/[recurso]/:id | Excluir | - | 204 |

#### Integrações
| Sistema | Tipo | Descrição |
|---------|------|-----------|
| [nome]  | Consumir/Expor | [desc] |

#### Requisitos de Infraestrutura
- [ ] Banco de dados: [novo/existente]
- [ ] Cache: [sim/não]
- [ ] Jobs background: [sim/não]
- [ ] Autenticação: [Keycloak/API Key]

### 4.6 Plano de Ação (para o PM)

| # | Ação | Responsável | Projeto |
|---|------|-------------|---------|
| 1 | [ação específica] | PM | [ms-xxx-system/process/bff] |
| 2 | [ação específica] | PM | [ms-xxx-system/process/bff] |

### 4.7 Referências
- [Links para documentos, diagramas, tickets, PRs, RFCs]

---

## 5. Cenários de Testes

Os cenários de testes descrevem situações específicas que devem ser simuladas para verificar
se o sistema se comporta conforme esperado. Garantem cobertura completa, comunicação clara
entre QA/Dev/Negócio e identificação de falhas em fluxos reais.

### Cenário 1: [Nome do Cenário - Fluxo Principal/Happy Path]

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | [O que está sendo validado] |
| **Pré-condições** | [Estado do sistema antes do teste] |
| **Passos** | 1. [Ação 1]<br>2. [Ação 2]<br>3. [Ação 3] |
| **Resultado Esperado** | [O que deve acontecer se tudo estiver correto] |
| **Dados de Teste** | [Dados necessários para executar] |

### Cenário 2: [Nome do Cenário - Fluxo Alternativo]

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | [O que está sendo validado] |
| **Pré-condições** | [Estado do sistema antes do teste] |
| **Passos** | 1. [Ação 1]<br>2. [Ação 2]<br>3. [Ação 3] |
| **Resultado Esperado** | [O que deve acontecer se tudo estiver correto] |
| **Dados de Teste** | [Dados necessários para executar] |

### Cenário 3: [Nome do Cenário - Fluxo de Exceção/Erro]

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | [Validar tratamento de erro/exceção] |
| **Pré-condições** | [Estado do sistema antes do teste] |
| **Passos** | 1. [Ação que causa erro]<br>2. [Verificação] |
| **Resultado Esperado** | [Mensagem de erro esperada ou comportamento] |
| **Dados de Teste** | [Dados que causam a exceção] |

### Cenário 4: [Nome do Cenário - Validação de Regra de Negócio]

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | [Validar regra RN0X] |
| **Pré-condições** | [Estado do sistema antes do teste] |
| **Passos** | 1. [Ação 1]<br>2. [Ação 2] |
| **Resultado Esperado** | [Comportamento conforme regra de negócio] |
| **Dados de Teste** | [Dados específicos para validar a regra] |

---

## 6. Decisão de Arquitetura (para o PM)

Com base nos requisitos:
- [ ] Precisa de SYSTEM API (banco de dados próprio)
- [ ] Precisa de PROCESS API (orquestração)
- [ ] Precisa de BFF (interface usuário)

### Projetos a Criar/Alterar
| Projeto | Tipo | Ação | Motivo |
|---------|------|------|--------|
| ms-[nome]-system | System | Criar/Alterar | [motivo] |
| ms-[nome]-process | Process | Criar/Alterar | [motivo] |
| ms-[nome]-bff | BFF | Criar/Alterar | [motivo] |
```

---

## Exemplo Completo: Cancelamento de Pedido

```markdown
# História de Usuário: Cancelamento de Pedido

---

## 1. Estrutura Clássica

**Como** cliente,
**Quero** poder cancelar um pedido até 2 horas após a compra,
**Para que** eu possa evitar cobranças indevidas caso mude de ideia.

---

## 2. Regras de Negócio

| # | Regra | Descrição |
|---|-------|-----------|
| RN01 | Status permitido | O cancelamento só é permitido se o pedido estiver com status "Em processamento" |
| RN02 | Prazo máximo | O prazo máximo para cancelamento é de 2 horas após a confirmação do pedido |
| RN03 | Produtos personalizados | Pedidos com produtos personalizados não podem ser cancelados |
| RN04 | Confirmação | O cliente deve receber uma confirmação por e-mail após o cancelamento |
| RN05 | Estorno | O valor pago deve ser estornado em até 5 dias úteis |

---

## 3. Critérios de Aceitação (DoR)

- [ ] Cliente consegue visualizar botão de cancelamento quando dentro do prazo
- [ ] Sistema valida prazo de 2 horas antes de permitir cancelamento
- [ ] Sistema valida se pedido não possui produtos personalizados
- [ ] E-mail de confirmação é enviado ao cliente
- [ ] Estorno é processado automaticamente
- [ ] Regras de negócio documentadas e validadas
- [ ] Tech Review realizado
- [ ] Cenários de teste definidos

---

## 4. Tech Review

### 4.1 Resumo Executivo
- **Objetivo:** Implementar funcionalidade de cancelamento self-service
- **Decisões principais:** Usar job assíncrono para estorno, validação no BFF
- **Stakeholders:** João (PO), Maria (Tech Lead), Carlos (Financeiro)

### 4.2 Contexto
- **Problema:** Clientes ligam para SAC para cancelar pedidos, gerando custo operacional
- **Cenário atual:** Cancelamento manual via SAC, média de 50 ligações/dia

### 4.3 Análise Técnica

| Alternativa | Prós | Contras |
|-------------|------|---------|
| Cancelamento síncrono | Feedback imediato | Pode causar timeout em estornos |
| Cancelamento assíncrono | Mais resiliente | Cliente precisa aguardar confirmação |

### 4.4 Decisão Tomada
- **Solução:** Cancelamento com estorno assíncrono via job
- **Justificativa:** Estornos podem demorar, melhor não bloquear UI
- **Impactos:** Performance (melhora), Custo (reduz SAC em 30%)

### 4.5 Arquitetura Definida

**Tabelas EXISTENTES:**
| Tabela | Motivo |
|--------|--------|
| orders | Atualizar status para "Cancelado" |
| payments | Registrar estorno |

**Endpoints:**
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/v1/orders/:id/cancel | Cancelar pedido |
| GET | /api/v1/orders/:id/cancellation-status | Verificar status do cancelamento |

### 4.6 Plano de Ação
| # | Ação | Projeto |
|---|------|---------|
| 1 | Criar endpoint de cancelamento | ms-orders-system |
| 2 | Criar job de estorno | ms-orders-system |
| 3 | Expor endpoint no BFF | ms-orders-bff |

---

## 5. Cenários de Testes

### Cenário 1: Cancelamento com sucesso (Happy Path)

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Validar cancelamento dentro do prazo permitido |
| **Pré-condições** | Pedido com status "Em processamento", criado há menos de 2 horas |
| **Passos** | 1. Acessar pedido<br>2. Clicar em "Cancelar"<br>3. Confirmar cancelamento |
| **Resultado Esperado** | Pedido cancelado, e-mail enviado, estorno iniciado |
| **Dados de Teste** | Pedido #12345, cliente@email.com |

### Cenário 2: Cancelamento fora do prazo (Exceção)

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Validar bloqueio após 2 horas |
| **Pré-condições** | Pedido criado há mais de 2 horas |
| **Passos** | 1. Tentar acessar cancelamento |
| **Resultado Esperado** | Mensagem "Prazo para cancelamento expirado" |
| **Dados de Teste** | Pedido criado há 3 horas |

### Cenário 3: Produto personalizado (Regra RN03)

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Validar bloqueio para produtos personalizados |
| **Pré-condições** | Pedido contém item personalizado |
| **Passos** | 1. Tentar cancelar pedido |
| **Resultado Esperado** | Mensagem "Pedidos com produtos personalizados não podem ser cancelados" |
| **Dados de Teste** | Pedido com camiseta personalizada |

---

## 6. Decisão de Arquitetura

- [x] SYSTEM API - atualizar pedido e processar estorno
- [ ] PROCESS API - não necessário
- [x] BFF - interface para o cliente

| Projeto | Tipo | Ação | Motivo |
|---------|------|------|--------|
| ms-orders-system | System | Alterar | Adicionar endpoint e job de estorno |
| ms-orders-bff | BFF | Alterar | Expor cancelamento para o cliente |
```
