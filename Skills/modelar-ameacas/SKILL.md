# Skill: modelar-ameacas

**Agente:** `dev-security`, `arquiteto`  
**Quando usar:** Após o arquiteto definir os componentes de um microsserviço (endpoints, eventos, dados, integrações). Executar antes do início do desenvolvimento para identificar controles obrigatórios por camada.  
**Output:** `plans/dev-security/<ticket>-threat-model.md`

---

## Processo

### Passo 1 — Inventariar superfície de ataque

Listar todos os componentes que receberão entrada externa ou processarão dados sensíveis:

```
Para cada componente, identificar:
- Tipo: endpoint REST | consumer de evento | formulário de UI | webhook | upload
- Dados de entrada: quais campos, de quem vêm (usuário, sistema externo, fila)
- Dados de saída: o que retorna, para quem
- Dados persistidos: tabelas, campos, sensibilidade (PII? financeiro? credencial?)
- Integrações: sistemas externos chamados, serviços internos dependentes
```

### Passo 2 — Aplicar STRIDE por componente

Para cada componente listado no Passo 1, responder as 6 perguntas STRIDE:

| Ameaça | Pergunta a responder |
|---|---|
| **S**poofing | Um atacante pode se passar por usuário legítimo ou sistema confiável para acessar este componente? |
| **T**ampering | Um atacante pode modificar dados em trânsito (request/response) ou em repouso (banco, fila) para alterar o comportamento? |
| **R**epudiation | Um usuário pode executar uma ação e depois negar que a executou? Há audit trail suficiente? |
| **I**nformation Disclosure | Dados sensíveis podem vazar na response, nos logs, em mensagens de erro ou em headers? |
| **D**enial of Service | Um atacante pode tornar este componente indisponível ou degradar seu desempenho enviando requisições fabricadas? |
| **E**levation of Privilege | Um usuário comum pode ganhar acesso a dados ou ações que deveriam ser restritas a outro papel? |

### Passo 3 — Classificar risco

Para cada ameaça identificada como presente (Passo 2), classificar a severidade:

| Severidade | Critério |
|---|---|
| 🔴 CRITICAL | Exploração direta possível sem autenticação, ou com credenciais de usuário comum: RCE, SQL injection, acesso a dados de outros usuários |
| 🟠 HIGH | Exploração requer contexto específico mas o vetor está claro: IDOR com conta válida, JWT sem exp, XSS stored |
| 🟡 MEDIUM | Endurecimento necessário, mas exploração é difícil ou requer várias condições favoráveis: falta de rate limit em endpoint não-crítico, log com campo sensível |
| 🟢 LOW | Melhoria defensiva sem impacto direto: header de segurança ausente mas com CSP configurado, campo de log desnecessário mas não PII |

### Passo 4 — Definir controles obrigatórios

Para cada ameaça CRITICAL ou HIGH, definir o controle específico que deve ser implementado:

```
Controle deve incluir:
- O que implementar (ex: "@Throttle(5, 60) no endpoint de login")
- Por qual agente (dev-backend, dev-frontend, dev-bff)
- Referência ao guardrail (ex: appsec.md §12 — Rate limiting)
- Como verificar que foi implementado (critério testável)
```

### Passo 5 — Produzir o arquivo de threat model

Criar `plans/dev-security/<ticket>-<funcionalidade>-threat-model.md` com o template abaixo:

```markdown
# Threat Model — <ticket> — <funcionalidade>

**Data:** <data>
**Analista:** dev-security
**Baseado em:** spec do arquiteto + Guidelines/security/README.md

---

## Componentes analisados

| Componente | Tipo | Dados sensíveis | Integração externa |
|---|---|---|---|
| `POST /auth/login` | endpoint REST | email, senha | — |
| `OrderConsumer` | event consumer | userId, valor, PII do endereço | — |

---

## Riscos identificados

| Severidade | Componente | Ameaça STRIDE | Descrição | Controle necessário |
|---|---|---|---|---|
| 🔴 CRITICAL | `POST /auth/login` | D — DoS | Sem rate limit → brute force | `@Throttle(5, 60)` no endpoint |
| 🟠 HIGH | `GET /orders/:id` | E — Elev. Priv. | Sem verificação de ownership | Filtrar por `userId` do JWT |
| 🟡 MEDIUM | `OrderConsumer` | I — Info Disc. | Endereço completo nos logs | Mascarar endereço no log |

---

## Controles obrigatórios por agente de dev

### dev-backend
- [ ] Rate limit `@Throttle(5, 60)` no `POST /auth/login` — `appsec.md §12`
- [ ] Verificação de ownership em `GET /orders/:id`: `WHERE userId = req.user.id` — `appsec.md §4`
- [ ] Audit log em login bem-sucedido e falho com IP + userId — `appsec.md §9`

### dev-frontend
- [ ] (nenhum controle crítico identificado nesta entrega)

### dev-bff
- [ ] JWT validado antes de repassar ao upstream — `appsec.md §2`

---

## Riscos residuais aceitos

| Risco | Motivo de aceitação | Revisar em |
|---|---|---|
| <risco> | <justificativa de negócio ou técnica> | <data ou milestone> |

---

## Referências

- `Guardrails/appsec.md`
- `Guidelines/security/README.md §2` — Metodologia STRIDE
```

### Passo 6 — Reportar ao tech-lead

Após produzir o arquivo, reportar ao orquestrador com:

```
✅ Threat model concluído: plans/dev-security/<ticket>-threat-model.md

Resumo de riscos:
- 🔴 CRITICAL: <qtd> — <lista curta dos vetores>
- 🟠 HIGH: <qtd> — <lista curta>
- 🟡 MEDIUM: <qtd>

Controles obrigatórios que devem ser incluídos nos planos de dev:
- dev-backend: <lista de controles>
- dev-frontend: <lista de controles>
- dev-bff: <lista de controles>

Recomendação: tech-lead inclui os controles obrigatórios nas seções §2 ou §4.7
dos planos gerados pelo gerar-plano-tarefa para cada agente de dev.
```

---

## Anti-padrões bloqueados

- Marcar ameaça como "Não se aplica" sem justificativa — toda ameaça deve ter resposta explícita
- Definir controle vago ("implementar autenticação") em vez de específico ("JWT com exp=15min via JwtModule")
- Omitir componentes de UI do threat model — formulários e telas têm superfície de ataque (XSS, CSRF)
- Produzir threat model sem listar responsável por cada controle
