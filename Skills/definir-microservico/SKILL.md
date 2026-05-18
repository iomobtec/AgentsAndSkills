# Skill: definir-microservico

Define a **estrutura, responsabilidade, contratos e dependências** de um novo microserviço antes do desenvolvimento começar. Produz a especificação que o agente `dev-backend` usará para implementar.

**Agente:** arquiteto  
**Guardrails aplicáveis:** `00-core.md`, `backend.md`, `dados.md`, `seguranca.md`

---

## Quando usar

- Quando uma nova funcionalidade requer serviço próprio (não cabe em serviço existente)
- Quando um serviço existente cresceu demais e precisa ser decomposto
- Quando uma integração com sistema externo requer camada de adaptação dedicada
- Antes de qualquer sprint que inclua criação de novo serviço

---

## Entrada esperada

- Necessidade de negócio: o que o serviço resolve para o usuário final
- Contexto sistêmico: quais serviços existentes se relacionam com ele
- Restrições técnicas: volume esperado, SLA, requisitos de isolamento
- Camada proposta: System, Process ou BFF

---

## Processo de execução

### Passo 1 — Classificar a camada correta

| Pergunta | Se sim → camada |
|---|---|
| O serviço é a fonte da verdade de uma entidade de negócio e persiste dados? | System API |
| O serviço orquestra dois ou mais Systems sem persistir dados próprios? | Process API |
| O serviço adapta respostas para um frontend específico? | BFF |

Se a resposta não for clara, o arquiteto pergunta ao solicitante antes de continuar.

### Passo 2 — Definir responsabilidade única

Enunciar em **uma frase** o que o serviço faz. Se não for possível em uma frase, o escopo está grande demais — dividir.

Formato: `"O serviço <nome> é responsável por <verbo de domínio> <entidade>, garantindo <invariante crítica>."`

### Passo 3 — Definir contratos de entrada e saída

Para cada operação exposta:
- Verbo HTTP e path (ou tópico de evento)
- Payload de entrada (campos, tipos, obrigatoriedade)
- Payload de saída (campos, tipos)
- Códigos de resposta e semântica de erro

### Passo 4 — Mapear dependências

| Tipo | O que mapear |
|---|---|
| Upstream (consome) | Quais Systems ou serviços externos este serviço chama |
| Downstream (é consumido por) | Quais Process ou BFFs chamarão este serviço |
| Banco de dados | Modelo inicial de tabelas (se System) |
| Eventos | Publica ou consome quais tópicos |

### Passo 5 — Verificar isolamento

- O serviço tem banco de dados próprio? (obrigatório para System)
- Ele acessa banco de outro serviço diretamente? (proibido — `dados.md §1`)
- Ele tem lógica de outra camada? (violação de `revisar-arquitetura`)

### Passo 6 — Definir stack e estrutura de pastas

```
<nome-do-servico>/
├── src/
│   ├── modules/
│   │   └── <dominio>/
│   │       ├── <dominio>.controller.ts
│   │       ├── <dominio>.service.ts
│   │       ├── <dominio>.module.ts
│   │       ├── dto/
│   │       └── entities/
│   ├── common/
│   │   ├── filters/        # exception filters
│   │   ├── interceptors/
│   │   └── pipes/          # validation pipes
│   └── main.ts
├── test/
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Saída produzida

```markdown
## Especificação do Microserviço: <nome>

**Camada:** System | Process | BFF
**Responsabilidade:** <frase única>

---

### Contratos

#### POST /recurso
Request:
```json
{ "campo": "tipo", ... }
```
Response 201:
```json
{ "id": "uuid", ... }
```
Erros: 400 (validação), 409 (conflito), 422 (regra de negócio)

---

### Dependências

| Direção | Serviço | Operação |
|---|---|---|
| Consome | <serviço> | <endpoint / tópico> |
| Exposto para | <serviço> | <endpoint / tópico> |

---

### Modelo de dados inicial (se System)

| Tabela | Campos principais | Índices |
|---|---|---|
| <tabela> | id, campo1, campo2, created_at, deleted_at | PK(id), IDX(campo1) |

---

### Stack

- Runtime: Node.js 20 + NestJS
- ORM: Prisma
- Banco: PostgreSQL
- Mensageria: <se aplicável>
- Autenticação: <estratégia>

---

### Próximos passos para o dev-backend

1. Inicializar repositório com estrutura padrão
2. Criar migration inicial
3. Implementar endpoints na ordem: <lista priorizanda>
4. Configurar validação com class-validator
5. Cobrir com testes unitários antes do PR
```
