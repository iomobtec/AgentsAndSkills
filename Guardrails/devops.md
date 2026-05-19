# GuardRails — DevOps

Regras de **segurança, rastreabilidade e qualidade de pipelines CI/CD** aplicadas a todo agente que gera ou revisa workflows de automação. Estas regras são complementares a `operacional.md §4` (que define a obrigatoriedade de containers Docker) e se concentram no ciclo de build, publicação e deploy.

---

## §1 — Secrets nunca em arquivos de workflow

**Regra:** Nenhum valor sensível (senha, token, API key, connection string, certificado) pode aparecer em arquivos de workflow (`.github/workflows/*.yml`), scripts de CI ou qualquer artefato commitado no repositório. Toda informação sensível é referenciada exclusivamente via `${{ secrets.NOME }}` (GitHub Secrets) ou `${{ vars.NOME }}` (GitHub Variables para valores não sensíveis).

**Motivo:** Workflow files ficam no histórico do git. Um secret hardcoded é um secret comprometido para todo sempre — rotação não resolve, pois a credencial permanece nos commits anteriores.

### §1.1 — Padrão obrigatório

```yaml
# ⛔ nunca
- run: docker login -u admin -p minha-senha-real registry.example.com

# ✅ sempre
- uses: docker/login-action@v3
  with:
    registry: ${{ vars.REGISTRY }}
    username: ${{ secrets.REGISTRY_USER }}
    password: ${{ secrets.REGISTRY_TOKEN }}
```

### §1.2 — Anti-padrão de interpolação em run

```yaml
# ⛔ expõe o secret no log se o comando falhar
- run: curl -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" $URL

# ✅ usar env var intermediária — GitHub a mascara no log
- run: curl -H "Authorization: Bearer $API_TOKEN" $URL
  env:
    API_TOKEN: ${{ secrets.API_TOKEN }}
```

---

## §2 — Imagens Docker sempre tagueadas com SHA do commit

**Regra:** Toda imagem Docker produzida em CI deve ser tagueada com o SHA curto do commit (`sha-<7chars>`) além de qualquer outra tag semântica. A tag `:latest` sozinha é proibida como identificador de deploy — ela não é rastreável.

**Motivo:** Tag `:latest` não identifica o código em execução. Em um incidente, é impossível saber qual commit está rodando. SHA do commit torna o deploy auditável e o rollback reproduzível.

```yaml
# ✅ usando docker/metadata-action
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ${{ env.IMAGE_NAME }}
    tags: |
      type=sha,prefix=sha-          # sha-a1b2c3d (rastreável)
      type=semver,pattern={{version}} # v1.2.3 (quando há tag git)
      type=raw,value=latest,enable={{is_default_branch}}
```

---

## §3 — Staging deve preceder e aprovar o deploy em produção

**Regra:** O job de deploy em produção deve depender (`needs`) do job de deploy em staging. O deploy em produção nunca pode ser disparado sem que o deploy em staging tenha concluído com sucesso no mesmo run.

**Motivo:** Staging é o gate de qualidade antes de produção. Pular staging é equivalente a deployar código não testado em produção.

```yaml
# ✅ dependência explícita
deploy-production:
  needs: deploy-staging   # bloqueado se staging falhar
  environment: production
```

```yaml
# ⛔ deploy paralelo ou independente de staging
deploy-production:
  needs: build            # staging é ignorado
```

---

## §4 — Produção exige gate de aprovação humana

**Regra:** O environment `production` no GitHub deve ter **pelo menos um revisor obrigatório** configurado nas protection rules. Nenhum workflow pode fazer deploy em produção de forma totalmente automática, sem intervenção humana.

**Motivo:** Deploy automático em produção elimina a última linha de defesa manual. O tempo de espera do gate é mínimo; o custo de um deploy errado em produção pode ser alto.

### §4.1 — Configuração obrigatória no GitHub

No environment `production` (Settings → Environments → production):
- `Required reviewers`: ao menos 1 pessoa ou time
- `Wait timer`: opcional, recomendado mínimo 5 minutos para dar tempo de cancelar
- `Deployment branches`: restringir a `main` ou branches de release

---

## §5 — Versões de actions fixadas

**Regra:** Actions de terceiros (exceto as mantidas pelo próprio `actions/`) devem ser fixadas ao **SHA completo do commit**, não a uma tag mutável. Actions oficiais do `actions/` devem ser fixadas à versão major (ex: `@v4`).

**Motivo:** Tags como `@v1`, `@main`, `@latest` são mutáveis — uma action maliciosa pode ser injetada via atualização da tag. SHA é imutável.

```yaml
# ⛔ tag mutável para action de terceiro
- uses: aws-actions/configure-aws-credentials@main

# ✅ SHA fixo para action de terceiro
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502

# ✅ versão major para actions oficiais do github
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
```

---

## §6 — Logs nunca expõem dados sensíveis

**Regra:** Nenhum step de CI pode logar (via `echo`, `run`, output de comando) senhas, tokens, connection strings ou dados pessoais. O GitHub mascara automaticamente valores de `secrets.*`, mas valores derivados ou concatenados não são mascarados.

```yaml
# ⛔ derivação de secret não é mascarada automaticamente
- run: echo "Conectando em ${{ secrets.DB_HOST }}:${{ secrets.DB_PORT }}"

# ✅ logar apenas metadados não sensíveis
- run: echo "Iniciando deploy para o ambiente ${{ inputs.environment }}"
```

---

## §7 — Separação de secrets por environment

**Regra:** Secrets de staging e produção devem ser armazenados em **environments diferentes** no GitHub (não como repository secrets). Repository secrets são compartilhados por todos os workflows e environments — um vazamento expõe tudo.

```
# ✅ estrutura correta de secrets
Repository secrets:
  - REGISTRY_TOKEN          (mesmo token para todos os ambientes é aceitável)

Environment secrets (staging):
  - DATABASE_URL            (connection string do banco de staging)
  - KUBECONFIG              (kubeconfig do cluster de staging)

Environment secrets (production):
  - DATABASE_URL            (connection string do banco de produção)
  - KUBECONFIG              (kubeconfig do cluster de produção)
```

---

## §8 — Padrão geral de recusa para violação deste guardrail

```
⛔ Pedido bloqueado pelo GuardRails/devops.md §<n> — <título>

Motivo: <qual parte específica do pedido infringe>

Alternativa segura:
1. <como fazer corretamente>

Para contornar essa regra, abrir exceção formal conforme
Guardrails/README.md §6 — aprovação do arquiteto obrigatória.
```
