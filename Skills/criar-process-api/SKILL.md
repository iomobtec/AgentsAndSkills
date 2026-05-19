# Skill: criar-process-api

Inicializa um **novo serviço de Process API** em NestJS: estrutura de pastas, configuração base, módulo de orquestração, clientes HTTP para consumo de Systems, logging e testes — pronto para receber a primeira implementação de fluxo.

**Agente:** dev-backend  
**Guardrails aplicáveis:** `00-core.md`, `backend.md`, `seguranca.md`

---

## Quando usar

- Quando o arquiteto define novo serviço de orquestração de fluxo entre Systems
- Process API: não tem banco de dados próprio, orquestra chamadas a outros serviços, implementa regras de fluxo (não de domínio)

---

## Diferença em relação à System API

| Aspecto | System API | Process API |
|---|---|---|
| Banco de dados | Próprio (Prisma + PostgreSQL) | Nenhum (não persiste) |
| Responsabilidade | Fonte da verdade de uma entidade | Orquestra chamadas entre Systems |
| Dependências | Mínimas — apenas seu domínio | Chama múltiplos Systems |
| Estado | Gerencia estado da entidade | Passa estado entre serviços |

---

## Pré-requisitos

- Especificação do arquiteto com: nome do serviço, fluxo a orquestrar, Systems que serão chamados, contratos de endpoint
- Node.js 20+ e npm instalados
- URLs dos Systems que serão consumidos

---

## Processo de execução

### Passo 1 — Criar estrutura de pastas

```
<nome-do-servico>/
├── src/
│   ├── modules/
│   │   └── <fluxo>/
│   │       ├── <fluxo>.module.ts
│   │       ├── <fluxo>.controller.ts
│   │       ├── <fluxo>.service.ts
│   │       ├── dto/
│   │       │   └── <operacao>.dto.ts
│   │       └── clients/
│   │           ├── <system-a>.client.ts
│   │           └── <system-b>.client.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   ├── config/
│   │   └── env.config.ts
│   └── main.ts
├── test/
│   └── <fluxo>/
│       ├── <fluxo>.service.spec.ts
│       └── <fluxo>.controller.spec.ts
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### Passo 2 — Inicializar projeto NestJS

```bash
npx @nestjs/cli new <nome-do-servico> --package-manager npm --skip-git
cd <nome-do-servico>
npm install @nestjs/config @nestjs/axios axios
npm install class-validator class-transformer
npm install --save-dev @nestjs/testing jest @types/jest ts-jest supertest @types/supertest nock
```

### Passo 3 — Configurar variáveis de ambiente

`.env.example`:
```env
# App
PORT=3000
NODE_ENV=development

# Systems consumidos
<SYSTEM_A>_URL=http://localhost:3001
<SYSTEM_B>_URL=http://localhost:3002

# Auth
JWT_SECRET=changeme-min-32-chars
```

`src/config/env.config.ts` — conforme `backend.md §6` (env vars validadas no startup):
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SYSTEM_A_URL: z.string().url(),
  SYSTEM_B_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### Passo 4 — Criar client HTTP para cada System consumido

`src/modules/<fluxo>/clients/<system-a>.client.ts`:
```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { env } from '../../../config/env.config';

@Injectable()
export class SystemAClient {
  private readonly baseUrl = env.SYSTEM_A_URL;

  constructor(private readonly http: HttpService) {}

  async findById(id: string): Promise<SystemAResponse> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<SystemAResponse>(`${this.baseUrl}/api/v1/resources/${id}`)
      );
      return data;
    } catch (error) {
      // Propagar status code do System sem expor detalhe interno
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw error;
    }
  }
}
```

### Passo 5 — Configurar exception filter global

Idêntico ao `criar-system-api` passo 5 — reutilizar o mesmo `AllExceptionsFilter`.

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

### Passo 7 — Configurar Jest com mock de HTTP

`package.json` (seção jest) — igual ao System API.

Para testes do Process API, usar `nock` para interceptar chamadas HTTP aos Systems:
```typescript
import nock from 'nock';

beforeEach(() => nock.cleanAll());
afterAll(() => nock.restore());

it('should return result when system-a responds', async () => {
  nock(env.SYSTEM_A_URL)
    .get('/api/v1/resources/123')
    .reply(200, { id: '123', name: 'Test' });

  const result = await service.execute('123');
  expect(result).toEqual({ ... });
});
```

### Passo 8 — Criar arquivos Docker

Seguindo `operacional.md §4` e o template em `Guidelines/infraestrutura/README.md` (seção System API — sem o serviço `db`, pois Process API não tem banco próprio):

**`Dockerfile`** — multi-stage build, imagem base versionada, `USER node` antes do `CMD`.

**`.dockerignore`** — excluir `node_modules`, `.env*`, `dist`, `.git`, `coverage`.

**`docker-compose.yml`** — apenas o serviço `app`, com `env_file`. Sem banco. Se a Process API faz parte de um ambiente local com Systems, documentar no README como subir os Systems necessários.

### Passo 9 — Validar que o projeto sobe

```bash
npm run build
docker compose up --build   # valida que o container sobe corretamente
```

---

## Saída produzida

- Estrutura de pastas completa sem Prisma (sem banco próprio)
- Clients HTTP tipados para cada System consumido
- `src/config/env.config.ts` com URLs dos Systems como variáveis validadas
- Exception filter, ValidationPipe e logging configurados
- `.env.example` com todas as variáveis necessárias
- `Dockerfile` multi-stage
- `.dockerignore`
- `docker-compose.yml` (sem banco)
- Jest configurado com `nock` para mock de HTTP

---

## Checklist de conclusão

- [ ] `npm run build` sem erros
- [ ] `npm run start:dev` sobe sem erros
- [ ] Nenhum `import` direto de código de outro serviço (apenas HTTP client)
- [ ] URLs dos Systems em variáveis de ambiente (não hardcoded)
- [ ] `npm test` roda sem falha
- [ ] Nenhuma credencial real em arquivo commitado (`seguranca.md §2`)
- [ ] `Dockerfile` com multi-stage, imagem versionada, `USER node` (`operacional.md §4.1`)
- [ ] `.dockerignore` presente (`operacional.md §4.2`)
- [ ] `docker-compose.yml` presente com `env_file` (`operacional.md §4.3`)
- [ ] `docker compose up --build` executa sem erro
