# Skill: criar-pipeline-frontend

Cria os **dois workflows GitHub Actions** para um frontend React: `ci-cd-staging.yml` (build com variáveis de staging, deploy automático em todas as branches exceto `main`) e `ci-cd-production.yml` (build com variáveis de produção, deploy em `main` com aprovação manual).

**Agente:** dev-devops · dev-frontend  
**Guardrails aplicáveis:** `devops.md`, `operacional.md §4`, `seguranca.md`

---

## Quando usar

- Ao criar um novo frontend React que precisa de pipeline CI/CD
- Ao adicionar pipeline a frontend existente
- Frontend é entregue como imagem Docker Nginx (conforme `Guidelines/infraestrutura/README.md`)

---

## Diferença em relação a `criar-pipeline-servico`

| Aspecto | Serviço Node.js | Frontend React |
|---|---|---|
| Testes | Jest com cobertura | Jest + RTL com `--watchAll=false` |
| Build | `npm run build` (TypeScript) | `npm run build` (Vite/CRA — assets estáticos) |
| Imagem | Node.js runtime | Nginx com assets estáticos |
| Build args | Variáveis de servidor | `VITE_*` / `REACT_APP_*` (públicas — nunca secrets) |
| Cache | Layer npm + TypeScript | Layer npm + assets gerados |

---

## Pré-requisitos

- Repositório GitHub dedicado ao frontend já criado e clonado localmente (repositório separado dos serviços de backend)
- Framework do frontend (Vite / Create React App / Next.js)
- Variáveis de ambiente públicas por ambiente (`VITE_API_URL` de staging e produção)
- Registry definido (GHCR por padrão)
- Target de deploy definido (Kubernetes, ECS, VM)
- Environments `staging` e `production` no GitHub

---

## Processo de execução

### Passo 1 — Confirmar variáveis de build e registry

Variáveis de build do frontend (`VITE_*`, `REACT_APP_*`) são embutidas na imagem em build time. Por isso:

- **Staging e produção precisam de imagens separadas** se as URLs de API forem diferentes
- Nunca usar `secrets.*` como `build-args` — esses valores ficam na camada da imagem e são inspecionáveis
- Somente valores públicos (URLs, feature flags) vão em `build-args`

```
Perguntas antes de gerar:
1. Qual a URL da API de staging? (ex: https://api.staging.example.com)
2. Qual a URL da API de produção? (ex: https://api.example.com)
3. Há outras variáveis de build que diferem entre ambientes?
4. Qual o container registry?
   - GHCR (ghcr.io) — padrão, usa GITHUB_TOKEN automático
   - AWS ECR — se o projeto usa AWS
   - GCP Artifact Registry — se o projeto usa GCP
   - Azure ACR — se o projeto usa Azure
```

### Passo 1.5 — Variantes de login no registry

Os templates usam GHCR por padrão. Substituir o bloco `env` e o step `docker/login-action` conforme o registry:

#### GHCR (padrão)

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
# permissão necessária no job: packages: write
```

#### AWS ECR (via OIDC)

```yaml
env:
  REGISTRY: ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com
  IMAGE_NAME: frontend

- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ vars.AWS_REGION }}

- uses: aws-actions/amazon-ecr-login@062b18b96a7aff071d4dc91bc00c4c1a7945b076
# Secrets: AWS_ROLE_ARN | Variables: AWS_ACCOUNT_ID, AWS_REGION
```

#### GCP Artifact Registry

```yaml
env:
  REGISTRY: ${{ vars.GCP_REGION }}-docker.pkg.dev
  IMAGE_NAME: ${{ vars.GCP_PROJECT_ID }}/<repositorio>/frontend

- uses: google-github-actions/auth@55bd3a7c6e2ae7cf1877fd1ccb9d54c0503c457c
  id: auth
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

- uses: docker/login-action@v3
  with:
    registry: ${{ vars.GCP_REGION }}-docker.pkg.dev
    username: oauth2accesstoken
    password: ${{ steps.auth.outputs.access_token }}
```

#### Azure ACR

```yaml
env:
  REGISTRY: ${{ vars.ACR_LOGIN_SERVER }}
  IMAGE_NAME: frontend

- uses: docker/login-action@v3
  with:
    registry: ${{ vars.ACR_LOGIN_SERVER }}
    username: ${{ secrets.ACR_USERNAME }}
    password: ${{ secrets.ACR_PASSWORD }}
```

### Passo 2 — Gerar `ci-cd-staging.yml`

Executa em **todas as branches exceto `main`**. Build com variáveis de staging, deploy automático.

```yaml
name: CI/CD Staging — frontend

on:
  push:
    branches-ignore:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage --ci --watchAll=false

      - name: Build check
        run: npm run build
        env:
          VITE_API_URL: ${{ vars.STAGING_API_URL }}

  build-staging:
    name: Build Image (staging)
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write        # necessário para push no GHCR; remover se usar ECR/GCR/ACR
    outputs:
      image-tag: sha-${{ github.sha }}-staging
    steps:
      - uses: actions/checkout@v4

      # ── Login no container registry ──────────────────────────────────────
      # GHCR (padrão). Para ECR / GCR / ACR ver Passo 1.5 acima.
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      # ── Build com VITE_* de staging e push para registry ─────────────────
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true          # faz o push para o registry após o build
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}-staging
          build-args: |
            VITE_API_URL=${{ vars.STAGING_API_URL }}
          cache-from: type=gha,scope=staging
          cache-to: type=gha,scope=staging,mode=max

  deploy-staging:
    name: Deploy → Staging
    needs: build-staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ vars.STAGING_URL }}
    steps:
      - uses: actions/checkout@v4
      - name: Deploy (staging)
        # Substituir pelo bloco de deploy correto — ver criar-pipeline-servico para variantes
        run: echo "Deploy sha-${{ github.sha }}-staging para ${{ vars.STAGING_URL }}"
        env:
          IMAGE_TAG: ${{ needs.build-staging.outputs.image-tag }}
```

### Passo 3 — Gerar `ci-cd-production.yml`

Executa **apenas em `main`**. Build com variáveis de produção, deploy com aprovação obrigatória.

```yaml
name: CI/CD Production — frontend

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage --ci --watchAll=false

      - name: Build check
        run: npm run build
        env:
          VITE_API_URL: ${{ vars.PRODUCTION_API_URL }}

  build-production:
    name: Build Image (production)
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write        # necessário para push no GHCR; remover se usar ECR/GCR/ACR
    outputs:
      image-tag: sha-${{ github.sha }}-production
    steps:
      - uses: actions/checkout@v4

      # ── Login no container registry ──────────────────────────────────────
      # GHCR (padrão). Para ECR / GCR / ACR ver Passo 1.5 acima.
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      # ── Build com VITE_* de produção e push para registry ────────────────
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true          # faz o push para o registry após o build
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}-production
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          build-args: |
            VITE_API_URL=${{ vars.PRODUCTION_API_URL }}
          cache-from: type=gha,scope=production
          cache-to: type=gha,scope=production,mode=max

  deploy-production:
    name: Deploy → Production
    needs: build-production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: ${{ vars.PRODUCTION_URL }}
    steps:
      - uses: actions/checkout@v4
      - name: Deploy (production)
        run: echo "Deploy sha-${{ github.sha }}-production para ${{ vars.PRODUCTION_URL }}"
        env:
          IMAGE_TAG: ${{ needs.build-production.outputs.image-tag }}
```

### Passo 4 — Documentar variáveis e secrets necessários

```markdown
## Pipeline CI/CD — Frontend

### GitHub Variables necessárias

| Variable | Environment | Exemplo |
|---|---|---|
| `STAGING_API_URL` | staging | `https://api.staging.example.com` |
| `PRODUCTION_API_URL` | production | `https://api.example.com` |
| `STAGING_URL` | staging | `https://staging.example.com` |
| `PRODUCTION_URL` | production | `https://example.com` |
```

---

## Anti-padrões bloqueados

- Usar `secrets.*` em `build-args` — secrets ficam na camada da imagem (`devops.md §1`)
- Imagem única para staging e produção quando URLs diferem — bake em build time garante isolamento
- Arquivo único de workflow para staging e produção — impede controle de fluxo por branch
- Environment `production` sem reviewer obrigatório (`devops.md §4`)

---

## Checklist de conclusão

- [ ] `ci-cd-staging.yml` criado com `branches-ignore: [main]` e `VITE_*` de staging
- [ ] `ci-cd-production.yml` criado com `branches: [main]` e `VITE_*` de produção
- [ ] `context: .` nos jobs de build — Dockerfile está na raiz do repo
- [ ] Imagem staging tagueada com `sha-<commit>-staging`, produção com `sha-<commit>-production` + `latest`
- [ ] `build-args` contém apenas valores públicos — nunca secrets (`devops.md §1`)
- [ ] Environment `production` com reviewer obrigatório (`devops.md §4`)
- [ ] Variables documentadas: `STAGING_API_URL`, `PRODUCTION_API_URL`, `STAGING_URL`, `PRODUCTION_URL`
