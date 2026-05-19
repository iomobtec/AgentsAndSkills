# Skill: revisar-pr

Conduz a **revisão técnica de um Pull Request**: verifica conformidade com guardrails, qualidade do código, cobertura de testes, segurança, impacto em outros serviços e se o DoD foi satisfeito. Produz parecer com aprovação, ressalvas ou bloqueio.

**Agente:** tech-lead  
**Guardrails aplicáveis:** `00-core.md`, `backend.md`, `frontend.md`, `dados.md`, `testes.md`, `seguranca.md`, `operacional.md`, `processo.md`, `ia-agentes.md`

---

## Quando usar

- Ao revisar PR de qualquer camada (backend, BFF, frontend, mensageria)
- Antes de aprovar merge em `main` ou branch de release
- Para segundo parecer em PR de alto impacto (mudança de contrato, migration, novo serviço)

---

## Processo de execução

### Passo 1 — Entender o contexto antes de ler o código

```
Perguntas antes de abrir o diff:
1. O que este PR entrega? (título + descrição)
2. Qual história ou ticket originou?
3. Qual camada é afetada? (backend / BFF / frontend / mensageria)
4. Há mudança de contrato de API ou schema de evento?
5. Há migration de banco de dados?
6. O PR tem descrição preenchida? (processo.md §3)
```

Se o PR não tem descrição, devolver antes de revisar:

```
⚠️ PR sem descrição — não é possível revisar com segurança.

  Conforme processo.md §3, todo PR precisa de:
  - O que muda
  - Por que muda
  - Como testar

  Preencha a descrição e solicite revisão novamente.
```

### Passo 2 — Verificar DoD

```markdown
## Checklist DoD (processo.md §6)

- [ ] Critérios de aceite da história implementados
- [ ] Testes unitários passando nos módulos alterados
- [ ] Branch atualizada com main
- [ ] Sem secret ou dado pessoal exposto no diff
- [ ] Sem console.log de debug
- [ ] Sem código comentado sem justificativa
- [ ] PR tem descrição preenchida

## Checklist Docker (operacional.md §4) — para PRs de serviço

- [ ] `Dockerfile` presente com build multi-stage, imagem base versionada, `USER node`
- [ ] `.dockerignore` presente e exclui `node_modules`, `.env*`, `dist`, `.git`
- [ ] `docker-compose.yml` cobre serviço + dependências com `healthcheck` e `depends_on: condition: service_healthy`
- [ ] `.env.example` atualizado com todas as variáveis do serviço
- [ ] `docker compose up --build` executável sem etapas manuais
```

Qualquer item marcado como falso é **bloqueador** antes de revisar o código. O checklist Docker aplica-se a PRs de serviços (backend, BFF, mensageria, frontend) — não a PRs de biblioteca, migration isolada ou apenas testes.

### Passo 3 — Revisar por camada

#### Backend / BFF (backend.md)

```typescript
// ⛔ floating promise — backend.md §2
someService.sendEmail(user.email); // sem await e sem .catch()

// ⛔ sem validação na entrada da API — backend.md §3
@Post()
async create(@Body() body: any) { ... }

// ⛔ console.log em código de produção — backend.md §5
console.log('user data:', user);

// ⛔ variável de ambiente acessada sem validação — backend.md §6
const secret = process.env.JWT_SECRET; // pode ser undefined em produção
```

Checklist backend:
- [ ] Sem `any` em DTOs ou tipos de retorno
- [ ] Todas as Promises aguardadas ou com `.catch()` explícito
- [ ] Validação de entrada com class-validator ou zod na fronteira da API
- [ ] Erros padronizados em RFC 7807 (padronizar-erros)
- [ ] Sem `console.log` — usar logger estruturado (`backend.md §5`)
- [ ] Paginação em endpoints que retornam listas (`dados.md §3`)
- [ ] Transactions para escritas em múltiplas tabelas (`dados.md §4`)

#### Banco de dados / Migrations (dados.md)

```typescript
// ⛔ SQL concatenado — dados.md §1
const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ⛔ migration destrutiva sem período de coexistência — dados.md §2
// Renomear coluna diretamente quebra código em produção enquanto deploy acontece
ALTER TABLE orders RENAME COLUMN status TO order_status;
```

Checklist dados:
- [ ] Sem concatenação de SQL — parametrizar todas as queries
- [ ] Migrations apenas aditivas ou com estratégia expand-contract documentada
- [ ] Índices definidos para colunas de FK e predicados de busca frequente (`dados.md §5`)
- [ ] Soft delete para registros de negócio (`dados.md §6`)
- [ ] Sem `SELECT *` — campos explícitos (`dados.md §7`)

#### Frontend (frontend.md)

Checklist frontend:
- [ ] Componentes funcionais — sem class component (`frontend.md §1`)
- [ ] Sem `any` em props ou retornos de hook (`frontend.md §4`)
- [ ] Todos os estados assíncronos tratados: loading, erro, vazio, sucesso
- [ ] Elementos interativos são `<button>` ou `<a>` — sem `<div onClick>` (`frontend.md §5`)
- [ ] Sem `style={{ }}` inline para layout/tema (`frontend.md §6`)
- [ ] Chaves estáveis em listas — sem índice como key em lista mutável (`frontend.md §8`)
- [ ] Prop drilling não ultrapassa 2 níveis (`frontend.md §3`)

#### Segurança (seguranca.md)

```typescript
// ⛔ secret no código — seguranca.md §2
const apiKey = 'sk-prod-abc123';

// ⛔ dado pessoal em log — seguranca.md §1
logger.info({ cpf: user.cpf, creditCard: payment.cardNumber });

// ⛔ JWT em localStorage — seguranca.md §2
localStorage.setItem('token', jwtToken);
```

Checklist segurança:
- [ ] Sem secrets hardcoded — apenas referências a variáveis de ambiente
- [ ] Sem CPF, cartão, senha ou token em logs
- [ ] Sem dado pessoal desnecessário em payload de API ou evento
- [ ] Autenticação verificada em endpoints que exigem `@CurrentUser()`

#### Testes (testes.md)

Checklist testes:
- [ ] Nome dos testes segue `should <comportamento> when <condição>` (`testes.md §1`)
- [ ] Mocks apenas nas fronteiras do sistema (`testes.md §2`)
- [ ] Sem dado pessoal real nas fixtures (`testes.md §7`)
- [ ] Testes independentes — sem ordem implícita entre casos

### Passo 4 — Verificar impacto em outros serviços

Para mudanças que afetam contratos:

```markdown
## Impacto em outros serviços

**Mudança de contrato?**
- [ ] Endpoint REST: path, método, campos de request/response alterados?
  → Se sim: verificar `mapear-contrato` — é breaking change?
- [ ] Schema de evento: campos adicionados, removidos ou alterados?
  → Se sim: verificar `definir-evento §6` — nova versão de tópico necessária?
- [ ] Schema de banco: migration executada?
  → Se sim: verificar estratégia expand-contract (`dados.md §2`)
```

### Passo 5 — Emitir parecer

```markdown
## Parecer de revisão — PR #<número>: <título>

**Resultado:** ✅ Aprovado | ⚠️ Aprovado com ressalvas | ⛔ Bloqueado

---

### Itens aprovados
- ✅ <item que está correto>

### Ressalvas (não bloqueiam merge, mas devem ser resolvidas em follow-up)
- ⚠️ <descrição do problema> — sugestão: <o que fazer>
  Referência: <guardrail>.md §<n>

### Bloqueadores (devem ser resolvidos antes do merge)
- ⛔ <descrição da violação>
  Referência: <guardrail>.md §<n>
  Correção necessária: <o que o autor deve fazer>
```

---

## Quando escalar para o arquiteto

O tech-lead escala para o arquiteto quando:
- PR introduz novo serviço ou altera fronteiras de domínio
- Mudança de contrato de API não foi previamente aprovada pelo arquiteto
- Migration destrói ou renomeia coluna sem estratégia expand-contract
- Decisão de design com impacto arquitetural não documentada

---

## Racionalizações bloqueadas

| Racionalização | Rebate |
|---|---|
| "O código parece correto, posso aprovar sem verificar todos os itens" | "Parece correto" não é critério de aprovação. O checklist existe porque segurança e correção não são evidentes sem verificação sistemática. |
| "Esse dev é sênior, posso confiar que o DoD foi seguido" | O DoD é verificado, não presumido. Confiança na senioridade não substitui checklist — seniores também cometem erros e pulam etapas sob pressão. |
| "Vou aprovar com comentários inline e o dev corrige na próxima versão" | Se há bloqueador, o status é Bloqueado, não Aprovado. Aprovação com bloqueador pendente ilude o pipeline e remove a pressão de corrigir. |
| "O PR é urgente, vou revisar só as partes críticas" | PR urgente com revisão parcial tem dois problemas: o bug não visto e a urgência que mascarou o processo. Documente o escopo revisado se for parcial. |
| "Já discutimos este design em reunião, não preciso verificar conformidade com guardrails" | Reunião não é guardrail. O que foi decidido em reunião pode estar implementado incorretamente. Verificação é sobre o código, não sobre a intenção. |

---

## Checklist de conclusão

- [ ] Contexto e descrição do PR lidos antes do código
- [ ] DoD verificado — bloqueadores sinalizados antes de revisar código
- [ ] Todas as camadas afetadas revisadas com checklist próprio
- [ ] Impacto em outros serviços verificado
- [ ] Parecer emitido com resultado claro: aprovado / ressalvas / bloqueado
- [ ] Bloqueadores com referência ao guardrail e ação necessária
