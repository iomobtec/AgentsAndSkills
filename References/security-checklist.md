# Checklist de Segurança — OWASP Top 10 2025

> Uso: durante desenvolvimento ou code review. Aplicar conforme a camada sendo revisada.
> Severidade: **CRITICAL** = bloqueia PR | **HIGH** = corrigir antes de produção | **MEDIUM** = corrigir no próximo ciclo

---

## Backend (.NET / Node.js)

### Injeção
- [ ] **[CRITICAL]** Queries SQL usam parâmetros (`@param`, ORM) — sem concatenação de string com input do usuário
- [ ] **[CRITICAL]** Queries NoSQL não expõem operadores (`$where`, `$regex`) a partir de input externo
- [ ] **[CRITICAL]** Chamadas a processos externos (`exec`, `spawn`) não incluem input do usuário sem sanitização
- [ ] **[HIGH]** Input é validado e rejeitado na entrada — não apenas sanitizado antes de usar

### Autenticação e JWT
- [ ] **[CRITICAL]** JWT valida `exp` — tokens expirados são rejeitados
- [ ] **[CRITICAL]** Algoritmo do JWT fixado no servidor (`RS256`/`ES256`) — não aceita `alg: none` ou algoritmo do header
- [ ] **[HIGH]** Refresh tokens têm rotação e revogação — token antigo invalidado ao emitir novo
- [ ] **[HIGH]** Senhas armazenadas com bcrypt/Argon2 — sem MD5, SHA1 ou hash reversível
- [ ] **[MEDIUM]** Rate limit em endpoints de autenticação — previne brute force

### Exposição de Dados
- [ ] **[CRITICAL]** Respostas de API usam DTOs — entidades de domínio não são serializadas diretamente
- [ ] **[HIGH]** Stack traces não vazam em respostas de erro em produção (`NODE_ENV=production`, middleware de erro)
- [ ] **[HIGH]** Logs não registram dados sensíveis: senhas, tokens, CPF, cartão de crédito
- [ ] **[MEDIUM]** Campos sensíveis mascarados em logs de auditoria (ex: `****1234`)

### Controle de Acesso
- [ ] **[CRITICAL]** IDOR verificado: acesso a recurso valida que o recurso pertence ao usuário autenticado
- [ ] **[CRITICAL]** RBAC aplicado nos endpoints — não apenas na UI
- [ ] **[HIGH]** Nenhum endpoint admin acessível sem role explícita — sem "segurança por obscuridade"

### Configuração e Infraestrutura
- [ ] **[HIGH]** `helmet` (Node) ou headers equivalentes configurados: `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`
- [ ] **[HIGH]** CORS configurado com whitelist de origens — sem `origin: *` em produção
- [ ] **[HIGH]** Rate limiting global no gateway/BFF — protege todos os endpoints
- [ ] **[MEDIUM]** Dependências verificadas contra CVEs conhecidos — `npm audit` / `dotnet list package --vulnerable`

### SSRF
- [ ] **[HIGH]** URLs fornecidas por usuários são validadas contra allowlist de domínios antes de fazer requisição
- [ ] **[HIGH]** Respostas de URLs externas não são repassadas diretamente ao cliente sem validação

### Tratamento de Erros
- [ ] **[HIGH]** Blocos `catch` vazios inexistentes — toda exceção é logada ou tratada intencionalmente
- [ ] **[HIGH]** Falha segura: em caso de erro de autorização, nega acesso (fail secure, não fail open)
- [ ] **[MEDIUM]** Mensagens de erro ao cliente são genéricas — detalhes internos ficam apenas no log

### Logging de Segurança
- [ ] **[HIGH]** Falhas de autenticação e autorização são logadas com contexto (usuário, IP, recurso)
- [ ] **[MEDIUM]** Ações críticas (criação, exclusão, alteração de permissão) têm log de auditoria

---

## Frontend (React / Next.js)

- [ ] **[CRITICAL]** `dangerouslySetInnerHTML` não usado com input do usuário — substituir por sanitização (DOMPurify) ou renderização segura
- [ ] **[CRITICAL]** `href` dinâmico valida protocolo — bloqueia `javascript:` e `data:` URIs
- [ ] **[HIGH]** Tokens de autenticação armazenados em cookie `httpOnly` e `Secure` — não em `localStorage` ou `sessionStorage`
- [ ] **[HIGH]** Dados sensíveis não persistidos no `localStorage` (CPF, dados de pagamento)
- [ ] **[MEDIUM]** Formulários com mutações de estado incluem proteção CSRF (token ou SameSite cookie)
- [ ] **[MEDIUM]** `Content-Security-Policy` configurado via headers — sem `unsafe-inline` desnecessário

---

## BFF (NestJS / API Gateway)

- [ ] **[CRITICAL]** JWT validado no BFF — não confia em claims sem verificar assinatura
- [ ] **[HIGH]** PII (CPF, e-mail, telefone) não registrado em logs de request/response do BFF
- [ ] **[HIGH]** Respostas de serviços internos filtradas antes de enviar ao cliente — sem passthrough cego
- [ ] **[HIGH]** Timeouts configurados para todas as chamadas a serviços upstream — sem espera indefinida
- [ ] **[MEDIUM]** Headers sensíveis de resposta dos serviços internos removidos antes de repassar ao frontend

---

## API Security (OWASP API Top 10 2023)

> Aplicar para qualquer PR que toca endpoints REST, BFF ou integrações com APIs externas.

### Object & Property Authorization

- [ ] **[CRITICAL]** BOLA verificado: operações por ID incluem `userId: req.user.id` no WHERE — nenhum usuário acessa objeto de outro (`appsec.md §4`, API1)
- [ ] **[HIGH]** Nenhum `@Body() body: any` — DTOs de input com campos explícitos, sem campos privilegiados (`role`, `isAdmin`) acessíveis ao usuário (`appsec.md §14`, API3)
- [ ] **[HIGH]** Respostas usam `ResponseDto` com `plainToInstance` — entidade Prisma bruta nunca retornada ao cliente (`appsec.md §14`, API3)

### Function Level Authorization

- [ ] **[HIGH]** Funções sensíveis (admin, bulk, export, alteração de permissão) têm `@Roles` declarado individualmente (`appsec.md §15`, API5)
- [ ] **[HIGH]** Existe teste HTTP 403 para usuário sem role tentando acessar endpoint administrativo (`appsec.md §15`, API5)

### Business Flows & Resource Consumption

- [ ] **[HIGH]** Fluxos de compra, reserva e uso de recurso limitado têm rate limit específico além do global (`appsec.md §16`, API6)
- [ ] **[MEDIUM]** Cupons e vouchers têm limite de uso por conta, não apenas por IP (`appsec.md §16`, API6)

### API Inventory

- [ ] **[MEDIUM]** Todo endpoint novo tem `@ApiOperation` e `@ApiResponse` no Swagger — atualizado no mesmo PR (`appsec.md §17`, API9)
- [ ] **[MEDIUM]** Nenhuma variável de ambiente de produção (`JWT_SECRET`, `DATABASE_URL`) reutilizada em staging (`appsec.md §17`, API9)

### External API Consumption

- [ ] **[HIGH]** Dados de APIs externas validados com DTO + class-validator antes de persistir ou usar (`appsec.md §18`, API10)
- [ ] **[HIGH]** Toda chamada a API externa tem `timeout` (máximo 10s) e `maxContentLength` configurados (`appsec.md §18`, API10)
- [ ] **[MEDIUM]** Respostas de APIs externas mapeadas para DTO interno antes de repassar ao cliente — sem passthrough (`appsec.md §18`, API10)

---

## Referências

- `Guardrails/appsec.md` — regras de segurança obrigatórias na Junto
- `Guidelines/security/README.md` — guia completo de segurança de aplicação
- OWASP Top 10: https://owasp.org/Top10/
- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x00-header/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
