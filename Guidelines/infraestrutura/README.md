# Guidelines — Infraestrutura e Containers

Todo serviço desenvolvido na plataforma deve ser entregue como imagem Docker executável. Este guia define os padrões de `Dockerfile`, `docker-compose.yml` e configuração de ambiente para cada tipo de serviço.

> **Regra:** `docker compose up --build` deve subir o serviço completo, com todas as dependências, sem nenhuma etapa manual. Serviço que não atende a isso não está pronto para PR. Veja `Guardrails/operacional.md §4`.

---

## Estrutura de arquivos esperada

```
meu-servico/
├── src/
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
├── .env.example
└── .env               ← nunca commitado (está no .gitignore)
```

---

## Templates por tipo de serviço

### System API / Process API (NestJS)

**`Dockerfile`:**
```dockerfile
# Estágio 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2 — runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

**`docker-compose.yml`:**
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

### BFF (NestJS sem banco próprio)

**`Dockerfile`:** mesmo template acima — apenas remova o `HEALTHCHECK` de banco de dados se o BFF não tiver banco.

**`docker-compose.yml`:**
```yaml
services:
  bff:
    build: .
    ports:
      - "3001:3001"
    env_file:
      - .env
    restart: unless-stopped
```

> **Nota:** O BFF não tem banco próprio. Se precisar de System APIs no ambiente de desenvolvimento, inclua-as como serviços no compose ou use as URLs de staging/mock via variáveis de ambiente.

---

### Worker de Mensageria (NestJS + Kafka/RabbitMQ)

**`docker-compose.yml` com Kafka:**
```yaml
services:
  worker:
    build: .
    env_file:
      - .env
    depends_on:
      kafka:
        condition: service_healthy
    restart: unless-stopped

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list"]
      interval: 10s
      timeout: 10s
      retries: 10
    volumes:
      - kafka_data:/var/lib/kafka/data

volumes:
  kafka_data:
```

**`docker-compose.yml` com RabbitMQ:**
```yaml
services:
  worker:
    build: .
    env_file:
      - .env
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: app
      RABBITMQ_DEFAULT_PASS: app
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 10s
      timeout: 10s
      retries: 5
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

---

### Frontend (React — build estático servido via Nginx)

**`Dockerfile`:**
```dockerfile
# Estágio 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Estágio 2 — servidor estático
FROM nginx:1.25-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`nginx.conf` mínimo:**
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /health {
    return 200 'ok';
    add_header Content-Type text/plain;
  }
}
```

**`docker-compose.yml`:**
```yaml
services:
  frontend:
    build:
      context: .
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:3000}
    ports:
      - "8080:80"
    restart: unless-stopped
```

---

## `.dockerignore` padrão

Usar este arquivo como base em todos os serviços:

```
# Dependências
node_modules
.npm

# Build
dist
build
.next
.nuxt

# Ambiente
.env
.env.*
!.env.example

# Controle de versão
.git
.gitignore

# Testes e cobertura
coverage
*.spec.ts
*.test.ts
__tests__

# IDE e sistema
.vscode
.idea
*.log
*.pid
*.seed
.DS_Store
Thumbs.db
```

---

## `.env.example` — padrão de documentação

Cada variável deve ter comentário descrevendo seu papel. Sem comentário, a variável não vai para o `.env.example`:

```
# ── Banco de dados ──────────────────────────────────────────────────────────
# String de conexão Prisma. Inclui host, porta, usuário, senha e nome do banco.
DATABASE_URL=postgresql://app:app@localhost:5432/app_dev

# Pool máximo de conexões simultâneas com o banco
DATABASE_CONNECTION_LIMIT=5

# ── Servidor ─────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── Autenticação ─────────────────────────────────────────────────────────────
# Mínimo 32 caracteres aleatórios. Nunca reutilizar entre ambientes.
JWT_SECRET=troque-por-string-aleatoria-de-32-caracteres-minimo
JWT_EXPIRES_IN=1h
```

---

## Estratégia de ambientes

| Ambiente | Como rodar | Quem cuida |
|---|---|---|
| Local (dev) | `docker compose up --build` | Desenvolvedor |
| CI (testes) | `docker compose -f docker-compose.test.yml up --abort-on-container-exit` | Pipeline (GitHub Actions) |
| Staging | Imagem buildada no CI, deploy via pipeline | DevOps / CD |
| Produção | Mesma imagem de staging, promovida após aprovação | DevOps / CD |

### `docker-compose.test.yml` para CI

Separe o compose de testes para que o CI não precise do `restart: unless-stopped` e possa usar um banco efêmero sem volume persistente:

```yaml
services:
  app:
    build: .
    env_file:
      - .env.test
    depends_on:
      db:
        condition: service_healthy
    command: ["sh", "-c", "npx prisma migrate deploy && npm test"]

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5
```

---

## Perguntas frequentes

**Por que multi-stage build?**
A imagem de runtime não deve conter TypeScript, `ts-node`, `@types/*` ou código-fonte `.ts`. Multi-stage garante que a imagem final contenha apenas o JavaScript compilado e as dependências de produção — menor superfície de ataque, menor tamanho de imagem.

**Por que `USER node` e não root?**
Container rodando como root em uma vulnerabilidade de escape de container tem acesso root ao host. `node:alpine` já cria o usuário `node` (uid 1000) — basta declarar `USER node` antes do `CMD`.

**Por que versão fixa nas imagens base?**
`node:latest` em janeiro pode ser Node 20; em março pode ser Node 22. A imagem de produção deve ser idêntica à testada localmente. Use `node:20-alpine` e atualize de forma deliberada com teste.

**`docker-compose.yml` não usa `version:` — é erro?**
Não. O campo `version:` foi depreciado no Compose Specification (Compose v2+). Omitir é o padrão correto.
