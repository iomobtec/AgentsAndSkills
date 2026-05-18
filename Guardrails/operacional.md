# GuardRails — Operacional

Regras de **disciplina de Pull Request e qualidade de testes** aplicadas a todo desenvolvimento conduzido por agente. O guardrail ainda está em construção — outras regras (logging, monitoramento, deploy, ambientes) podem ser adicionadas conforme o time as definir.

---

## §1 — Não criar PR com a branch desatualizada em relação à `master`

**Regra:** Antes de abrir Pull Request, a branch de trabalho deve estar **atualizada** com a `master` remota (`origin/master`). Se houver qualquer commit em `master` que não esteja na branch, o agent **não cria o PR** — avisa o desenvolvedor para atualizar primeiro.

**Motivo:** PR aberto sobre branch desatualizada entrega contexto incorreto ao revisor (diff misturado com mudanças que já estão na master), pode passar localmente e quebrar quando alinhar com a master, e mascara conflitos que só aparecem no merge final. Atualizar antes do PR é o ponto de fricção mais barato — atualizar no meio da revisão é o mais caro.

### §1.1 — Como o agent verifica

Antes de criar o PR, o agent executa:

```bash
git fetch origin master
git rev-list --count HEAD..origin/master
```

- Resultado `0` → branch está atualizada → seguir para §2.
- Resultado `> 0` → branch está atrás → bloquear criação do PR.

### §1.2 — Padrão de aviso ao desenvolvedor

```
⚠️ Sua branch está <N> commit(s) atrás da master.

Não vou criar o PR enquanto a branch não estiver atualizada.

Atualize com um dos comandos abaixo, conforme a política da sua squad:

  git fetch origin
  git rebase origin/master        # preferencial, mantém histórico linear
  # ou
  git merge origin/master         # se a squad usa merge

Resolva conflitos se houver, valide os testes (§2) e me peça
para criar o PR novamente.
```

### §1.3 — Exceção

Não há exceção via guardrail. Se a squad tem fluxo específico (ex.: PR contra branch de feature, não contra master), isso fica documentado no `CLAUDE.md` do projeto e o agent segue a regra de **branch base correta** — mas a base sempre estará atualizada.

---

## §2 — Não criar PR com testes unitários do projeto alterado em falha

**Regra:** Antes de abrir Pull Request, **todos os testes unitários dos projetos que o desenvolvedor alterou** devem estar passando. Se houver qualquer teste em falha, o agent **não cria o PR** — avisa o desenvolvedor e, para cada teste em falha que **já existia antes** das alterações, dispara o fluxo de §3.

**Motivo:** PR com teste vermelho é PR que volta — desperdiça tempo de revisor, gasta minutos de CI à toa, e cria a tentação de "merge depois eu arrumo". A garantia mínima de aceite é: o que eu mexi não pode estar quebrado.

### §2.1 — Escopo (qual teste rodar)

- **Apenas** os projetos de teste que cobrem código alterado pelo desenvolvedor.
- **Não** rodar a solução inteira: testes de áreas não tocadas não bloqueiam o PR (podem estar quebrados por outros motivos, fora do escopo desta entrega).
- Critério de "projeto alterado": qualquer módulo cujo código de produção (`src/`, `components/`, `pages/`, etc.) tenha arquivo modificado pela branch em relação à `origin/master`.

### §2.2 — Como o agent verifica

```bash
# Identifica módulos alterados
git diff --name-only origin/master...HEAD | <filtra src/ → mapeia para pacotes com testes>

# Roda os testes correspondentes
npm test -- --testPathPattern="<caminho-do-modulo>" --watchAll=false
# ou, com workspace:
npx jest packages/<modulo> --passWithNoTests
```

### §2.3 — Padrão de bloqueio

```
⛔ Testes unitários do(s) projeto(s) alterado(s) estão falhando.
Não vou criar o PR.

Testes em falha (<N> total):

1. <modulo-x> > <describe block> > <should do X when Y>
   Mensagem: <mensagem do framework>

2. <modulo-x> > <describe block> > <should do Y when Z>
   Mensagem: <...>
   ...

Para cada teste, vou seguir o fluxo do GuardRails/operacional.md §3
e te perguntar como proceder antes de qualquer correção.
```

### §2.4 — Exceção

Não há exceção. Teste em falha **no escopo da branch** bloqueia o PR. Se o time decidir que um teste deve ser ignorado temporariamente, isso é feito explicitamente no código (`test.skip("motivo + ticket", ...)`), com justificativa no PR — não silenciosamente pelo agent.

---

## §3 — Teste pré-existente em falha exige confirmação **por teste** antes de qualquer correção

**Regra:** Quando um teste unitário **que já existia antes** do trabalho atual passa a falhar após mudanças do desenvolvedor, o agent **não corrige automaticamente**. Para **cada** teste em falha, o agent mostra o teste, o motivo, a hipótese de causa, e **pede confirmação** ao desenvolvedor sobre o caminho a seguir — uma decisão por teste, sem ação em lote.

**Motivo:** Teste pré-existente que passa a falhar é o sinal mais confiável de **regressão** introduzida pela mudança em curso. Agent que "conserta" o teste para ele passar (ajustando assert, mockando para caber na nova implementação, marcando como skip) **mascara o bug** em vez de corrigi-lo. A decisão entre "minha mudança quebrou comportamento que devia continuar funcionando" e "mudei o comportamento de propósito, o teste precisa refletir isso" é **sempre** do desenvolvedor — nunca do agent.

### §3.1 — Distinção crítica: teste pré-existente vs teste novo

| Situação | Comportamento do agent |
|---|---|
| Teste **já existia** na branch antes do trabalho atual e passou a falhar | Aplica §3 — pergunta antes de tocar |
| Teste **novo** que o agent acabou de criar como parte da feature em desenvolvimento | Pode iterar livremente até o teste passar — é parte do TDD/desenvolvimento normal |
| Teste já existia mas estava **com `test.skip` ou ignorado** antes | Tratar como pré-existente — não des-skipar nem mexer sem perguntar |

Critério prático para distinguir: existe na `origin/master` (ou em commit anterior do trabalho)? Então é pré-existente.

### §3.2 — Como o agent verifica se o teste é pré-existente

```bash
git log origin/master --all -- <caminho-do-arquivo-de-teste>
# ou, mais preciso, para o método específico:
git blame origin/master -- <caminho-do-arquivo-de-teste>
```

Se o teste/método aparece em commit anterior ao início da branch atual, é pré-existente.

### §3.3 — Formato da pergunta (uma por teste)

Para cada teste pré-existente em falha, o agent emite:

```
⚠️ Teste pré-existente em falha — preciso da sua decisão antes de prosseguir.

  Teste:    <arquivo.test.ts > describe block > nome do teste>
  Arquivo:  <caminho>:<linha>
  Status:   passava em <último commit em que passou> → falha agora

  Mensagem do teste:
    <Expected: X | Received: Y | Error: ...>

  Provável causa (hipótese do agent):
    <descrição curta — ex.: "Função userService.update
    passou a retornar um objeto com shape diferente; o teste ainda
    espera o formato anterior no expect.">

Como devo prosseguir com este teste?

  (1) Corrigir o CÓDIGO — entender como regressão indesejada e
      restaurar o comportamento que o teste valida.

  (2) Ajustar o TESTE — entender que o comportamento mudou
      intencionalmente e atualizar o teste para refletir
      o novo contrato.

  (3) Investigar mais — pausar; me peça detalhes adicionais
      antes de decidir.

Aguardando sua decisão para este teste antes de seguir
para o próximo.
```

### §3.4 — Regras de execução do fluxo

- **Uma decisão por teste**, na ordem em que falharam. Não há "aplicar a mesma decisão para todos os testes" — cada um pode ter causa diferente.
- Agent **não pula** nem agrupa testes para acelerar.
- Após a decisão do dev em cada teste, agent executa **apenas a ação aprovada** — não vai além (ex.: se o dev aprovou "ajustar o teste", não toca em outras partes do código).
- Após resolver todos os testes pré-existentes, agent roda novamente §2 antes de seguir para criação do PR.

### §3.5 — Anti-padrões bloqueados

O agent **não** pode, sob nenhuma hipótese:

- Marcar teste pré-existente como `test.skip`, `xit`, `xtest` ou `xdescribe` para "fazer o pipeline passar".
- Comentar/remover o teste pré-existente que passou a falhar.
- Trocar o `expect` por algo mais permissivo só para passar (ex.: `expect(value).toBeDefined()` no lugar de `expect(value).toEqual(expected)`).
- Mockar/stubar dependência adicional só para o teste passar, sem o dev confirmar que isso reflete o novo design.

Se for solicitado a fazer qualquer um desses, agent recusa citando este parágrafo.

---

## §4 — Padrão geral de recusa para violação deste guardrail

```
⛔ Pedido bloqueado pelo GuardRails/operacional.md §<n> — <título>

Motivo: <qual parte específica do pedido infringe>

Próximos passos:
1. <ação concreta que o dev precisa fazer>
2. <ação alternativa, se houver>

Para contornar essa regra, abrir exceção formal conforme
README.md §6 — aprovação do arquiteto/tech lead obrigatória.
```

Não prosseguir sem a ação concreta executada ou exceção registrada.