# GuardRails — Segurança

Regras inegociáveis sobre proteção de **dados pessoais**, **secrets** e **operações destrutivas em banco** aplicadas a todo código, configuração, migration ou artefato gerado por agente. 

Carregado por: **todos os agents** (sem exceção).

---

## §1 — Dados pessoais nunca expostos em relatórios, extrações ou artefatos

**Regra:** CPF, CNPJ, RG, CNH, passaporte, endereço, telefone, e-mail pessoal, dados bancários, dados de cartão e qualquer dado pessoal de cliente, usuário ou colaborador são **sempre** **mascarados**, **embaralhados** ou substituídos por dados **fake** antes de aparecer em qualquer relatório, extração, planilha, CSV, JSON, log, mensagem de erro, screenshot, documento de análise ou artefato compartilhado.

**Motivo:** LGPD (art. 6º, 46) responsabiliza a organização por todo dado pessoal que sai do contexto autorizado. Relatório com CPF real circulando por e-mail, planilha em rede compartilhada ou print colado em ticket é vazamento — independentemente da intenção. Vazamento = sanção de até 2% do faturamento.

### §1.1 — Tabela de tratamento por tipo de dado

| Dado | Mascarado | Embaralhado | Fake |
|---|---|---|---|
| CPF | `***.***.***-12` (mantém só os 2 últimos) | hash determinístico (`f3a9…`) | gerado por lib (`123.456.789-09`) |
| CNPJ | `**.***.***/0001-**` | hash determinístico | gerado por lib |
| E-mail | `e***@dominio.com` | hash + domínio fake | `user{id}@example.com` |
| Telefone | `(11) ****-1234` | hash | gerador |
| Endereço | cidade + UF apenas | — | gerador |
| RG / CNH / passaporte | últimos 2 dígitos | hash | gerador |
| Cartão de crédito | `****-****-****-1234` | nunca embaralhar | nunca em ambiente real |
| Conta bancária / agência | últimos 4 dígitos | hash | gerador |
| Entidade vinculada a pessoa | ID interno do sistema | — | gerador |

### §1.2 — Quando usar cada técnica

- **Mascarado** — quando precisa identificar parcialmente o registro (suporte dirigido, debugging de ticket específico). Mantém legibilidade controlada.
- **Embaralhado** — quando precisa correlacionar mas não identificar (ex.: análise estatística, contagem de comportamento, agregações). Hash determinístico permite agrupar sem expor.
- **Fake** — quando o dado precisa só "parecer real" (demo, treinamento, ambiente DEV/QA, screenshot em documentação, exemplo em PR). Dado sintético gerado por lib.

### §1.3 — Bloqueado pelo agent

Pedidos que o agent **deve recusar** sem exceção:

- "Gera um relatório/CSV/Excel com os CPFs dos clientes que…"
- "Faz uma extração da base com os e-mails para mandar e-mail marketing"
- "Tira print da tela com os dados do cliente para o ticket"
- "Loga o request inteiro pra eu ver o que tá vindo do front"
- "Só dessa vez deixa o CPF aparecer no log que eu preciso debugar"
- "Exporta produção e me manda" (sem cláusula explícita de mascaramento)

### §1.4 — Exceção legítima

**Trilha de auditoria legal** (registro de acesso a dado sensível para responder titular sob LGPD): pode armazenar identificador completo, **mas** em store dedicado, com ACL restrita, retenção própria e acesso ele mesmo auditado. **Nunca** misturado com log operacional.

---

## §2 — Secrets nunca expostos a partir de `.env`, arquivos de configuração ou variáveis de produção

**Regra:** Não exibir, copiar, logar, anexar em ticket, colar em chat, gerar relatório ou de qualquer forma exteriorizar o conteúdo de: arquivos `.env`, `.env.production`, `.env.local`, variáveis de ambiente de PRD/STG/Production, connection strings, tokens, chaves de API, certificados (`*.pem`, `*.key`, `*.p12`) e senhas. Proibição **reforçada** em ambientes Production/PRD.

**Motivo:** Secret exposto = comprometido, mesmo que "só viu uma pessoa". Custo de rotacionar credencial é menor que o risco de não rotacionar. Em PRD a janela entre exposição e abuso pode ser de minutos. Repositório, log e chat são históricos permanentes — `git push --force` ou apagar mensagem **não desfaz** o vazamento.

### §2.1 — Bloqueado pelo agent

Em **qualquer ambiente**, e com bloqueio reforçado em Production/PRD:

- "Lê o `.env.production` e me mostra o conteúdo"
- "Copia a connection string do `.env` daqui pra cá"
- "Bota o token no README pra ficar fácil de testar"
- "Loga o header `Authorization` pra eu ver o que vem"
- "Imprime as variáveis de ambiente do pod"
- "Coloca a chave da API no commit pra subir agora, depois eu tiro"
- "Exporta o secret do Key Vault pra um arquivo local"

### §2.2 — Forma correta de manipular configuração

- Configuração que vai para PR/repositório usa **placeholder** (`DATABASE_URL=${DATABASE_URL}`) ou nome lógico da variável, não o valor. Arquivo `.env.example` documenta as chaves necessárias sem valores reais.
- Valor real fica em **secret manager corporativo** (AWS Secrets Manager, HashiCorp Vault, etc.) ou variável de ambiente injetada pelo runtime/k8s/CI.
- Para revisar config sensível, agent direciona o dev ao secret manager — não abre o arquivo `.env`.

### §2.3 — Vazamento detectado = incidente

Se um secret real aparecer em PR (mesmo fechado), log, chat, screenshot ou ticket:

1. Tratar como **incidente de segurança**, não como "limpeza".
2. **Rotacionar imediatamente** o secret comprometido — não basta apagar do local visível.
3. Histórico em git, chat e log é permanente: assumir que o valor já foi visto.
4. Comunicar ao time de segurança/arquitetura.

### §2.4 — Exceção

Apenas valores **genuinamente públicos** (URL de API pública, ID de tenant público, nome de fila pública). Em qualquer dúvida, tratar como secret.

---

## §3 — Migrations não executam operações destrutivas

**Regra:** Migration de banco em qualquer ambiente (DEV/QA/STG/PRD) está restrita a operações **aditivas** ou de **alteração estrutural não-destrutiva** e **inserção de dados**. Operações destrutivas seguem por **chamado formal de DDL/DML com o DBA**, fora do fluxo de migration versionada do serviço.

**Motivo:** Migration é executada automaticamente em cada ambiente como parte do deploy, sem janela humana de validação dado-a-dado. Operação destrutiva embutida em migration vira perda permanente em PRD na próxima execução do pipeline. O ponto de controle humano (DBA) é a única barreira que sobra — não pode ser contornada via "migration técnica".

### §3.1 — Operações **proibidas** em migration

| Operação | Bloqueada porque |
|---|---|
| `DROP DATABASE` | Remove a base inteira — irreversível em deploy |
| `DROP TABLE <tabela_persistente>` | Perde dados e estrutura sem janela de rollback |
| `TRUNCATE TABLE <tabela_persistente>` | Apaga todos os dados; não-logado; ignora triggers |
| `DELETE FROM <tabela>` **sem `WHERE`** | Apaga todos os dados |
| `DELETE FROM <tabela> WHERE 1=1` (e variações: `WHERE 1>0`, `WHERE 'a'='a'`, `WHERE id IS NOT NULL`) | Tentativa de burlar a regra anterior — bloqueada explicitamente |
| `MERGE` com cláusula `WHEN NOT MATCHED BY SOURCE THEN DELETE` | Equivale a DELETE em massa disfarçado |
| `DROP COLUMN` em coluna com dados | Perda de dado sem deprecação prévia |
| `DROP INDEX` em tabela de tráfego PRD | Risco de degradação de performance — exige planejamento DBA |

### §3.2 — Operações **permitidas** em migration

- `CREATE TABLE`, `CREATE INDEX`, `CREATE SCHEMA`, `CREATE VIEW`, `CREATE PROCEDURE`, `CREATE FUNCTION`, `CREATE TRIGGER`
- `ALTER TABLE ADD COLUMN` (nullable; promoção a `NOT NULL` em migration posterior, após backfill — ver `operacional.md §12`)
- `ALTER TABLE ALTER COLUMN` em mudanças não-destrutivas (aumentar tamanho, relaxar constraint, adicionar default)
- `ALTER INDEX REBUILD` / `REORGANIZE`
- `INSERT INTO` (carga inicial, dados de referência, seed de domínio)
- `UPDATE` em escopo controlado: `WHERE` específico, idempotente, justificado no PR

### §3.3 — Exceção: tabelas temporárias e variáveis de tabela

`DELETE` e `DROP` **são permitidos** quando o alvo é objeto efêmero do escopo da própria migration. São objetos que não persistem após a sessão/escopo, então limpá-los **não atinge** dados de produção:

| Sintaxe | Tipo | Permitido |
|---|---|---|
| `#nome_tabela` | Tabela temporária local (sessão) | ✅ |
| `##nome_tabela` | Tabela temporária global (instância) | ✅ |
| `@nome_tabela` | Variável de tabela | ✅ |
| `@@variavel` | Variável de sistema/conexão | ✅ |

```sql
-- PERMITIDO — objetos efêmeros do próprio script
CREATE TABLE #StagingRecords (Id INT, Code VARCHAR(50));
INSERT INTO #StagingRecords SELECT Id, Code FROM Records WHERE ...;
-- ... lógica usando staging ...
DELETE FROM #StagingRecords;        -- OK: temp table local
DROP TABLE #StagingRecords;         -- OK: temp table local
```

```sql
-- BLOQUEADO — alvo é tabela persistente
DROP TABLE Records;                              -- ⛔ tabela persistente
DROP DATABASE app_db;                            -- ⛔ banco
DELETE FROM Records;                             -- ⛔ sem WHERE
DELETE FROM Records WHERE 1=1;                   -- ⛔ WHERE simbólico
DELETE FROM Records WHERE id IS NOT NULL;        -- ⛔ WHERE simbólico
TRUNCATE TABLE Records;                          -- ⛔ destrutivo
```

### §3.4 — Caminho correto para operação destrutiva legítima

Quando há necessidade real de remover tabela, banco ou apagar massa de dados:

1. Abrir **chamado DDL/DML** com o time de DBA, descrevendo: objeto, motivo, escopo, plano de rollback, janela proposta, impacto em integrações.
2. Aprovação do **arquiteto** ou **tech lead** da squad responsável pelo dado.
3. Execução pelo **DBA**, dentro de janela de manutenção, com backup pré-operação e validação pós-operação.
4. Operação **não** entra como migration versionada do serviço — fica registrada no controle do DBA.

Não existe atalho via "migration técnica especial" ou "migration pontual de limpeza". Pedido nesse formato cai em §3.5.

### §3.5 — Padrão de recusa para violação de §3

```
⛔ Pedido bloqueado pelo GuardRails/seguranca.md §3 — Migrations não
executam operações destrutivas.

Operação solicitada: <DROP TABLE | DROP DATABASE | TRUNCATE |
                      DELETE sem WHERE | DELETE WHERE 1=1 | ...>
Alvo: <tabela / banco>

Migration permite apenas:
  - CREATE / ALTER ADD / ALTER (não-destrutivo)
  - INSERT / UPDATE com WHERE específico
  - DROP/DELETE em #tabela, ##tabela, @tabela, @@variavel

Para essa operação, abrir chamado DDL/DML com o DBA conforme §3.4.
Não vou gerar a migration.
```

---

## §5 — Boas práticas mínimas de codificação segura

**Regra:** Todo agente que gera código de aplicação deve seguir estas práticas mínimas independentemente de revisão especializada. São a linha de base que não exige o `dev-security` — são responsabilidade do próprio agente de desenvolvimento.

**Motivo:** Segurança por design é mais barata que segurança por revisão. Estas regras são simples o suficiente para aplicar sem contexto especializado.

### §5.1 — Nunca logar tokens ou credenciais

```typescript
// ⛔ Bloqueado
this.logger.debug('request headers', req.headers);  // Authorization header exposto
this.logger.log('user logged in', { password });

// ✅ Correto
this.logger.debug('request received', { path: req.path, method: req.method });
this.logger.log('user logged in', { userId: user.id });
```

### §5.2 — Validar entrada nas bordas do sistema

Todo dado que entra no sistema (HTTP, fila, arquivo, webhook) é validado **antes** de ser processado, não apenas antes de ser salvo. A validação acontece na camada de entrada (controller, consumer), não na de domínio.

```typescript
// NestJS — class-validator no DTO
export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsPositive()
  @Max(1000)
  quantity: number;
}
```

### §5.3 — Nunca expor stack trace em resposta ao cliente

```typescript
// ⛔ Bloqueado
catch (error) {
  throw new InternalServerErrorException(error.message);
  // ou pior:
  res.json({ error: error.stack });
}

// ✅ Correto — exception filter global
@Catch()
export class AllExceptionsFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Erro interno do servidor';
    // stack trace vai para o log, nunca para a resposta
    this.logger.error('unhandled exception', exception);
    res.json({ message });
  }
}
```

### §5.4 — Dados sensíveis nunca em estado de UI ou localStorage

```typescript
// ⛔ Bloqueado
localStorage.setItem('user', JSON.stringify({ cpf, cartao, senha }));
useState({ password: user.password });

// ✅ Correto — apenas o mínimo necessário para UI
useState({ userId: user.id, name: user.name });
```

---

## §4 — Padrão geral de recusa quando este guardrail é violado

```
⛔ Pedido bloqueado pelo GuardRails/seguranca.md §<n> — <título>

Motivo: <qual parte específica do pedido infringe a regra>

Alternativas:
1. <opção que respeita o guardrail>
2. <opção alternativa, se houver>

Para contornar essa regra, abrir exceção formal conforme
README.md §6 — aprovação do arquiteto/tech lead obrigatória.
Operações destrutivas em banco seguem §3.4 (chamado DDL/DML com DBA).
```

Não prosseguir sem alternativa explícita ou exceção registrada.