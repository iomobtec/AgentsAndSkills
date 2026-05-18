# GuardRails — Processo

Regras de **fluxo de trabalho, Git e code review** aplicadas a todo desenvolvimento conduzido por agente. Complementa `00-core.md` — não substitui. Regras de **bloqueio de PR por branch desatualizada** vivem em `operacional.md §1` — não são repetidas aqui. Carregado por: todos os agents.

---

## §1 — Nomenclatura de branch padronizada

**Regra:** Toda branch de trabalho segue o padrão: `<tipo>/<ticket>-<descrição-curta>` com kebab-case. Se não houver ticket, usar `<tipo>/sem-ticket-<descrição>`. Branch `main`/`master` nunca recebe commit direto — sempre via PR.

**Motivo:** Branch sem padrão torna rastreabilidade impossível — não dá para saber o que uma branch faz, a qual tarefa pertence ou quem a criou. Commit direto em `main` bypassa revisão e CI.

### §1.1 — Tipos aceitos

| Tipo | Quando usar |
|---|---|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `chore/` | Manutenção, atualização de dep, configuração |
| `refactor/` | Refatoração sem mudança de comportamento |
| `docs/` | Documentação |
| `test/` | Adição/correção de testes sem mudar código |
| `hotfix/` | Correção urgente direto para produção |

### §1.2 — Exemplos

```
feat/PROJ-123-user-authentication
fix/PROJ-456-login-redirect-loop
chore/sem-ticket-upgrade-node-18
```

---

## §2 — Mensagens de commit no padrão Conventional Commits

**Regra:** Toda mensagem de commit segue o formato **Conventional Commits**: `<tipo>(<escopo opcional>): <descrição no imperativo>`. Descrição em minúsculas, sem ponto final, máximo 72 caracteres na primeira linha. Corpo opcional separado por linha em branco.

**Motivo:** Mensagem padronizada permite geração automática de changelog, facilita `git bisect` e torna o histórico legível como documentação — "o que mudou e por quê" fica rastreável sem precisar abrir o diff.

### §2.1 — Exemplos

```
feat(auth): add JWT refresh token rotation
fix(checkout): prevent double submission on slow connection
chore(deps): upgrade jest to v29
refactor(user): extract address validation to separate module
test(order): add integration tests for cancellation flow
```

### §2.2 — Bloqueado

```
// ⛔ mensagens sem tipo
git commit -m "arrumei o bug"
git commit -m "WIP"
git commit -m "changes"
git commit -m "."

// ⛔ mensagens com capitalização e ponto final inconsistentes
git commit -m "Fix: Login Bug."
```

---

## §3 — PR com escopo limitado e descrição obrigatória

**Regra:** Pull Request deve ter: (1) **título** seguindo Conventional Commits, (2) **descrição** com "o que muda" e "por que muda", (3) **escopo limitado** — um PR, uma responsabilidade. PR com mais de ~400 linhas de diff útil deve ser justificado ou dividido.

**Motivo:** PR grande é PR que não é revisado com cuidado — o revisor perde o contexto, aprova por fadiga e o código entra sem revisão real. PR sem descrição força o revisor a reconstruir o contexto lendo o código — tempo do revisor desperdiçado.

### §3.1 — Template mínimo de descrição

```markdown
## O que muda
- <mudança 1>
- <mudança 2>

## Por que muda
<contexto da decisão — ticket, requisito, incidente>

## Como testar
1. <passo 1>
2. <passo 2>
```

### §3.2 — Exceções para PR grande

PR grande é aceito quando a natureza da mudança não permite divisão (ex.: refatoração de módulo interdependente, migração de biblioteca). Nesse caso, o PR deve ter descrição explicando por que não foi dividido.

---

## §4 — Sem auto-merge

**Regra:** O desenvolvedor **não aprova nem faz merge do próprio PR**, exceto em projetos explicitamente configurados sem processo de revisão (documentado no `CLAUDE.md` do projeto). Em todo caso, CI deve estar verde antes do merge.

**Motivo:** Auto-merge elimina a última barreira entre código sem revisão e produção. A revisão existe para pegar o que o autor não vê — o próprio autor é o pior revisor do próprio código.

---

## §5 — Definition of Ready (DoR) antes de iniciar desenvolvimento

**Regra:** Antes de iniciar implementação de uma tarefa/história, os critérios abaixo devem estar satisfeitos. Se algum estiver ausente, o agent **pergunta** antes de avançar — nunca assume interpretação.

### §5.1 — Checklist DoR mínimo

- [ ] Critérios de aceite definidos e não ambíguos
- [ ] Dependências identificadas (APIs externas, serviços, schemas)
- [ ] Escopo delimitado — o que **não** está no escopo está declarado
- [ ] Contrato de API definido quando há integração (request/response shapes)
- [ ] Dados de entrada e saída conhecidos

Se algum item está ausente, o agent emite:

```
⚠️ Item(s) do DoR ausente(s) — preciso confirmar antes de começar:

  - <item faltando e qual informação específica é necessária>

Com essas informações, posso prosseguir com segurança.
```

---

## §6 — Definition of Done (DoD) antes de abrir PR

**Regra:** Antes de abrir Pull Request, os critérios abaixo devem estar satisfeitos. O agent verifica cada um e bloqueia a criação do PR se algum falhar.

### §6.1 — Checklist DoD mínimo

- [ ] Todos os critérios de aceite da tarefa implementados
- [ ] Testes unitários passando nos módulos alterados (`operacional.md §2`)
- [ ] Branch atualizada com `master`/`main` (`operacional.md §1`)
- [ ] Sem secret ou dado pessoal exposto no diff (`seguranca.md §1`, `seguranca.md §2`)
- [ ] Sem `console.log` de debug deixado no código
- [ ] Sem código comentado sem justificativa
- [ ] PR tem descrição preenchida (`§3.1`)

---

## §7 — Não reescrever histórico de commits em branch compartilhada

**Regra:** `git push --force`, `git rebase` reescrevendo commits já publicados, e `git commit --amend` de commit já pushed são proibidos em branches compartilhadas (`main`, `master`, branches de release, branches de feature colaborativas). Em branch de trabalho individual, rebase e amend são aceitos antes de abrir o PR.

**Motivo:** Reescrita de histórico em branch compartilhada destrói o histórico de outros desenvolvedores que fizeram checkout ou estão baseados naquela branch. `git push --force` sobre `main` pode perder commits de outros sem aviso.

### §7.1 — Confirmação obrigatória

Qualquer pedido de `--force` ou rebase reescrevendo commits já publicados dispara confirmação de `00-core.md §3` antes de executar.
