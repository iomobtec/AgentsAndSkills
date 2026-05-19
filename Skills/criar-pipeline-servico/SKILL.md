# Skill: criar-pipeline-servico

Cria os **dois workflows GitHub Actions** para um serviço Node.js (System API, Process API, BFF ou worker de mensageria): `ci-cd-staging.yml` (deploy automático em todas as branches exceto `main`) e `ci-cd-production.yml` (deploy em `main` com aprovação manual).

**Agente:** dev-devops · dev-backend · dev-bff · dev-mensageria  
**Guardrails aplicáveis:** `devops.md`, `operacional.md §4`, `seguranca.md`

---

## Quando usar

- Ao criar um novo serviço Node.js que precisa de pipeline CI/CD
- Ao adicionar pipeline a serviço existente que ainda não tem
- Ao migrar pipeline de outra ferramenta para GitHub Actions

---

## Pré-requisitos

- Nome do serviço (usado no nome da imagem e do workflow)
- Repositório GitHub dedicado ao serviço já criado e clonado localmente (cada serviço tem seu próprio repo)
- Registry de imagens definido (GHCR por padrão; ECR/GCR se o projeto usa AWS/GCP)
- Target de deploy definido pelo arquiteto (Kubernetes, ECS, Docker Compose em VM)
- Environments `staging` e `production` criados no GitHub (usar `configurar-environments-github` se ainda não existirem)

---

## Processo de execução

### Passo 1 — Coletar informações do serviço

Cada serviço tem seu próprio repositório — o workflow é criado na raiz do repo, sem `paths` filter nem `working-directory`. Confirmar:

```
1. Qual o nome do serviço? (usado no nome da imagem Docker)
2. Qual o registry de imagens?
   - GHCR (ghcr.io) — padrão, usa GITHUB_TOKEN automático
   - AWS ECR — se o projeto usa AWS (recomendado: OIDC, não access key)
   - GCP Artifact Registry — se o projeto usa GCP
   - Azure ACR — se o projeto usa Azure
3. Qual o target de deploy? (Kubernetes · ECS · Docker Compose em VM)
```

Se o registry não for GHCR, usar o bloco de login correspondente da seção §Variantes de registry abaixo.

### Passo 1.5 — Variantes de login no registry

Os templates usam GHCR por padrão. Substituir o bloco de `env` e o step `docker/login-action` conforme o registry do projeto:

#### GHCR (padrão — sem configuração extra)

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# step de login no job de build:
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
  IMAGE_NAME: <nome-do-servico>

# steps de login no job de build:
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ vars.AWS_REGION }}

- uses: aws-actions/amazon-ecr-login@062b18b96a7aff071d4dc91bc00c4c1a7945b076
# Secrets: AWS_ROLE_ARN | Variables: AWS_ACCOUNT_ID, AWS_REGION
```

#### GCP Artifact Registry (via Workload Identity)

```yaml
env:
  REGISTRY: ${{ vars.GCP_REGION }}-docker.pkg.dev
  IMAGE_NAME: ${{ vars.GCP_PROJECT_ID }}/<repositorio>/<nome-do-servico>

# steps de login no job de build:
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
# Secrets: GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT | Variables: GCP_REGION, GCP_PROJECT_ID
```

#### Azure ACR (via Service Principal)

```yaml
env:
  REGISTRY: ${{ vars.ACR_LOGIN_SERVER }}
  IMAGE_NAME: <nome-do-servico>

# step de login no job de build:
- uses: docker/login-action@v3
  with:
    registry: ${{ vars.ACR_LOGIN_SERVER }}
    username: ${{ secrets.ACR_USERNAME }}
    password: ${{ secrets.ACR_PASSWORD }}
# Secrets: ACR_USERNAME, ACR_PASSWORD | Variables: ACR_LOGIN_SERVER
```

### Passo 2 — Gerar `ci-cd-staging.yml`

Executa em **todas as branches exceto `main`**. Test → build → deploy automático.

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

      # ── Build e push para registry ───────────────────────────────────────
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true          # faz o push para o registry após o build
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
      - name: Deploy (staging)
        # Substituir pelo bloco de deploy correto — ver variantes no Passo 4
        run: echo "Substituir pelo passo de deploy para ${{ vars.STAGING_URL }}"
        env:
          IMAGE_TAG: ${{ needs.build-staging.outputs.image-tag }}
```

### Passo 3 — Gerar `ci-cd-production.yml`

Executa **apenas em `main`**. Test → build → deploy com aprovação obrigatória.

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
      packages: write        # necessário para push no GHCR; remover se usar ECR/GCR/ACR
    outputs:
      image-tag: sha-${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      # ── Login no container registry ──────────────────────────────────────
      # GHCR (padrão). Para ECR / GCR / ACR ver Passo 1.5 acima.
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

      # ── Build e push para registry ───────────────────────────────────────
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true          # faz o push para o registry após o build
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
      - name: Deploy (production)
        # Substituir pelo bloco de deploy correto — ver variantes abaixo
        run: echo "Substituir pelo passo de deploy para ${{ vars.PRODUCTION_URL }}"
        env:
          IMAGE_TAG: ${{ needs.build.outputs.image-tag }}
```

### Passo 4 — Substituir o passo de deploy pela variante correta

Escolher o bloco de deploy com base no target definido pelo arquiteto:

#### Variante A — Kubernetes (kubectl)

```yaml
- name: Deploy to Kubernetes
  run: |
    echo "$KUBECONFIG_B64" | base64 -d > /tmp/kubeconfig
    kubectl --kubeconfig /tmp/kubeconfig \
      set image deployment/<nome-do-servico> \
      app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }} \
      -n ${{ vars.K8S_NAMESPACE }}
    kubectl --kubeconfig /tmp/kubeconfig \
      rollout status deployment/<nome-do-servico> \
      -n ${{ vars.K8S_NAMESPACE }} --timeout=120s
  env:
    KUBECONFIG_B64: ${{ secrets.KUBECONFIG }}
    IMAGE_TAG: ${{ needs.build.outputs.image-tag }}
```

Secrets necessários no environment: `KUBECONFIG` (base64 do kubeconfig do cluster)  
Variables necessárias: `K8S_NAMESPACE`, `STAGING_URL` / `PRODUCTION_URL`

#### Variante B — AWS ECS

```yaml
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ vars.AWS_REGION }}

- name: Deploy to ECS
  run: |
    aws ecs update-service \
      --cluster ${{ vars.ECS_CLUSTER }} \
      --service <nome-do-servico> \
      --force-new-deployment
    aws ecs wait services-stable \
      --cluster ${{ vars.ECS_CLUSTER }} \
      --services <nome-do-servico>
```

Secrets necessários: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`  
Variables necessárias: `AWS_REGION`, `ECS_CLUSTER`

#### Variante C — Docker Compose em VM via SSH

```yaml
- name: Deploy via SSH
  run: |
    echo "$SSH_PRIVATE_KEY" > /tmp/deploy_key
    chmod 600 /tmp/deploy_key
    ssh -i /tmp/deploy_key \
      -o StrictHostKeyChecking=no \
      ${{ vars.DEPLOY_USER }}@${{ vars.DEPLOY_HOST }} \
      "cd /app/<nome-do-servico> && \
       echo 'IMAGE_TAG=${{ env.IMAGE_TAG }}' >> .env && \
       docker compose pull && \
       docker compose up -d --no-build"
  env:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    IMAGE_TAG: ${{ needs.build.outputs.image-tag }}
```

Secrets necessários: `SSH_PRIVATE_KEY`  
Variables necessárias: `DEPLOY_USER`, `DEPLOY_HOST`

### Passo 5 — Documentar secrets e variables necessários

Criar ou atualizar `docs/pipeline.md` (ou seção no README do serviço) com a lista de todos os secrets e variables necessários para o pipeline funcionar:

```markdown
## Pipeline CI/CD — <nome-do-servico>

### GitHub Secrets necessários

| Secret | Environment | Descrição |
|---|---|---|
| `KUBECONFIG` | staging | kubeconfig do cluster de staging (base64) |
| `KUBECONFIG` | production | kubeconfig do cluster de produção (base64) |

### GitHub Variables necessárias

| Variable | Environment | Exemplo |
|---|---|---|
| `STAGING_URL` | staging | `https://staging.example.com` |
| `PRODUCTION_URL` | production | `https://example.com` |
| `K8S_NAMESPACE` | staging | `staging` |
| `K8S_NAMESPACE` | production | `production` |
```

---

## Anti-padrões bloqueados

- `devops.md §1` — secret hardcoded no workflow (`password: minha-senha`)
- `devops.md §2` — imagem tagueada apenas com `:latest` sem SHA
- `devops.md §4` — environment `production` sem reviewer obrigatório no GitHub
- Usar arquivo único de workflow para staging e produção — impede controle de fluxo por branch

---

## Checklist de conclusão

- [ ] `ci-cd-staging.yml` criado com `branches-ignore: [main]`
- [ ] `ci-cd-production.yml` criado com `branches: [main]`
- [ ] Staging: imagem tagueada com `sha-<commit>-staging` (`devops.md §2`)
- [ ] Produção: imagem tagueada com `sha-<commit>` + `latest` (`devops.md §2`)
- [ ] `context: .` nos builds — Dockerfile está na raiz do repo
- [ ] Todos os secrets referenciados como `${{ secrets.NOME }}` (`devops.md §1`)
- [ ] Environment `production` com reviewer obrigatório (`devops.md §4`)
- [ ] Cache Docker configurado (`cache-from/cache-to: type=gha`)
- [ ] Secrets e variables documentados para quem vai configurar o repositório
