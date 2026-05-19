# Skill: criar-system-api

Inicializa um **novo serviço de System API** em NestJS: estrutura de pastas, configuração base, módulo de domínio, Prisma, validação, logging e testes — pronto para receber a primeira implementação de endpoint.

**Agente:** dev-backend  
**Guardrails aplicáveis:** `00-core.md`, `backend.md`, `dados.md`, `seguranca.md`

---

## Quando usar

- Quando o arquiteto define um novo serviço de domínio com persistência própria
- System API: fonte da verdade de uma entidade, tem banco de dados próprio, expõe CRUD e regras de domínio

> **Repositório dedicado:** este serviço deve ser inicializado **dentro do repositório GitHub clonado** pelo orquestrador na Fase 2.5. Nunca criar em subpasta de monorepo — cada serviço tem seu próprio repo.

---

## Pré-requisitos

- Especificação do arquiteto com: nome do serviço, responsabilidade, modelo de dados inicial, contratos de endpoint
- Node.js 20+ e npm instalados
- Acesso ao banco PostgreSQL (ou credencial para criar banco novo)

---

## Processo de execução

### Passo 1 — Criar estrutura de pastas

```
<nome-do-servico>/
├── src/
│   ├── modules/
│   │   └── <dominio>/
│   │       ├── <dominio>.module.ts
│   │       ├── <dominio>.controller.ts
│   │       ├── <dominio>.service.ts
│   │       ├── dto/
│   │       │   ├── create-<dominio>.dto.ts
│   │       │   └── update-<dominio>.dto.ts
│   │       └── entities/
│   │           └── <dominio>.entity.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   ├── config/
│   │   └── env.config.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   └── main.ts
├── test/
│   └── <dominio>/
│       ├── <dominio>.service.spec.ts
│       └── <dominio>.controller.spec.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### Passo 2 — Inicializar projeto NestJS

```bash
npx @nestjs/cli new <nome-do-servico> --package-manager npm --skip-git
cd <nome-do-servico>
npm install @nestjs/config @nestjs/mapped-types
npm install class-validator class-transformer
npm install @prisma/client
npm install --save-dev prisma
npm install --save-dev @nestjs/testing jest @types/jest ts-jest supertest @types/supertest
```

### Passo 3 — Configurar variáveis de ambiente

`.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/<nome_db>?schema=public"

# App
PORT=3000
NODE_ENV=development

# Auth (se aplicável)
JWT_SECRET=changeme-min-32-chars
```

`src/config/env.config.ts` — conforme `backend.md §6` (env vars validadas no startup):
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
```

### Passo 4 — Configurar PrismaService

`src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### Passo 5 — Configurar exception filter global

`src/common/filters/all-exceptions.filter.ts` — seguindo `padronizar-erros`:
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const isHttpException = exception instanceof HttpException;
    const detail = isHttpException
      ? (exception.getResponse() as any)?.message ?? exception.message
      : 'An unexpected error occurred.';

    response.status(status).json({
      type: `https://api.example.com/errors/${status}`,
      title: isHttpException ? exception.name : 'InternalServerError',
      status,
      detail,
      instance: request.url,
      correlationId: request.headers['x-correlation-id'],
    });
  }
}
```

### Passo 6 — Configurar main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { env } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api/v1');

  await app.listen(env.PORT);
}
bootstrap();
```

### Passo 7 — Criar schema Prisma inicial

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model <Dominio> {
  id        String   @id @default(uuid())
  // campos do modelo conforme especificação do arquiteto
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("<dominios>")
}
```

### Passo 8 — Configurar Jest

`package.json` (seção jest):
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "clearMocks": true
}
```

### Passo 9 — Criar arquivos Docker

Seguindo `operacional.md §4` e o template em `Guidelines/infraestrutura/README.md` (seção System API):

**`Dockerfile`** — multi-stage build, imagem base versionada, `USER node` antes do `CMD`.

**`.dockerignore`** — excluir `node_modules`, `.env*`, `dist`, `.git`, `coverage`.

**`docker-compose.yml`** — serviço `app` + serviço `db` (PostgreSQL com versão fixa), `healthcheck` no banco, `depends_on: condition: service_healthy`, variáveis via `env_file`.

Broker de mensageria: incluir no `docker-compose.yml` apenas se o serviço for produtor ou consumidor — usar o template correto para o broker definido pelo arquiteto (Kafka, RabbitMQ ou LocalStack para SQS).

### Passo 10 — Validar que o projeto sobe

```bash
npx prisma migrate dev --name init
npm run build
docker compose up --build   # valida que o ambiente completo sobe
```

---

## Saída produzida

- Estrutura de pastas completa
- `package.json` com todas as dependências
- `prisma/schema.prisma` com modelo inicial
- `src/main.ts` com ValidationPipe e ExceptionFilter globais
- `src/config/env.config.ts` com validação de env vars
- `src/prisma/prisma.service.ts`
- `.env.example` com todas as variáveis necessárias
- `Dockerfile` multi-stage
- `.dockerignore`
- `docker-compose.yml` com banco e healthcheck
- Jest configurado e pronto para `npm test`

---

## Checklist de conclusão

- [ ] `npm run build` sem erros
- [ ] `npm run start:dev` sobe sem erros
- [ ] `npx prisma migrate dev` aplica a migration inicial
- [ ] `npm test` roda sem falha (mesmo que vazio)
- [ ] `.env.example` documenta todas as variáveis sem valores reais (`seguranca.md §2`)
- [ ] Nenhum valor real de credencial em arquivo commitado (`seguranca.md §2`)
- [ ] `Dockerfile` com multi-stage, imagem versionada, `USER node` (`operacional.md §4.1`)
- [ ] `.dockerignore` presente (`operacional.md §4.2`)
- [ ] `docker-compose.yml` com banco, `healthcheck` e `depends_on: condition: service_healthy` (`operacional.md §4.3`)
- [ ] `docker compose up --build` executa sem erro
