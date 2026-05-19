# Guidelines — DevOps e CI/CD

Guia de referência para construção de pipelines de CI/CD com **GitHub Actions**, cobertura obrigatória de dois ambientes (staging e produção) e deploy de imagens Docker. Todos os pipelines gerados devem seguir `Guardrails/devops.md`.

---

## Estratégia de ambientes

O pipeline é dividido em **dois arquivos** com comportamentos distintos:

| Arquivo | Trigger | Ambiente | Proteção |
|---|---|---|---|
| `ci-cd-staging.yml` | Push em qualquer branch **exceto** `main` | Staging | Nenhuma — deploy automático |
| `ci-cd-production.yml` | Push em `main` | Production | Reviewer obrigatório + wait timer |

| Aspecto | Staging | Production |
|---|---|---|
| Trigger | Push em qualquer branch (exceto `main`) | Push/merge em `main` |
| Proteção | Nenhuma (deploy imediato) | Reviewer obrigatório + wait timer |
| Propósito | Validação funcional durante desenvolvimento | Entrega ao usuário final |
| Rollback | Re-run do workflow com SHA anterior | Idem |
| URL | `https://staging.<dominio>` | `https://<dominio>` |

### Fluxo por evento

```
Push em branch de feature (qualquer branch exceto main)
  └─ ci-cd-staging.yml
       └─ job: test
            └─ testes unitários + integração com cobertura
            └─ build check (compila sem erros)
       └─ job: build-staging   (depende de test)
            └─ build imagem Docker multi-stage
            └─ login no container registry (GHCR / ECR / GCR / ACR)
            └─ push para registry com tag sha-<commit>-staging
       └─ job: deploy-staging  (depende de build-staging)
            └─ pull da imagem sha-<commit>-staging do registry
            └─ deploy automático para staging

Merge em main
  └─ ci-cd-production.yml
       └─ job: test (re-valida na branch main)
            └─ testes unitários + integração com cobertura
            └─ build check
       └─ job: build   (depende de test)
            └─ build imagem Docker multi-stage
            └─ login no container registry (GHCR / ECR / GCR / ACR)
            └─ push para registry com tags sha-<commit> + latest
       └─ job: deploy-production  (depende de build)
            └─ aguarda aprovação humana no GitHub
            └─ pull da imagem sha-<commit> do registry
            └─ deploy para produção após aprovação
```

> **Por que dois arquivos?** Separar os pipelines garante que cada branch de feature tem seu ambiente de staging atualizado automaticamente durante o desenvolvimento. A produção só é acionada via `main`, com controle total.

---

## Estrutura de repositórios e arquivos

Cada serviço tem seu **próprio repositório** no GitHub. Não há monorepo — cada repo contém um único serviço.

```
<org>/<service-name>/          # Repositório dedicado ao serviço
├── src/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── .github/
    └── workflows/
        ├── ci-cd-staging.yml     # Executa em todas as branches exceto main
        └── ci-cd-production.yml  # Executa apenas em main, com gate de aprovação
```

Um repositório por serviço garante:
- Deploy de um serviço não bloqueia ou interfere nos demais
- Histórico de git limpo e focado no domínio do serviço
- Pipeline simplificado — sem `paths` filter, sem `working-directory`
- Permissões e secrets isolados por serviço

---

## Registry de imagens

O padrão recomendado é **GitHub Container Registry (GHCR)** — não requer configuração extra de credenciais além do `GITHUB_TOKEN` já disponível. Projetos hospedados em nuvem pública devem usar o registry nativo da mesma nuvem.

| Registry | Autenticação | Custo | Recomendação |
|---|---|---|---|
| GHCR (`ghcr.io`) | `GITHUB_TOKEN` automático | Grátis para público, plano GitHub para privado | **Padrão** |
| AWS ECR | IAM via OIDC (recomendado) ou access key | Pago por armazenamento/transferência | Se o projeto usa AWS |
| GCP Artifact Registry | Workload Identity Federation ou SA JSON | Pago | Se o projeto usa GCP |
| Azure ACR | Service Principal ou Workload Identity | Pago | Se o projeto usa Azure |
| Docker Hub | `DOCKERHUB_TOKEN` | Grátis com limite de rate | Evitar para produção |

### Login no registry — variantes por provedor

O passo de login e push varia de acordo com o registry. Substituir o bloco `env: REGISTRY` e o step `docker/login-action` conforme o provedor:

#### GHCR (padrão)

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# No job de build:
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

Permissão necessária no job: `packages: write`

#### AWS ECR (via OIDC — recomendado)

```yaml
env:
  REGISTRY: ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com
  IMAGE_NAME: <nome-do-servico>

# No job de build:
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ vars.AWS_REGION }}

- uses: aws-actions/amazon-ecr-login@062b18b96a7aff071d4dc91bc00c4c1a7945b076
```

Secrets necessários: `AWS_ROLE_ARN` (ARN da role com permissão `ecr:GetAuthorizationToken` + `ecr:BatchCheckLayerAvailability` + `ecr:PutImage`)  
Variables necessárias: `AWS_ACCOUNT_ID`, `AWS_REGION`  
Pré-requisito: configurar OIDC provider no IAM da conta AWS para `token.actions.githubusercontent.com`

#### GCP Artifact Registry (via Workload Identity)

```yaml
env:
  REGISTRY: ${{ vars.GCP_REGION }}-docker.pkg.dev
  IMAGE_NAME: ${{ vars.GCP_PROJECT_ID }}/<repositorio>/<nome-do-servico>

# No job de build:
- uses: google-github-actions/auth@55bd3a7c6e2ae7cf1877fd1ccb9d54c0503c457c
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

- uses: docker/login-action@v3
  with:
    registry: ${{ vars.GCP_REGION }}-docker.pkg.dev
    username: oauth2accesstoken
    password: ${{ steps.auth.outputs.access_token }}
```

Secrets necessários: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`  
Variables necessárias: `GCP_REGION`, `GCP_PROJECT_ID`

#### Azure ACR (via Service Principal)

```yaml
env:
  REGISTRY: ${{ vars.ACR_LOGIN_SERVER }}
  IMAGE_NAME: <nome-do-servico>

# No job de build:
- uses: docker/login-action@v3
  with:
    registry: ${{ vars.ACR_LOGIN_SERVER }}
    username: ${{ secrets.ACR_USERNAME }}
    password: ${{ secrets.ACR_PASSWORD }}
```

Secrets necessários: `ACR_USERNAME`, `ACR_PASSWORD` (Service Principal com role `AcrPush`)  
Variables necessárias: `ACR_LOGIN_SERVER` (ex: `myregistry.azurecr.io`)

---

## Template: Pipeline staging — serviço Node.js (`ci-cd-staging.yml`)

Executa em **todas as branches exceto `main`**. Deploy automático para staging em cada push.

```yaml
name: CI/CD Staging — <nome-do-servico>

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

      - name: Run tests with coverage
        run: npm test -- --coverage --ci

      - name: Build check
        run: npm run build

  build-staging:
    name: Build & Push Image (staging)
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: sha-${{ github.sha }}-staging
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}-staging
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
      # Substituir pelo bloco de deploy correto — ver variantes em criar-pipeline-servico
      - name: Deploy (staging)
        run: echo "Deploy sha-${{ github.sha }}-staging para ${{ vars.STAGING_URL }}"
        env:
          IMAGE_TAG: ${{ needs.build-staging.outputs.image-tag }}
```

---

## Template: Pipeline produção — serviço Node.js (`ci-cd-production.yml`)

Executa **apenas em `main`**. Requer aprovação manual via environment `production`.

```yaml
name: CI/CD Production — <nome-do-servico>

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

      - name: Run tests with coverage
        run: npm test -- --coverage --ci

      - name: Build check
        run: npm run build

  build:
    name: Build & Push Image
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: sha-${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      - uses: docker/setup-buildx-action@v3

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-production:
    name: Deploy → Production
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: ${{ vars.PRODUCTION_URL }}
    steps:
      - uses: actions/checkout@v4
      # Substituir pelo bloco de deploy correto — ver variantes em criar-pipeline-servico
      - name: Deploy (production)
        run: echo "Deploy sha-${{ github.sha }} para ${{ vars.PRODUCTION_URL }}"
        env:
          IMAGE_TAG: ${{ needs.build.outputs.image-tag }}
```

---

## Template: Pipeline staging — frontend React (`ci-cd-staging.yml`)

Build com `VITE_*` de staging, deploy automático em todas as branches exceto `main`.

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
      - run: npm ci
      - run: npm test -- --coverage --ci --watchAll=false
      - run: npm run build
        env:
          VITE_API_URL: ${{ vars.STAGING_API_URL }}

  build-staging:
    name: Build Image (staging)
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: sha-${{ github.sha }}-staging
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
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
      # Passo de deploy conforme target do projeto
```

---

## Template: Pipeline produção — frontend React (`ci-cd-production.yml`)

Build com `VITE_*` de produção, deploy em `main` com aprovação obrigatória.

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
      - run: npm ci
      - run: npm test -- --coverage --ci --watchAll=false
      - run: npm run build
        env:
          VITE_API_URL: ${{ vars.PRODUCTION_API_URL }}

  build-production:
    name: Build Image (production)
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: sha-${{ github.sha }}-production
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/setup-buildx-action@v3

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
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
      # Passo de deploy conforme target do projeto (secrets/vars de produção)
```

> **Imagens separadas por ambiente:** `VITE_*` são embutidas em build time — cada pipeline constrói sua própria imagem com as variáveis corretas. Nunca use `secrets.*` como `build-args`.

---

## Configuração de environments no GitHub

Via `gh` CLI:

```bash
# Criar environment staging (sem proteção — deploy automático)
gh api repos/:owner/:repo/environments/staging \
  --method PUT \
  --field wait_timer=0

# Criar environment production (com aprovação obrigatória)
gh api repos/:owner/:repo/environments/production \
  --method PUT \
  --field wait_timer=5 \
  --field 'reviewers=[{"type":"User","id":<user-id>}]'

# Adicionar secret a um environment
gh secret set DATABASE_URL \
  --env staging \
  --body "postgresql://user:pass@staging-db:5432/app"
```

Via UI: Settings → Environments → New environment → configurar protection rules.

---

## Estratégia de rollback

O rollback é sempre feito re-executando o workflow com a SHA do commit anterior:

```bash
# Listar deployments recentes para identificar SHA estável
gh run list --workflow ci-cd-production.yml --limit 10

# Re-executar um run anterior (re-deploy da versão anterior)
gh run rerun <run-id>
```

Alternativa para rollback urgente em Kubernetes:
```bash
kubectl rollout undo deployment/<service> -n production
```

---

## Checklist de pipeline pronto para produção

- [ ] Dois arquivos de workflow: `ci-cd-staging.yml` (branches exceto main) e `ci-cd-production.yml` (main)
- [ ] `ci-cd-staging.yml` usa `branches-ignore: [main]`
- [ ] `ci-cd-production.yml` usa `branches: [main]` e environment `production` com reviewer
- [ ] Secrets referenciados como `${{ secrets.NOME }}` — nunca hardcoded (`devops.md §1`)
- [ ] Images tagueadas com SHA do commit — staging: `sha-<sha>-staging`, produção: `sha-<sha>` (`devops.md §2`)
- [ ] Environment `production` com reviewer obrigatório no GitHub (`devops.md §4`)
- [ ] Versions de actions de terceiros fixadas a SHA (`devops.md §5`)
- [ ] Cache de layer Docker configurado (`cache-from/cache-to: type=gha`)
- [ ] Secrets de staging e produção em environments separados (`devops.md §7`)
