# GuardRails — Testes

Regras de **qualidade e disciplina de testes** para código Node.js e React. Complementa `00-core.md` — não substitui. Regras de **bloqueio de PR** e **tratamento de testes pré-existentes** vivem em `operacional.md §2` e `operacional.md §3` — não são repetidas aqui. Carregado por: `dev-system`, `dev-process`, `dev-bff`, `dev-e2e`, `qualidade`, `revisor`.

---

## §1 — Nomenclatura padronizada de testes

**Regra:** Todo teste (unit, integration, e2e) usa o padrão `should <comportamento esperado> when <condição>` no nome do caso de teste. O `describe` agrupa por unidade sob teste (função, componente, endpoint, fluxo).

**Motivo:** Nome descritivo é o primeiro diagnóstico quando o teste falha em CI — "FAIL: should return 401 when token is expired" é acionável imediatamente; "FAIL: test 3" não é.

### §1.1 — Exemplos

```typescript
// ✅ unitário
describe('UserService.create', () => {
  it('should throw ConflictError when email already exists', async () => { ... });
  it('should return created user when data is valid', async () => { ... });
});

// ✅ componente React
describe('LoginForm', () => {
  it('should disable submit button when form is invalid', () => { ... });
  it('should call onSubmit with credentials when form is submitted', () => { ... });
});

// ✅ e2e
describe('Checkout flow', () => {
  it('should complete purchase when payment is approved', async () => { ... });
  it('should show error message when card is declined', async () => { ... });
});
```

---

## §2 — Mockar apenas nas fronteiras do sistema

**Regra:** Mocks e stubs são usados **apenas** para isolar dependências externas ao sistema: chamadas HTTP para terceiros, banco de dados, fila de mensagens, clock/time, randomness (`Math.random`, `crypto.randomUUID`). Nunca mockar módulos internos da própria aplicação para "simplificar" o teste.

**Motivo:** Mock de módulo interno não testa o comportamento real — testa que o código chama o mock. Quando a implementação muda, o teste passa mesmo que a lógica esteja errada. Mock deve reduzir dependência de infraestrutura, não de código próprio.

### §2.1 — Fronteiras aceitas para mock

| Dependência | Técnica |
|---|---|
| HTTP externo | `nock`, `msw` (Mock Service Worker) |
| Banco de dados | in-memory DB, test container, ou prisma mock |
| Fila / event broker | mock do SDK ou in-memory handler |
| Data/hora | `jest.useFakeTimers()`, `@sinonjs/fake-timers` |
| Randomness | `jest.spyOn(Math, 'random').mockReturnValue(...)` |
| Variáveis de ambiente | `process.env.X = 'test-value'` no setup |

### §2.2 — Bloqueado

```typescript
// ⛔ mock de módulo interno
jest.mock('./userService');
jest.mock('../domain/orderCalculator');

// ✅ mock apenas da dependência de infraestrutura
jest.mock('../infrastructure/emailProvider');
```

---

## §3 — Testes devem ser independentes e determinísticos

**Regra:** Cada teste pode ser executado em qualquer ordem, de forma isolada, e produz sempre o mesmo resultado. Testes não compartilham estado, não dependem de execução anterior, não dependem de dado externo variável (ex.: data atual sem mock, resposta de API real).

**Motivo:** Teste que falha apenas quando executado depois de outro não testa comportamento — testa ordem de execução. Esse tipo de teste é o mais difícil de debugar e o menos confiável em CI paralelo.

### §3.1 — Regras práticas

- `beforeEach` para setup de estado — nunca `beforeAll` quando o estado é mutado no teste
- Limpar mocks após cada teste: `jest.clearAllMocks()` no `afterEach` ou `clearMocks: true` na config
- Nunca usar `Date.now()` ou `new Date()` sem mock — usar tempo fixo no setup do teste
- Nunca depender de seed de banco persistente entre testes — cada teste cria e limpa seus próprios dados

---

## §4 — Sem lógica condicional para testes no código de produção

**Regra:** Código de produção não contém blocos condicionados a `process.env.NODE_ENV === 'test'`, `if (testing)`, flags de feature para teste, ou qualquer mecanismo que altere o comportamento em runtime para facilitar o teste.

**Motivo:** Código que se comporta diferente em teste e em produção não valida o comportamento de produção. Se o teste precisa de um caminho especial, o design precisa de revisão — não o código de produção.

### §4.1 — Alternativa correta

Quando o teste precisa controlar comportamento de uma dependência, usar injeção de dependência ou mock na fronteira — não flag condicional no código:

```typescript
// ⛔ flag de teste no código de produção
async function sendEmail(to: string, body: string) {
  if (process.env.NODE_ENV === 'test') return; // pula em teste
  await emailProvider.send(to, body);
}

// ✅ injeção da dependência — mock no teste, real em produção
async function sendEmail(to: string, body: string, provider = emailProvider) {
  await provider.send(to, body);
}
```

---

## §5 — Bloqueio de PR por testes com falha

Ver `operacional.md §2` para as regras de bloqueio de Pull Request quando testes estão falhando, o escopo de quais testes rodar, e o formato de aviso ao desenvolvedor.

---

## §6 — Testes pré-existentes que passam a falhar

Ver `operacional.md §3` para o fluxo obrigatório quando um teste que já existia passa a falhar após mudanças — incluindo a distinção entre regressão e mudança intencional de comportamento, e os anti-padrões bloqueados.

---

## §7 — Dados de teste nunca contêm dado pessoal real

**Regra:** Fixtures, factories, seeds de teste e dados hardcoded em testes usam dados **sintéticos** (gerados por lib como `@faker-js/faker` ou valores fixos obviamente fictícios). Nunca copiar dado real de produção para usar em teste.

**Motivo:** Dado real de produção em repositório é vazamento de dados pessoais — independentemente de ser "só pra teste". Ver `seguranca.md §1` para regras de mascaramento.

### §7.1 — Padrão de factory com dado sintético

```typescript
import { faker } from '@faker-js/faker/locale/pt_BR';

function makeUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    cpf: '123.456.789-09', // CPF de teste — inválido por design
    ...overrides,
  };
}
```
