# Skill: criar-teste-integracao

Escreve **testes de integração** para controllers NestJS: sobe a aplicação em memória, executa requests HTTP reais contra o app, usa banco de dados de teste real (ou in-memory) e valida o comportamento fim a fim de cada endpoint.

**Agente:** dev-backend  
**Guardrails aplicáveis:** `00-core.md`, `testes.md`, `seguranca.md`

---

## Quando usar

- Para validar que controller → service → banco funcionam corretamente juntos
- Após implementar endpoint com `implementar-endpoint`
- Para cobrir fluxos que testes unitários não alcançam (serialização, pipes, guards, filtros)
- Para garantir que migrations e queries funcionam contra banco real

---

## Diferença entre unitário e integração

| Aspecto | Unitário | Integração |
|---|---|---|
| O que testa | Lógica isolada da service | Fluxo completo: HTTP → controller → service → banco |
| Banco de dados | Mockado (Prisma mockado) | Real (banco de teste PostgreSQL) |
| Velocidade | Rápido (< 100ms) | Mais lento (100ms–2s por teste) |
| O que encontra | Bugs de lógica | Bugs de integração, serialização, validação de schema |
| Mock de HTTP externo | Não aplicável | `nock` para APIs externas |

---

## Pré-requisitos

- Banco de teste PostgreSQL disponível (diferente do banco de desenvolvimento)
- Variável `DATABASE_URL` apontando para banco de teste em `.env.test`
- Migrations aplicadas no banco de teste

---

## Processo de execução

### Passo 1 — Configurar banco de teste

`.env.test`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/<nome_db>_test?schema=public"
NODE_ENV=test
JWT_SECRET=test-secret-for-testing-only-32chars
```

`package.json`:
```json
"scripts": {
  "test:e2e": "dotenv -e .env.test -- jest --config jest-integration.json --runInBand"
}
```

### Passo 2 — Configurar Jest para integração

`jest-integration.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testRegex": ".*\\.integration\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "clearMocks": true,
  "globalSetup": "./test/setup-global.ts",
  "setupFilesAfterFramework": ["./test/setup.ts"]
}
```

### Passo 3 — Criar setup global e por teste

`test/setup-global.ts` — executa uma vez antes de todos os testes:
```typescript
import { execSync } from 'child_process';

export default async function globalSetup() {
  // Aplicar migrations no banco de teste
  execSync('npx prisma migrate deploy', { env: { ...process.env } });
}
```

`test/setup.ts` — executa antes de cada arquivo de teste:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Limpar tabelas em ordem (respeitar FK) — dados de teste só
  await prisma.$transaction([
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Passo 4 — Criar o arquivo de teste de integração

Localização: `test/<recurso>/<recurso>.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

describe('UserController (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Registrar os mesmos pipes e filtros do main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('api/v1');

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });
```

### Passo 5 — Escrever casos de teste

Nomenclatura: `should <comportamento> when <condição>` — `testes.md §1`

**POST — criação com sucesso:**
```typescript
  describe('POST /api/v1/users', () => {
    it('should return 201 with created user when data is valid', async () => {
      const dto = { name: 'João Silva', email: 'joao@example.com' };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(dto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'João Silva',
        createdAt: expect.any(String),
      });
      // Nunca retorna email em claro se for dado sensível — seguranca.md §1
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should return 409 when email already exists', async () => {
      const dto = { name: 'João', email: 'joao@example.com' };
      await prisma.user.create({ data: dto });

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(dto)
        .expect(409);

      expect(response.body.type).toContain('conflict');
    });

    it('should return 400 when required field is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ name: 'Sem Email' })
        .expect(400);
    });
  });
```

**GET — listagem paginada:**
```typescript
  describe('GET /api/v1/users', () => {
    it('should return paginated list when users exist', async () => {
      await prisma.user.createMany({
        data: [
          { name: 'Usuário 1', email: 'u1@example.com' },
          { name: 'Usuário 2', email: 'u2@example.com' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users?page=1&pageSize=10')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({ total: 2, page: 1, pageSize: 10 });
    });

    it('should return empty list when no users exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });
```

**Endpoints autenticados:**
```typescript
  describe('GET /api/v1/users/me (autenticado)', () => {
    it('should return 401 when token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('should return user data when token is valid', async () => {
      const user = await prisma.user.create({ data: { name: 'Auth User', email: 'auth@example.com' } });
      const token = generateTestToken(user.id); // helper de teste

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(user.id);
    });
  });
```

### Passo 6 — Dados de teste nunca usam dado pessoal real

Usar dados obviamente sintéticos — `testes.md §7`:
```typescript
// ✅ dados sintéticos
{ name: 'João Silva', email: 'joao@example.com', cpf: '123.456.789-09' }

// ⛔ dado real copiado de produção
{ name: 'Pedro Andriow', email: 'pedro@empresa.com', cpf: '987.654.321-00' }
```

---

## Saída produzida

- `test/<recurso>/<recurso>.integration.spec.ts`
- `test/setup.ts` e `test/setup-global.ts` configurados
- `jest-integration.json` configurado
- Script `test:e2e` no `package.json`
- Todos os endpoints do recurso cobertos: sucesso, erros de validação, conflitos, not found, autenticação
