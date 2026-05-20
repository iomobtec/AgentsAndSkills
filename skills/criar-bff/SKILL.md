# Skill: criar-bff

Inicializa um **novo serviço BFF (Backend for Frontend)** em NestJS: estrutura de pastas, configuração base, clients HTTP para consumo de APIs upstream, validação, logging, guard de autenticação e testes — pronto para receber a primeira implementação de endpoint.

**Agente:** dev-bff  
**Guardrails aplicáveis:** `00-core.md`, `backend.md`, `seguranca.md`

---

## Quando usar

- Quando o arquiteto define novo BFF para servir um frontend ou canal específico
- BFF não tem banco de dados próprio — agrega, transforma e expõe dados de Process e System APIs

> **Repositório dedicado:** este serviço deve ser inicializado **dentro do repositório GitHub clonado** pelo orquestrador na Fase 2.5. Nunca criar em subpasta de monorepo — cada serviço tem seu próprio repo.

---

## Diferença da estrutura em relação ao backend

| Aspecto | System/Process API | BFF |
|---|---|---|
| Banco de dados | Sim (System) / Não (Process) | Nunca |
| ORM (Prisma) | Sim (System) | Nunca |
| Clients HTTP | Pode ter | Sempre tem — é a camada de integração |
| Responsabilidade | Domínio ou orquestração | Adaptação para o frontend |
| Quem chama | Outros serviços | Frontend React |

---

## Pré-requisitos

- Especificação do arquiteto: nome do BFF, frontend servido, APIs upstream a consumir
- Node.js 20+ e npm instalados
- URLs dos serviços upstream (Process ou System APIs)

---

## Processo de execução

### Passo 1 — Criar estrutura de pastas

```
<nome>-bff/
├── src/
│   ├── modules/
│   │   └── <feature>/
│   │       ├── <feature>.module.ts
│   │       ├── <feature>.controller.ts
│   │       ├── <feature>.service.ts
│   │       ├── dto/
│   │       │   └── <feature>-response.dto.ts
│   │       └── clients/
│   │           ├── <upstream-a>.client.ts
│   │           └── <upstream-b>.client.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   ├── config/
│   │   └── env.config.ts
│   └── main.ts
├── test/
│   └── <feature>/
│       ├── <feature>.service.spec.ts
│       └── <feature>.controller.spec.ts
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

> Sem pasta `prisma/` — BFF não tem banco de dados.

### Passo 2 — Inicializar projeto NestJS

```bash
npx @nestjs/cli new <nome>-bff --package-manager npm --skip-git
cd <nome>-bff
npm install @nestjs/config @nestjs/axios axios
npm install @nestjs/passport @nestjs/jwt passport passport-jwt
npm install class-validator class-transformer
npm install --save-dev @types/passport-jwt
npm install --save-dev @nestjs/testing jest @types/jest ts-jest supertest @types/supertest nock
```

### Passo 3 — Configurar variáveis de ambiente

`.env.example`:
```env
# App
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=changeme-min-32-chars

# Upstream APIs
ORDER_PROCESS_URL=http://localhost:3001
USER_SYSTEM_URL=http://localhost:3002
PRODUCT_SYSTEM_URL=http://localhost:3003
```

`src/config/env.config.ts` — conforme `backend.md §6` (env vars validadas no startup):
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(32),
  ORDER_PROCESS_URL: z.string().url(),
  USER_SYSTEM_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### Passo 4 — Criar client HTTP base reutilizável

`src/common/http/base.client.ts`:
```typescript
import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export abstract class BaseClient {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly http: HttpService,
    protected readonly baseUrl: string,
  ) {}

  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<T>(`${this.baseUrl}${path}`, config),
      );
      return data;
    } catch (error) {
      this.handleUpstreamError(error, path);
    }
  }

  protected async post<T>(path: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<T>(`${this.baseUrl}${path}`, body, config),
      );
      return data;
    } catch (error) {
      this.handleUpstreamError(error, path);
    }
  }

  private handleUpstreamError(error: any, path: string): never {
    if (error.response) {
      // Propagar status e body do serviço upstream — nunca expor detalhe interno
      throw new HttpException(error.response.data, error.response.status);
    }
    this.logger.error(`Upstream unavailable: ${path}`);
    throw new HttpException('Service temporarily unavailable', 503);
  }
}
```

### Passo 5 — Criar client para cada upstream

`src/modules/<feature>/clients/<upstream>.client.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseClient } from '../../../common/http/base.client';
import { env } from '../../../config/env.config';

@Injectable()
export class OrderProcessClient extends BaseClient {
  constructor(http: HttpService) {
    super(http, env.ORDER_PROCESS_URL);
  }

  async getOrder(orderId: string): Promise<OrderDto> {
    return this.get<OrderDto>(`/api/v1/orders/${orderId}`);
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
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' });
  app.setGlobalPrefix('api/v1');

  await app.listen(env.PORT);
}
bootstrap();
```

### Passo 7 — Configurar autenticação JWT

Seguir `configurar-auth` — idêntico ao backend. O BFF é o ponto de entrada do frontend, portanto o JWT guard deve ser configurado globalmente aqui.

### Passo 8 — Configurar Jest com nock

`package.json`:
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "clearMocks": true
}
```

Para testes de integração, usar `nock` para interceptar HTTP aos upstreams — ver `criar-teste-integracao`.

### Passo 9 — Criar arquivos Docker

Seguindo `operacional.md §4` e o template em `Guidelines/infraestrutura/README.md` (seção BFF):

**`Dockerfile`** — multi-stage build, imagem base versionada, `USER node` antes do `CMD`.

**`.dockerignore`** — excluir `node_modules`, `.env*`, `dist`, `.git`, `coverage`.

**`docker-compose.yml`** — apenas o serviço `bff`, com `env_file`. Sem banco (BFF não tem banco próprio). Upstream APIs configuradas via variáveis de ambiente.

### Passo 10 — Validar que o projeto sobe

```bash
npm run build
docker compose up --build   # valida que o container sobe corretamente
```

---

## Checklist de conclusão

- [ ] `npm run build` sem erros
- [ ] `npm run start:dev` sobe sem erros
- [ ] Nenhum arquivo `prisma/` criado (BFF não tem banco)
- [ ] Todos os upstreams configurados como variáveis de ambiente validadas
- [ ] CORS configurado com `ALLOWED_ORIGINS` (não `*` em produção)
- [ ] JWT guard global registrado no `AppModule`
- [ ] `npm test` roda sem falha
- [ ] `.env.example` documenta todas as variáveis, sem valores reais (`seguranca.md §2`)
- [ ] `Dockerfile` com multi-stage, imagem versionada, `USER node` (`operacional.md §4.1`)
- [ ] `.dockerignore` presente (`operacional.md §4.2`)
- [ ] `docker-compose.yml` presente com `env_file` (`operacional.md §4.3`)
- [ ] `docker compose up --build` executa sem erro
