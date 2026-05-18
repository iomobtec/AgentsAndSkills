# GuardRails — Dados

Regras de **persistência, queries e migrations**. Complementa `00-core.md` — não substitui. Operações destrutivas em banco (DROP, TRUNCATE, DELETE sem WHERE) são cobertas por `seguranca.md §3` e não são repetidas aqui. Carregado por: `dev-system`, `arquiteto`, `revisor`, `upstream`, `downstream`.

---

## §1 — Nunca concatenar valores em queries SQL

**Regra:** Queries SQL sempre usam **parâmetros vinculados** (prepared statements, placeholders do ORM/query builder). Nunca interpolar variáveis diretamente na string SQL, independentemente da origem do dado (mesmo que venha de uma fonte "confiável" interna).

**Motivo:** Concatenação SQL é o caminho mais direto para SQL injection — vulnerabilidade crítica que permite leitura, modificação e deleção arbitrária do banco. "Dado confiável" hoje pode vir de fonte não confiável amanhã.

### §1.1 — Padrões bloqueados e corretos

```typescript
// ⛔ concatenação direta
const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ⛔ template literal sem binding
const result = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ parâmetro vinculado (pg/postgres)
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ✅ ORM com método tipado (Prisma)
const user = await prisma.user.findUnique({ where: { id: userId } });

// ✅ query builder com binding (Knex)
const users = await knex('users').where({ email }).select();
```

---

## §2 — Migrations apenas aditivas ou não-destrutivas

**Regra:** Migration de banco é restrita a operações que **não apagam dado existente** nem quebram queries em produção antes do deploy do código novo. Operações destrutivas seguem o fluxo de `seguranca.md §3` — nunca entram como migration automática.

**Motivo:** Migration é executada automaticamente no pipeline, sem janela de validação humana. Operação destrutiva executada em migration = perda de dado sem possibilidade de rollback.

### §2.1 — Operações permitidas em migration

- `CREATE TABLE`, `CREATE INDEX`, `CREATE SCHEMA`
- `ALTER TABLE ADD COLUMN` — nova coluna nullable ou com default
- `ALTER TABLE ALTER COLUMN` — não-destrutivo (aumentar tamanho, relaxar constraint)
- `INSERT INTO` — dados de referência, seed, valores iniciais
- `UPDATE` com `WHERE` específico e idempotente

### §2.2 — Operações não permitidas em migration

Ver `seguranca.md §3.1` para a lista completa de operações bloqueadas e o fluxo correto para operações destrutivas legítimas.

### §2.3 — Padrão de migration com coluna NOT NULL

Adicionar coluna NOT NULL em tabela com dados existentes exige **duas** migrations separadas:

```sql
-- Migration 1: adicionar coluna nullable
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- (deploy + backfill dos dados em produção)

-- Migration 2: aplicar constraint NOT NULL após backfill
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

---

## §3 — Sempre paginar queries que retornam listas

**Regra:** Toda query que retorna coleção de registros deve ter **limite explícito** (`LIMIT`, `take`, `pageSize`). Nunca executar `SELECT * FROM tabela` sem cláusula de limite em código de produção.

**Motivo:** Tabela com poucos registros hoje pode ter milhões amanhã. Query sem limite retorna tudo, satura memória do processo, aumenta latência de forma não linear e pode derrubar o serviço.

### §3.1 — Padrão mínimo

```typescript
// ⛔ sem limite
const allUsers = await prisma.user.findMany();

// ✅ paginado
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

### §3.2 — Limites máximos recomendados

| Contexto | Limite máximo |
|---|---|
| API paginada (UI) | 100 registros por página |
| Export / batch interno | 1.000 por iteração com cursor |
| Relatório | Usar streaming ou job assíncrono |

---

## §4 — Usar transação para escritas multi-step

**Regra:** Qualquer sequência de duas ou mais operações de escrita que devem ser atômicas (todas ocorrem ou nenhuma) usa **transação explícita**. Nunca encadear writes sem transação quando a inconsistência parcial seria um bug.

**Motivo:** Falha entre dois writes sem transação deixa o banco em estado parcialmente atualizado — inconsistência silenciosa que só aparece quando o sistema tenta usar o dado.

### §4.1 — Exemplo com Prisma

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId: orderData.productId },
    data: { quantity: { decrement: orderData.quantity } },
  });
});
```

---

## §5 — Índice em colunas de busca e chaves estrangeiras

**Regra:** Ao criar tabela ou adicionar coluna, criar índice explícito em: (1) toda chave estrangeira (`FOREIGN KEY`), (2) toda coluna usada em cláusula `WHERE` em queries frequentes, (3) toda coluna usada em `ORDER BY` em queries paginadas. Não criar índice em coluna sem query que o use.

**Motivo:** Foreign key sem índice causa full scan na tabela filha em cada join ou delete na tabela pai — degrada performance de forma silenciosa e não linear conforme o volume cresce.

---

## §6 — Soft delete para registros com significado de negócio

**Regra:** Registros que representam entidades de negócio com histórico (usuários, pedidos, transações, contratos) são **soft deleted** — campo `deletedAt` timestamp ou `status: 'inactive'`. Hard delete (`DELETE FROM`) é reservado para dados técnicos descartáveis (sessões expiradas, tokens usados, logs de debug rotacionados).

**Motivo:** Hard delete é permanente e impede auditoria retroativa. Em domínios com rastreabilidade obrigatória (financeiro, saúde, legal), hard delete de dado de negócio pode ser violação de obrigação regulatória.

### §6.1 — Consequências do soft delete

- Queries de listagem devem filtrar `WHERE deleted_at IS NULL` por padrão
- ORM deve ter scope/middleware global que aplica o filtro automaticamente
- Admin/auditoria pode consultar registros deletados com filtro explícito

---

## §7 — Não buscar mais colunas do que o necessário

**Regra:** Queries selecionam apenas as colunas necessárias para o caso de uso. Evitar `SELECT *` ou equivalente ORM (`findMany()` sem `select`) quando apenas um subconjunto de campos é usado.

**Motivo:** `SELECT *` transfere dados desnecessários entre banco e aplicação, impede otimização por index-only scan, e expõe acidentalmente colunas sensíveis em logs de query.
