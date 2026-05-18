# Guia de Testes

> Visão completa do ciclo de testes: da pirâmide ao ambiente de produção.

## Índice

- [Missão](#missão)
- [A Pirâmide de Testes](#a-pirâmide-de-testes)
- [Test Driven Development (TDD)](#test-driven-development-tdd)
- [Testes Unitários](#testes-unitários)
- [Testes de Integração](#testes-de-integração)
- [Testes End-to-End (E2E)](#testes-end-to-end-e2e)
- [Testes de Regressão](#testes-de-regressão)
- [Engenheiro de Qualidade (QA)](#engenheiro-de-qualidade-qa)
- [Escrita de Cenários Gherkin](#escrita-de-cenários-gherkin)
- [Processo de Qualidade](#processo-de-qualidade)

---

## Missão

"Garantir a entrega de produtos de software de alta qualidade por meio da promoção de melhores práticas de teste, colaboração entre equipes e desenvolvimento contínuo.

Buscando inovar constantemente nos processos e ferramentas, construindo uma cultura de qualidade que permeie toda a organização."

### Pilares da Qualidade

| Pilar | Descrição |
|---|---|
| **Garantir a qualidade de software** | Assegurar que todos os produtos atendam aos padrões estabelecidos, proporcionando experiência positiva ao usuário |
| **Promover melhores práticas** | Estabelecer e disseminar automação, testes manuais e revisão de código |
| **Fomentar a colaboração** | Todos compartilham responsabilidade pela qualidade — dev, QA e stakeholders |
| **Inovação em processos** | BDD, automação, CI/CD e integração contínua |
| **Mensuração e melhoria** | Métricas de qualidade e melhoria contínua com base em dados |

[⬆ voltar ao topo](#guia-de-testes)

---

## A Pirâmide de Testes

A pirâmide de testes é um modelo que orienta quantos testes de cada tipo devemos ter e qual o custo relativo de cada camada.

```
        /\
       /E2E\          ← poucos, lentos, caros
      /------\
     /Integração\     ← quantidade moderada
    /------------\
   / Testes       \
  /   Unitários    \  ← muitos, rápidos, baratos
 /------------------\
```

### Camadas da Pirâmide

**Base — Testes Unitários (70%)**
- Testam unidades isoladas de código (funções, classes, componentes)
- Rápidos, determinísticos, sem dependências externas
- Escritos pelos próprios engenheiros de backend e frontend
- Devem ser escritos **antes** do código de produção (TDD)

**Meio — Testes de Integração (20%)**
- Verificam a comunicação entre módulos, serviços e banco de dados
- Mais lentos que unitários, mas ainda automatizados
- Identificam falhas de contrato entre camadas

**Topo — Testes E2E (10%)**
- Simulam jornadas reais do usuário no sistema completo
- Mais lentos e frágeis — reserve para fluxos críticos
- Executados em ambiente de qualidade ou stage

### Anti-patterns a evitar

<details>
<summary>❌ Ignorar a pirâmide e testar só no topo</summary>

**Ruim:** depender apenas de testes manuais ou E2E sem uma base sólida de unitários.

```
// ❌ sem testes unitários na lógica de negócio
// ❌ só testando via interface gráfica
// resultado: suite lenta, frágil e difícil de manter
```

**Bom:** garantir que cada camada tem cobertura adequada antes de subir para a próxima.

</details>

[⬆ voltar ao topo](#guia-de-testes)

---

## Test Driven Development (TDD)

TDD é uma prática onde o teste é escrito **antes** do código de produção. O ciclo é: **Red → Green → Refactor**.

### O Ciclo TDD

```
1. RED    → Escreva um teste que falha (a funcionalidade ainda não existe)
2. GREEN  → Escreva o mínimo de código para o teste passar
3. REFACTOR → Melhore o código sem quebrar o teste
```

### Responsabilidades no TDD

- **Engenheiros de Backend**: escrevem testes unitários e de integração para serviços, controllers e repositórios antes de implementar a lógica
- **Engenheiros de Frontend**: escrevem testes de componentes e hooks antes de implementar a UI
- **Os cenários** devem estar documentados no Confluence e no Jira **antes** do início da sprint

### Por que TDD?

- Design emergente: o teste força uma API limpa e coesa
- Confiança para refatorar sem medo de regressões
- Documentação viva do comportamento esperado
- Reduz tempo de debugging: falhas surgem cedo, não em produção

<details>
<summary>Exemplo TDD — Backend (Node.js / Jest)</summary>

**Passo 1 — RED: escreva o teste primeiro**

```javascript
// src/modules/pedidos/__tests__/calcularDesconto.test.js
const { calcularDesconto } = require('../calcularDesconto');

describe('calcularDesconto', () => {
  it('deve aplicar 10% de desconto para pedidos acima de R$500', () => {
    const resultado = calcularDesconto(600);
    expect(resultado).toBe(540);
  });

  it('não deve aplicar desconto para pedidos abaixo de R$500', () => {
    const resultado = calcularDesconto(300);
    expect(resultado).toBe(300);
  });

  it('deve lançar erro para valores negativos', () => {
    expect(() => calcularDesconto(-10)).toThrow('Valor inválido');
  });
});
```

**Passo 2 — GREEN: implemente o mínimo para passar**

```javascript
// src/modules/pedidos/calcularDesconto.js
function calcularDesconto(valor) {
  if (valor < 0) throw new Error('Valor inválido');
  if (valor > 500) return valor * 0.9;
  return valor;
}

module.exports = { calcularDesconto };
```

**Passo 3 — REFACTOR: melhore sem quebrar**

```javascript
// src/modules/pedidos/calcularDesconto.js
const DESCONTO_PERCENTUAL = 0.1;
const VALOR_MINIMO_DESCONTO = 500;

function calcularDesconto(valor) {
  if (valor < 0) throw new Error('Valor inválido');
  const temDesconto = valor > VALOR_MINIMO_DESCONTO;
  return temDesconto ? valor * (1 - DESCONTO_PERCENTUAL) : valor;
}

module.exports = { calcularDesconto };
```

</details>

<details>
<summary>Exemplo TDD — Frontend (React / React Testing Library)</summary>

**Passo 1 — RED: escreva o teste do componente**

```javascript
// src/components/BotaoCarrinho/__tests__/BotaoCarrinho.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BotaoCarrinho } from '../BotaoCarrinho';

describe('BotaoCarrinho', () => {
  it('deve exibir a quantidade de itens no carrinho', () => {
    render(<BotaoCarrinho quantidade={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('deve chamar onAdicionar ao clicar', () => {
    const onAdicionar = jest.fn();
    render(<BotaoCarrinho quantidade={0} onAdicionar={onAdicionar} />);
    fireEvent.click(screen.getByRole('button', { name: /adicionar ao carrinho/i }));
    expect(onAdicionar).toHaveBeenCalledTimes(1);
  });
});
```

**Passo 2 — GREEN: implemente o componente**

```jsx
// src/components/BotaoCarrinho/BotaoCarrinho.jsx
export function BotaoCarrinho({ quantidade, onAdicionar }) {
  return (
    <button aria-label="adicionar ao carrinho" onClick={onAdicionar}>
      Carrinho <span>{quantidade}</span>
    </button>
  );
}
```

</details>

[⬆ voltar ao topo](#guia-de-testes)

---

## Testes Unitários

Testam **unidades isoladas** de código: uma função, um método, um componente React. Não acessam banco de dados, APIs externas ou sistema de arquivos — use mocks para isolar dependências.

### Ferramentas

| Contexto | Ferramentas |
|---|---|
| Backend (Node.js) | Jest |
| Frontend (React Web) | Jest + React Testing Library |
| Frontend (React Native) | Jest + React Native Testing Library |

### Configuração do Jest (Backend)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
    },
  },
  testPathPattern: '__tests__/.*\\.test\\.js$',
};
```

### Cobertura mínima

A meta de cobertura é **80% de linhas, funções e branches**. O gateway de qualidade do CodeClimate valida esse critério antes do merge.

### Nomenclatura de Testes

Use o padrão: `descrição_deveFazer_quandoCondição`

```javascript
// ✅ Bom
describe('ServicoDeNotificacao', () => {
  it('deve enviar email quando pedido for aprovado', () => { ... });
  it('não deve enviar email quando pedido estiver pendente', () => { ... });
  it('deve lançar erro quando destinatário for inválido', () => { ... });
});

// ❌ Ruim
describe('test1', () => {
  it('funciona', () => { ... });
  it('caso 2', () => { ... });
});
```

### Estrutura AAA (Arrange, Act, Assert)

<details>
<summary>Backend — testando serviços com mocks</summary>

```javascript
// src/modules/usuarios/__tests__/UsuarioService.test.js
const { UsuarioService } = require('../UsuarioService');
const { UsuarioRepository } = require('../UsuarioRepository');

jest.mock('../UsuarioRepository');

describe('UsuarioService', () => {
  let service;
  let repositoryMock;

  beforeEach(() => {
    repositoryMock = new UsuarioRepository();
    service = new UsuarioService(repositoryMock);
  });

  it('deve retornar usuário quando ID existir', async () => {
    // Arrange
    const usuarioEsperado = { id: '1', nome: 'João', email: 'joao@email.com' };
    repositoryMock.findById.mockResolvedValue(usuarioEsperado);

    // Act
    const resultado = await service.buscarPorId('1');

    // Assert
    expect(resultado).toEqual(usuarioEsperado);
    expect(repositoryMock.findById).toHaveBeenCalledWith('1');
  });

  it('deve lançar NotFoundException quando usuário não existir', async () => {
    // Arrange
    repositoryMock.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(service.buscarPorId('999')).rejects.toThrow('Usuário não encontrado');
  });
});
```

</details>

<details>
<summary>Backend — testando controllers (NestJS)</summary>

```javascript
// src/modules/pedidos/__tests__/PedidoController.test.js
const { Test } = require('@nestjs/testing');
const { PedidoController } = require('../PedidoController');
const { PedidoService } = require('../PedidoService');

describe('PedidoController', () => {
  let controller;
  let serviceMock;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PedidoController],
      providers: [
        {
          provide: PedidoService,
          useValue: {
            criar: jest.fn(),
            listar: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PedidoController);
    serviceMock = module.get(PedidoService);
  });

  it('deve criar pedido e retornar status 201', async () => {
    // Arrange
    const dto = { produtoId: 'abc', quantidade: 2 };
    const pedidoCriado = { id: '1', ...dto, status: 'PENDENTE' };
    serviceMock.criar.mockResolvedValue(pedidoCriado);

    // Act
    const resultado = await controller.criar(dto);

    // Assert
    expect(resultado).toEqual(pedidoCriado);
    expect(serviceMock.criar).toHaveBeenCalledWith(dto);
  });
});
```

</details>

<details>
<summary>Frontend Web — testando componentes React</summary>

```javascript
// src/components/FormularioLogin/__tests__/FormularioLogin.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormularioLogin } from '../FormularioLogin';

describe('FormularioLogin', () => {
  it('deve exibir erro quando email estiver vazio ao submeter', async () => {
    // Arrange
    render(<FormularioLogin onSubmit={jest.fn()} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    // Assert
    expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
  });

  it('deve chamar onSubmit com credenciais corretas', async () => {
    // Arrange
    const onSubmit = jest.fn();
    render(<FormularioLogin onSubmit={onSubmit} />);

    // Act
    await userEvent.type(screen.getByLabelText(/email/i), 'user@email.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@email.com',
        senha: 'senha123',
      });
    });
  });
});
```

</details>

<details>
<summary>Frontend — testando hooks customizados</summary>

```javascript
// src/hooks/__tests__/useContador.test.js
import { renderHook, act } from '@testing-library/react';
import { useContador } from '../useContador';

describe('useContador', () => {
  it('deve iniciar com valor zero', () => {
    const { result } = renderHook(() => useContador());
    expect(result.current.valor).toBe(0);
  });

  it('deve incrementar ao chamar incrementar()', () => {
    const { result } = renderHook(() => useContador());

    act(() => {
      result.current.incrementar();
    });

    expect(result.current.valor).toBe(1);
  });

  it('deve resetar ao chamar resetar()', () => {
    const { result } = renderHook(() => useContador(5));

    act(() => {
      result.current.resetar();
    });

    expect(result.current.valor).toBe(0);
  });
});
```

</details>

### O que NÃO testar em unitários

- Implementações internas (não acople testes a detalhes de implementação)
- Getters/setters triviais sem lógica
- Código gerado automaticamente (migrations, schemas)

[⬆ voltar ao topo](#guia-de-testes)

---

## Testes de Integração

Verificam que **múltiplos módulos funcionam juntos corretamente**, incluindo banco de dados, filas e serviços externos. Testam o contrato entre camadas sem simular o sistema inteiro.

### Ferramentas

| Contexto | Ferramentas |
|---|---|
| Backend (API + BD) | Jest + Supertest + banco real (em container) |
| Frontend (componente + API) | Jest + MSW (Mock Service Worker) |

### Banco de Dados em Testes de Integração

Use um banco de dados real isolado para testes — **nunca use o banco de produção ou de staging**.

```javascript
// jest.integration.config.js
module.exports = {
  testEnvironment: 'node',
  testPathPattern: '__tests__/integration/.*\\.test\\.js$',
  globalSetup: './test/setup/globalSetup.js',
  globalTeardown: './test/setup/globalTeardown.js',
  setupFilesAfterFramework: ['./test/setup/setupDb.js'],
};
```

```javascript
// test/setup/globalSetup.js
const { execSync } = require('child_process');

module.exports = async () => {
  // sobe container do banco para testes
  execSync('docker compose -f docker-compose.test.yml up -d --wait');
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/testdb';
};
```

<details>
<summary>Backend — teste de integração com Supertest</summary>

```javascript
// src/modules/pedidos/__tests__/integration/pedidos.integration.test.js
const request = require('supertest');
const { app } = require('../../../../app');
const { prisma } = require('../../../../database/prisma');

describe('Pedidos API (integração)', () => {
  beforeEach(async () => {
    await prisma.pedido.deleteMany();
    await prisma.produto.deleteMany();
    await prisma.produto.create({
      data: { id: 'prod-1', nome: 'Produto Teste', preco: 100 },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /pedidos — deve criar pedido e persistir no banco', async () => {
    const response = await request(app)
      .post('/pedidos')
      .send({ produtoId: 'prod-1', quantidade: 2 })
      .set('Authorization', 'Bearer token-valido');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      produtoId: 'prod-1',
      quantidade: 2,
      status: 'PENDENTE',
    });

    const pedidoNoBanco = await prisma.pedido.findUnique({
      where: { id: response.body.id },
    });
    expect(pedidoNoBanco).not.toBeNull();
  });

  it('GET /pedidos/:id — deve retornar 404 para pedido inexistente', async () => {
    const response = await request(app)
      .get('/pedidos/id-inexistente')
      .set('Authorization', 'Bearer token-valido');

    expect(response.status).toBe(404);
  });
});
```

</details>

<details>
<summary>Frontend — teste de integração com MSW</summary>

```javascript
// src/features/listaPedidos/__tests__/integration/ListaPedidos.integration.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { ListaPedidos } from '../../ListaPedidos';

const server = setupServer(
  rest.get('/api/pedidos', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', produto: 'Plano Mensal', status: 'APROVADO', valor: 500 },
        { id: '2', produto: 'Plano Anual', status: 'PENDENTE', valor: 300 },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ListaPedidos (integração)', () => {
  it('deve carregar e exibir pedidos da API', async () => {
    render(<ListaPedidos />);

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Plano Mensal')).toBeInTheDocument();
      expect(screen.getByText('Plano Anual')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro quando API falhar', async () => {
    server.use(
      rest.get('/api/pedidos', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ListaPedidos />);

    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar pedidos/i)).toBeInTheDocument();
    });
  });
});
```

</details>

[⬆ voltar ao topo](#guia-de-testes)

---

## Testes End-to-End (E2E)

Simulam **jornadas reais do usuário** no sistema completo — browser, API, banco de dados, integrações. São os mais lentos e os mais frágeis: use-os apenas para fluxos críticos de negócio.

### Ferramenta Principal: Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```javascript
// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
```

### Quando usar E2E

- Fluxo de login e autenticação
- Checkout / fluxo de compra
- Criação de pedidos (core de negócio)
- Fluxos críticos que envolvem múltiplos microsserviços

### Quando NÃO usar E2E

- Validações de formulário (use unitário)
- Lógica de negócio isolada (use unitário)
- Contratos de API (use integração)

<details>
<summary>Exemplo E2E — Fluxo de Login</summary>

```javascript
// e2e/auth/login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Autenticação', () => {
  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill('usuario@empresa.com');
    await page.getByLabel('Senha').fill('senha-valida');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bem-vindo')).toBeVisible();
  });

  test('deve exibir erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill('usuario@empresa.com');
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

</details>

<details>
<summary>Exemplo E2E — Criação de Pedido</summary>

```javascript
// e2e/pedidos/criacao.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Criação de Pedido', () => {
  test.beforeEach(async ({ page }) => {
    // login antes de cada teste
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('usuario@empresa.com');
    await page.getByLabel('Senha').fill('senha-teste');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/dashboard');
  });

  test('deve criar pedido com sucesso', async ({ page }) => {
    await page.goto('/pedidos/novo');

    await page.getByLabel('Nome do Cliente').fill('João Silva');
    await page.getByLabel('Código do Produto').fill('PROD-001');
    await page.getByLabel('Quantidade').fill('2');

    await page.getByRole('button', { name: 'Calcular' }).click();
    await expect(page.getByTestId('resultado-calculo')).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar Pedido' }).click();

    await expect(page.getByText(/pedido criado com sucesso/i)).toBeVisible();
    await expect(page.getByTestId('numero-pedido')).toBeVisible();
  });
});
```

</details>

### Page Object Model (POM)

Para suites maiores, organize seletores e ações por página:

```javascript
// e2e/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('E-mail');
    this.senhaInput = page.getByLabel('Senha');
    this.botaoEntrar = page.getByRole('button', { name: 'Entrar' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, senha) {
    await this.emailInput.fill(email);
    await this.senhaInput.fill(senha);
    await this.botaoEntrar.click();
  }
}

module.exports = { LoginPage };
```

[⬆ voltar ao topo](#guia-de-testes)

---

## Testes de Regressão

Garantem que o software continua se comportando corretamente **após novas implementações ou melhorias**. São executados após os testes funcionais de cada entrega.

### Quando executar

- Após cada PR mergeado na branch principal
- Antes de cada release para produção
- Antes e depois de atualizações de dependências

### Estratégia

1. Mantenha um conjunto de testes E2E e de integração cobrindo os fluxos críticos
2. Execute via CI/CD automaticamente — nunca só manualmente
3. Identifique as funcionalidades impactadas pela nova implementação e inclua nos cenários de regressão

### Identificação de impactos

Ao desenvolver uma nova funcionalidade, liste:
- Quais módulos existentes ela toca?
- Quais endpoints são compartilhados?
- Existe alguma lógica reutilizada que pode ter mudado de comportamento?

Documente isso no card do Jira e no Confluence antes do início da implementação.

[⬆ voltar ao topo](#guia-de-testes)

---

## Engenheiro de Qualidade (QA)

O QA é responsável por **validar tudo que é entregue por backend e frontend** — não é o único responsável pela qualidade, mas é o guardião do processo e da cobertura.

### Responsabilidades do QA

| Momento | Responsabilidade |
|---|---|
| **Upstream / Refinamento** | Participar da criação dos cenários Gherkin com o squad. Os cenários devem estar prontos antes do início da sprint |
| **Durante o desenvolvimento** | Acompanhar o progresso e tirar dúvidas sobre critérios de aceite |
| **Na entrega** | Executar testes funcionais e de regressão no ambiente de qualidade |
| **Pré-produção** | Executar testes no ambiente de stage e fazer upload das evidências |
| **Pós-deploy** | Validar em produção e monitorar via Dynatrace |

### O que o QA valida

- **Funcionalidades de backend**: todos os endpoints entregues devem ser testados (happy path + edge cases)
- **Funcionalidades de frontend**: todos os fluxos de UI entregues devem ser testados
- **Integrações**: a comunicação entre frontend e backend nas jornadas críticas
- **Regressão**: garantir que funcionalidades existentes não foram quebradas

### Automação de QA

Cenários Gherkin prioritários devem ser automatizados pelo QA em conjunto com o squad. A decisão de o que automatizar é tomada **em conjunto com o Chapter de Qualidade**.

```gherkin
# Critérios para automatizar um cenário:
# ✅ Fluxo crítico de negócio (emissão, pagamento, login)
# ✅ Cenário executado em toda release
# ✅ Cenário com histórico de regressão
# ❌ Cenário executado raramente
# ❌ Cenário que depende de dados instáveis
```

### Evidências de Teste

Toda execução no ambiente de qualidade e stage deve ter evidências registradas no Confluence:

- Screenshot de cada passo relevante
- Status: passou ✅ ou falhou ❌
- Versão da aplicação testada
- Data e responsável pela execução
- Link da história no Jira

[⬆ voltar ao topo](#guia-de-testes)

---

## Escrita de Cenários Gherkin

Gherkin é a linguagem estruturada para descrever comportamentos esperados do sistema de forma legível por todos — devs, QA, PO e stakeholders.

### Estrutura Básica

```gherkin
Funcionalidade: <descrição da funcionalidade sendo testada>
  Como <persona>
  Quero <ação>
  Para <objetivo de negócio>

  Cenário: <nome do cenário>
    Dado <estado inicial do sistema>
    Quando <ação executada pelo usuário ou sistema>
    Então <resultado esperado>
    E <condição adicional>
```

### Palavras-chave

| Palavra | Uso |
|---|---|
| `Dado` | Estado inicial (precondição) |
| `Quando` | Ação executada |
| `Então` | Resultado esperado (asserção) |
| `E` | Continuação de qualquer bloco |
| `Mas` | Negação ou exceção |

### Exemplos de Cenários

<details>
<summary>Cenário — Login</summary>

```gherkin
Funcionalidade: Autenticação de usuário
  Como usuário do sistema
  Quero fazer login no portal
  Para acessar minhas funcionalidades

  Cenário: Login com credenciais válidas
    Dado que o usuário está na página de login
    Quando ele informa o email "usuario@empresa.com" e a senha "senha123"
    E clica no botão "Entrar"
    Então ele deve ser redirecionado para o dashboard
    E deve ver a mensagem "Bem-vindo, Usuário"

  Cenário: Login com senha incorreta
    Dado que o usuário está na página de login
    Quando ele informa o email "usuario@empresa.com" e a senha "senha-errada"
    E clica no botão "Entrar"
    Então ele deve ver a mensagem de erro "Credenciais inválidas"
    E deve permanecer na página de login

  Cenário: Bloqueio após 5 tentativas falhas
    Dado que o usuário falhou no login 4 vezes consecutivas
    Quando ele tenta fazer login novamente com senha incorreta
    Então sua conta deve ser bloqueada temporariamente
    E ele deve receber um email de recuperação
```

</details>

<details>
<summary>Cenário — Criação de Pedido</summary>

```gherkin
Funcionalidade: Criação de pedido

  Cenário: Criação com dados válidos
    Dado que o usuário está autenticado
    E está na tela de novo pedido
    Quando ele informa o nome do cliente "João Silva"
    E seleciona o produto "Plano Premium"
    E informa a quantidade "2"
    E clica em "Calcular"
    Então o sistema deve exibir o valor total calculado
    Quando ele clica em "Confirmar Pedido"
    Então o pedido deve ser criado com status "ATIVO"
    E o número do pedido deve ser exibido na tela
    E o usuário deve receber a confirmação por email

  Cenário: Tentativa de criação com código de produto inválido
    Dado que o usuário está autenticado
    E está na tela de novo pedido
    Quando ele informa o código "PROD-000"
    Então o sistema deve exibir o erro "Produto não encontrado"
    E o botão "Calcular" deve estar desabilitado
```

</details>

### Boas Práticas para Gherkin

<details>
<summary>❌ Ruim — cenário acoplado a implementação</summary>

```gherkin
# ❌ Não descreva cliques em elementos de UI específicos
Cenário: Criar pedido
  Dado que eu clico no botão com id "btn-novo-pedido"
  Quando eu preencho o campo de texto com name="produtoId" com "abc123"
  E clico no elemento com classe ".submit-btn"
  Então o elemento "#status-message" deve conter o texto "Criado"
```

</details>

<details>
<summary>✅ Bom — cenário orientado a comportamento</summary>

```gherkin
# ✅ Descreva o comportamento, não a implementação
Cenário: Criar pedido com produto válido
  Dado que o usuário está autenticado como comprador
  Quando ele cria um pedido para o produto "Plano Básico"
  Então o pedido deve ser criado com status "PENDENTE"
  E o usuário deve receber uma confirmação por email
```

</details>
---

## Processo de Qualidade

O processo de qualidade no desenvolvimento de software segue 11 etapas, do planejamento ao monitoramento em produção.

```
 1. Construção dos cenários de teste 
         ↓
 2. Desenvolvimento com TDD — testes unitários com ≥ 80% de cobertura
         ↓
 3. Execução de testes automatizados (integrados e E2E)
         ↓
 4. Revisão de código por pares (Pull Request)
         ↓
 5. Testes no ambiente de qualidade pelo QA + upload de evidências
         ↓
 6. Aprovação por especialistas (impactos colaterais)
         ↓
 7. Aprovação pelo PM (Product Manager)
         ↓
 8. Testes no ambiente pré-produção (stage) pelo QA + upload de evidências
         ↓
 9. Publicação e validação em produção
         ↓
10. Monitoramento
```

### Detalhamento de cada etapa

| # | Etapa | Responsável | Critério de conclusão |
|---|---|---|---|
| 1 | Cenários de teste | QA + Squad | Cenários no Confluence com link no Jira, antes do refinamento |
| 2 | Testes unitários (TDD) | Backend / Frontend | ≥ 80% de cobertura, todos passando |
| 3 | Testes automatizados | Backend / Frontend | CI verde (integrados e E2E) |
| 4 | Revisão de PR | Pares / Tech Lead | Aprovação de pelo menos 1 revisor |
| 5 | Testes em qualidade | QA | Evidências registradas no Confluence |
| 6 | Aprovação especialistas | Tech Lead / Arquiteto | Sign-off em impactos colaterais |
| 7 | Aprovação do PM | Product Manager | Aprovação formal da entrega |
| 8 | Testes em stage | QA | Evidências registradas no Confluence |
| 9 | Deploy e validação | DevOps / Backend | Validação pós-deploy sem erros |
| 10 | Monitoramento | Squad | Kubernetes sem alertas anômalos |

### CI/CD — Automação do processo

```yaml
# .github/workflows/quality.yml (exemplo)
name: Quality Gate

on: [pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test -- --coverage
      - name: Enforce coverage threshold
        run: npx jest --coverage --coverageThreshold='{"global":{"lines":80}}'

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

[⬆ voltar ao topo](#guia-de-testes)

---

## Referências

- [Pirâmide de Testes — Maratona de Testes Automatizados](https://dev.to/diegobrandao/maratona-de-testes-automatizados-step-0-fundamentos-importancia-e-a-piramide-de-testes-3i6n)
- [Testing Library — Queries e boas práticas](https://testing-library.com/docs/queries/about)
- [Playwright — Documentação oficial](https://playwright.dev/docs/intro)
- [Jest — Documentação oficial](https://jestjs.io/docs/getting-started)
- [MSW — Mock Service Worker](https://mswjs.io/docs/)
- [Martin Fowler — Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Cucumber — Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
