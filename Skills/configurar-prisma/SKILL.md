# Skill: configurar-prisma

Configura o **Prisma ORM** em um serviço NestJS existente: schema inicial, PrismaService, primeira migration, seed opcional e integração com o ciclo de vida do NestJS.

**Agente:** dev-backend  
**Guardrails aplicáveis:** `00-core.md`, `dados.md`, `seguranca.md`

---

## Quando usar

- Ao adicionar Prisma a um serviço que ainda não tem ORM configurado
- Ao criar o schema inicial após o arquiteto definir o modelo de dados
- Para adicionar nova entidade ao schema existente com migration

---

## Pré-requisitos

- Serviço NestJS inicializado
- Modelo de dados definido pelo arquiteto (tabelas, campos, relacionamentos)
- Banco PostgreSQL acessível com credenciais

---

## Processo de execução

### Passo 1 — Instalar dependências

```bash
npm install @prisma/client
npm install --save-dev prisma
```

### Passo 2 — Inicializar Prisma

```bash
npx prisma init --datasource-provider postgresql
```

Isso cria:
- `prisma/schema.prisma`
- Adiciona `DATABASE_URL` ao `.env` (e ao `.env.example`)

### Passo 3 — Definir o schema

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(uuid())
  name      String    @db.VarChar(100)
  email     String    @unique @db.VarChar(255)
  status    UserStatus @default(ACTIVE)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
}
```

Convenções obrigatórias:
- `id` sempre `String @id @default(uuid())` — nunca auto-increment numérico
- `createdAt`, `updatedAt` em toda tabela de entidade
- `deletedAt` nullable para soft delete em entidades de negócio (`dados.md §6`)
- `@@map("nome_em_snake_case")` para nomear tabela em snake_case no banco
- `@map("nome_em_snake_case")` para colunas

### Passo 4 — Criar PrismaService para NestJS

`src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`src/prisma/prisma.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`@Global()` garante que `PrismaService` está disponível em todos os módulos sem reimportar.

### Passo 5 — Executar migration inicial

```bash
npx prisma migrate dev --name init
```

Isso cria `prisma/migrations/<timestamp>_init/migration.sql`.

Regras de migration (`dados.md §2`):
- Migrations são sempre aditivas — nunca `DROP`, `TRUNCATE` ou `DELETE` sem `WHERE`
- Nome descritivo: `--name add_user_status` (não `--name update`)
- Nunca editar arquivo de migration já commitado

### Passo 6 — Gerar o Prisma Client

```bash
npx prisma generate
```

Adicionar ao `package.json` para rodar automaticamente após `npm install`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Passo 7 — Adicionar PrismaModule ao AppModule

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

### Passo 8 — Configurar Prisma para testes

Para testes de integração, usar banco de teste isolado:

`.env.test`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/<nome_db>_test?schema=public"
```

`test/setup.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Limpar dados entre testes (manter estrutura)
  await prisma.$transaction([
    prisma.user.deleteMany(),
    // outras tabelas na ordem correta (respeitar FK)
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Passo 9 — Adicionar script de migration ao pipeline

`package.json`:
```json
"scripts": {
  "migrate:deploy": "prisma migrate deploy",
  "migrate:dev": "prisma migrate dev",
  "db:seed": "ts-node prisma/seed.ts"
}
```

`migrate:deploy` é para ambientes não-dev (STG, PRD) — aplica migrations pendentes sem interatividade.

---

## Adicionando nova entidade ao schema existente

Ao adicionar nova tabela:
```bash
# 1. Editar prisma/schema.prisma adicionando o novo model
# 2. Criar migration
npx prisma migrate dev --name add_<entidade>
# 3. Regenerar client
npx prisma generate
```

Ao adicionar nova coluna:
```bash
# 1. Adicionar campo ao model (sempre nullable ou com default para não quebrar dados existentes — dados.md §2.3)
# 2. Criar migration
npx prisma migrate dev --name add_<campo>_to_<tabela>
```

---

## Checklist de conclusão

- [ ] `prisma/schema.prisma` com todos os models definidos
- [ ] `PrismaService` e `PrismaModule` criados e registrados no `AppModule`
- [ ] Migration inicial executada e arquivo commitado
- [ ] `DATABASE_URL` no `.env.example` com valor de exemplo (não real)
- [ ] `DATABASE_URL` real em `.env` (nunca commitado — no `.gitignore`)
- [ ] `postinstall` no `package.json` para gerar client
- [ ] `npm run build` sem erros de tipo do Prisma
