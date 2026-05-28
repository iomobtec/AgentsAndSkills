# Guidelines — ECS Fargate (Deploy Padrão)

Stack de entrega de containers para backend e frontend: **AWS ECR** como registry, **AWS ECS Fargate** como runtime. Esta é a configuração padrão de todos os serviços que produzem imagens Docker neste projeto.

---

## Stack de entrega

| Componente | Escolha | Motivo |
|---|---|---|
| Registry | AWS ECR | Integração nativa com ECS — sem credencial extra na task definition |
| Runtime | AWS ECS Fargate | Serverless containers — sem gerenciamento de instâncias EC2 |
| Load Balancer | ALB (Application Load Balancer) | Health check + roteamento por serviço |
| Env vars | dump-env no job `envfile` | Padrão do projeto — gera `.env` a partir de `.env.example` + GitHub Secrets |
| Auth CI→AWS | OIDC (preferido) ou access key | OIDC não exige rotação de credencial; access key aceito como fallback |

---

## Estrutura de jobs dos pipelines

Todo pipeline de container segue esta estrutura de 3 jobs (ver variante de staging abaixo para o job `test` adicional):

```
envfile → release → deploy
```

| Job | O que faz |
|---|---|
| `envfile` | Gera `.env` via `dump-env` a partir de `.env.example` + GitHub Secrets/Vars; publica como artifact |
| `release` | Baixa artifact `.env`, builda imagem Docker, publica no ECR com tag `sha-<commit>` |
| `deploy` | Atualiza o serviço ECS com a nova imagem e aguarda estabilização |

---

## Pré-requisitos de infraestrutura

Antes de executar o pipeline, o arquiteto deve ter definido e o time deve ter criado:

1. **ECR repository** por serviço — ex: `meuestar-backend`, `meuestar-frontend`
2. **ECS cluster** — ex: `meuestar-staging`, `meuestar-production`
3. **ECS service** com task definition base — o pipeline atualiza a imagem, não cria o service do zero
4. **ALB + Target Group** com health check configurado no path `/health` (ou equivalente)
5. **IAM Role para OIDC** (se usar OIDC) ou **IAM User** com permissões mínimas (se usar access key)

### Permissões IAM mínimas para o pipeline

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:<region>:<account-id>:repository/<nome-do-repo>"
    },
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "arn:aws:ecs:<region>:<account-id>:service/<cluster>/<service>"
    }
  ]
}
```

---

## Autenticação CI → AWS

### Opção A — OIDC (preferida, sem rotação de credencial)

Configurar no GitHub o OIDC provider e criar a IAM Role com trust policy apontando para o repositório. No workflow:

```yaml
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ vars.AWS_REGION }}
```

Secrets necessários: `AWS_ROLE_ARN`
Variables necessárias: `AWS_REGION`

### Opção B — Access Key (fallback aceito)

```yaml
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ vars.AWS_REGION }}
```

Secrets necessários: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
Variables necessárias: `AWS_REGION`

---

## Job envfile — geração de `.env`

```yaml
envfile:
  runs-on: ubuntu-latest
  environment: <staging|production>

  env:
    # Mapear cada secret e var do GitHub para variáveis com prefixo _
    _DB_HOST:     ${{ secrets._DB_HOST }}
    _DB_PASSWORD: ${{ secrets._DB_PASSWORD }}
    _APP_KEY:     ${{ secrets._APP_KEY }}
    # ... outros secrets com prefixo _
    _APP_URL:     ${{ vars._APP_URL }}
    # ... outros vars com prefixo _

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
    - name: Generate .env from template
      run: |
        pip install dump-env
        dump-env --template=.env.example --prefix='_' > env
    - uses: actions/upload-artifact@v4
      with:
        name: env-file
        path: env
        if-no-files-found: error
```

O arquivo `.env.example` no repositório deve conter todas as chaves sem valores (apenas nomes). O `dump-env` substitui as chaves pelo valor das variáveis de ambiente com prefixo `_`.

---

## Job release — build e push no ECR

```yaml
release:
  needs: [envfile]   # adicionar "test" em staging
  runs-on: ubuntu-latest
  environment: <staging|production>

  steps:
    - uses: actions/checkout@v4

    - name: Download .env artifact
      uses: actions/download-artifact@v4
      with:
        name: env-file
        path: .

    - name: Move .env to project root
      run: mv env .env

    - uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ vars.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@062b18b96a7aff071d4dc91bc00c4c1a7945b076

    - name: Build and push image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ steps.login-ecr.outputs.registry }}/${{ vars.ECR_REPOSITORY }}:sha-${{ github.sha }}
          ${{ steps.login-ecr.outputs.registry }}/${{ vars.ECR_REPOSITORY }}:production
        # Para staging, usar apenas: sha-${{ github.sha }}-staging
```

---

## Job deploy — atualização do serviço ECS

```yaml
deploy:
  needs: release
  runs-on: ubuntu-latest
  environment: <staging|production>

  steps:
    - uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ vars.AWS_REGION }}

    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster ${{ vars.ECS_CLUSTER }} \
          --service ${{ vars.ECS_SERVICE }} \
          --force-new-deployment

    - name: Wait for service stability
      run: |
        aws ecs wait services-stable \
          --cluster ${{ vars.ECS_CLUSTER }} \
          --services ${{ vars.ECS_SERVICE }}
```

O `wait services-stable` bloqueia o job até o serviço substituir todas as tasks antigas pelas novas (ou falhar). Isso garante que o pipeline só reporta sucesso quando o deploy está efetivamente ativo.

---

## GitHub Secrets e Variables por environment

### Staging

| Tipo | Nome | Descrição |
|---|---|---|
| Secret | `AWS_ACCESS_KEY_ID` | IAM access key para staging |
| Secret | `AWS_SECRET_ACCESS_KEY` | IAM secret key para staging |
| Secret | `_<NOME>` | Cada secret da aplicação com prefixo `_` |
| Variable | `AWS_REGION` | ex: `us-east-1` |
| Variable | `AWS_ACCOUNT_ID` | ID da conta AWS |
| Variable | `ECR_REPOSITORY` | ex: `meuestar-backend` |
| Variable | `ECS_CLUSTER` | ex: `meuestar-staging` |
| Variable | `ECS_SERVICE` | ex: `meuestar-backend-staging` |
| Variable | `_<NOME>` | Cada variável pública da aplicação com prefixo `_` |

### Produção

Mesmos itens, com valores de produção, configurados no environment `production`.

---

## Rollback manual

Se o deploy causar regressão e o `wait services-stable` já completou, o rollback é feito apontando o serviço para a task definition anterior:

```bash
# Listar revisões da task definition
aws ecs list-task-definitions --family-prefix <nome-da-task-def> --sort DESC

# Forçar deploy da revisão anterior
aws ecs update-service \
  --cluster <cluster> \
  --service <service> \
  --task-definition <nome-da-task-def>:<revisao-anterior> \
  --force-new-deployment
```

---

## Checklist de infraestrutura antes do primeiro pipeline

- [ ] ECR repository criado para o serviço (`aws ecr create-repository`)
- [ ] ECS cluster existe (staging e produção)
- [ ] Task definition base criada com CPU/memória e variáveis iniciais
- [ ] ECS service criado e associado ao ALB + target group
- [ ] Health check no ALB configurado (`/health` ou rota equivalente)
- [ ] IAM credenciais (OIDC role ou access key) criadas com permissões mínimas
- [ ] GitHub environments `staging` e `production` configurados com protection rules
- [ ] Secrets e Variables do GitHub preenchidos por environment
- [ ] `.env.example` no repositório com todas as chaves (sem valores)
