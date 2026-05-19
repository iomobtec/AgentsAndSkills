# Guidelines — Security / Application Security

Guia de referência para segurança de aplicação: OWASP Top 10, modelagem de ameaças, padrões de autenticação/autorização e secure coding por camada. Usado pelo agente `dev-security` e consultado por `tech-lead` e `arquiteto`.

---

## 1. OWASP Top 10 2025 — Referência rápida com contexto de stack

| # | Categoria | Vetor principal | Guardrail |
|---|---|---|---|
| A01 | Broken Access Control | IDOR, privilege escalation, missing authz, CORS mal configurado | `appsec.md §4` |
| A02 | Security Misconfiguration | CORS aberto, headers ausentes, defaults inseguros, verbose errors | `appsec.md §5` |
| A03 | Software Supply Chain Failures | CVEs em npm, pacotes comprometidos, scripts postinstall maliciosos | `appsec.md §8`, `appsec.md §11` |
| A04 | Cryptographic Failures | PII exposta, hash fraco (MD5/SHA1), TLS fraco, secrets em código | `appsec.md §3`, `seguranca.md §1` |
| A05 | Injection | SQL, NoSQL, command, template, XSS (CWE-79 incluído) | `appsec.md §1`, `appsec.md §6` |
| A06 | Insecure Design | Ausência de threat model, lógica de negócio sem controles de segurança | `appsec.md` (todo) |
| A07 | Authentication Failures | JWT sem exp, senha fraca, session fixation, brute force sem rate limit | `appsec.md §2` |
| A08 | Software or Data Integrity Failures | CI/CD sem verificação de integridade, artefatos não assinados | `appsec.md §11` |
| A09 | Security Logging and Alerting Failures | Ausência de audit trail, logs insuficientes, alertas sem ação | `appsec.md §9`, `seguranca.md §5` |
| A10 | Mishandling of Exceptional Conditions | Erros silenciados, falha aberta, DoS por exceção, stack trace exposto | `appsec.md §13` |

> **SSRF** foi removido do Top 10 2025 como categoria isolada, mas permanece como vetor relevante — coberto em `appsec.md §10` como controle adicional.

---

## 2. Modelagem de ameaças — Metodologia STRIDE

O `dev-security` usa STRIDE para analisar cada componente antes do início do desenvolvimento. O output é o arquivo `plans/dev-security/<ticket>-threat-model.md`.

### 2.1 — Categorias STRIDE

| Letra | Ameaça | Pergunta | Controle típico |
|---|---|---|---|
| **S** | Spoofing | Um atacante pode se passar por outro usuário ou sistema? | Autenticação forte (JWT + refresh rotation) |
| **T** | Tampering | Um atacante pode modificar dados em trânsito ou em repouso? | HTTPS, assinatura de payload, integridade de DB |
| **R** | Repudiation | Um usuário pode negar ter executado uma ação? | Audit log com userId, IP, timestamp não-repudiável |
| **I** | Information Disclosure | Dados sensíveis podem vazar para quem não deveria vê-los? | DTOs restritos, mascaramento PII, logs sem secrets |
| **D** | Denial of Service | Um atacante pode tornar o sistema indisponível? | Rate limiting, payload size limit, circuit breaker |
| **E** | Elevation of Privilege | Um usuário pode ganhar permissões que não possui? | RBAC rigoroso, verificação de ownership, mínimo privilégio |

### 2.2 — Template de threat model por componente

```markdown
## Componente: <nome> (<tipo: endpoint | event consumer | BFF route | UI form>)

### Fluxo de dados
<entrada> → <processamento> → <saída/efeito>

### Análise STRIDE

| Ameaça | Presente? | Descrição | Controle necessário | Responsável |
|---|---|---|---|---|
| Spoofing    | ✅ Sim / ❌ Não | | | dev-backend / dev-security |
| Tampering   | ✅ Sim / ❌ Não | | | |
| Repudiation | ✅ Sim / ❌ Não | | | |
| Info Disc.  | ✅ Sim / ❌ Não | | | |
| DoS         | ✅ Sim / ❌ Não | | | |
| Elev. Priv. | ✅ Sim / ❌ Não | | | |

### Controles obrigatórios para implementação

- [ ] <controle 1 — ex: rate limit 5/min no endpoint de login>
- [ ] <controle 2>
- [ ] <controle 3>

### Risco residual aceito

<o que foi identificado mas não será mitigado nesta entrega, com justificativa>
```

### 2.3 — Prioridade de análise por tipo de componente

| Componente | Ameaças prioritárias |
|---|---|
| Endpoint de autenticação | S, D, E |
| Endpoint de dados de usuário | I, E, A |
| Consumer de evento externo | T, I |
| Endpoint de upload | D, T, I |
| Endpoint admin | E, S, R |
| BFF de dados PII | I, T |
| Formulário de checkout | T, I, D |

---

## 3. Padrões de autenticação e autorização

### 3.1 — JWT + Refresh Token (padrão recomendado)

```
Fluxo:
1. Login → API retorna access_token (15min) + seta refresh_token em cookie httpOnly (7d)
2. Request autenticado → Authorization: Bearer <access_token>
3. Access token expirado → POST /auth/refresh com cookie automático
4. Refresh → nova access_token + novo refresh_token (rotação) + invalida o anterior
5. Logout → invalida refresh_token no servidor (blacklist ou família de tokens)
```

**Controles obrigatórios:**
- Access token: `exp` ≤ 15 minutos, algoritmo `HS256` ou `RS256` (nunca `none`)
- Refresh token: `httpOnly: true`, `secure: true`, `sameSite: strict`
- Rotação de refresh token: token anterior invalidado após uso
- Blacklist de refresh tokens invalidados (Redis com TTL = tempo de expiração)

### 3.2 — RBAC (Role-Based Access Control)

```typescript
// Estrutura de roles recomendada
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  READONLY = 'readonly',
}

// Guard de roles
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles.includes(role));
  }
}
```

**Princípio do mínimo privilégio:** Todo novo endpoint começa como protegido (`@UseGuards(JwtAuthGuard)`). Endpoints públicos são exceção declarada com `@Public()` e comentário justificando.

### 3.3 — Verificação de ownership (anti-IDOR)

```typescript
// Padrão: sempre filtrar por userId do token, não do request
async findUserOrder(orderId: string, userId: string) {
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      userId,  // garantia de ownership — nunca buscar só por orderId
    },
  });
  if (!order) throw new NotFoundException();
  return order;
}
```

---

## 4. Secure headers — Referência completa

```typescript
// NestJS main.ts — configuração completa de headers de segurança
import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // remover unsafe-inline se possível
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // HSTS — forçar HTTPS
  hsts: {
    maxAge: 31536000,        // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  // Outros headers
  noSniff: true,             // X-Content-Type-Options: nosniff
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  xssFilter: true,           // X-XSS-Protection (legado, mas ainda útil)
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

**Verificar com:** [securityheaders.com](https://securityheaders.com) ou `curl -I https://seu-endpoint.com`

---

## 5. Senhas e hashing

### 5.1 — Algoritmos permitidos

| Algoritmo | Status | Custo mínimo |
|---|---|---|
| `bcrypt` | ✅ Recomendado | 12 |
| `argon2id` | ✅ Preferido para novos projetos | padrão da lib |
| `scrypt` | ✅ Aceito | padrão do Node.js crypto |
| `PBKDF2` | ⚠️ Aceito com HMAC-SHA256 | 310.000 iterações |
| `SHA-256/512` sem salt | ⛔ Proibido | — |
| `MD5`, `SHA-1` | ⛔ Proibido | — |
| Texto plano | ⛔ Proibido | — |

```typescript
// bcrypt — instalação: npm install bcrypt @types/bcrypt
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const hash = await bcrypt.hash(password, SALT_ROUNDS);
const isValid = await bcrypt.compare(candidate, hash);
```

---

## 6. Dependências e CVEs — Processo de triagem

### 6.1 — Severidade e ação

| Severidade | CVSS | Ação |
|---|---|---|
| CRITICAL | 9.0–10.0 | Bloquear merge. Corrigir antes. Se sem fix: avaliar remoção. |
| HIGH | 7.0–8.9 | Bloquear merge. Plano de correção com prazo ≤ 7 dias. |
| MEDIUM | 4.0–6.9 | Issue no repositório. Prazo ≤ 30 dias. |
| LOW | 0.1–3.9 | Issue no repositório. Próximo ciclo de manutenção. |

### 6.2 — Comandos de auditoria

```bash
# npm — audit com saída detalhada
npm audit --audit-level=moderate

# Verificar licenças de dependências (compliance)
npx license-checker --summary

# Verificar dependências desatualizadas
npm outdated

# Snyk (se disponível na organização)
snyk test
snyk monitor

# Verificar scripts de instalação em nova dependência
cat node_modules/<nova-dep>/package.json | grep -A5 '"scripts"'
```

### 6.3 — Exceção de CVE sem fix disponível

Quando não há versão corrigida disponível:

1. Documentar no PR: CVE ID, severidade, vetor de exploit, mitigação compensatória adotada.
2. Aprovação explícita do **arquiteto** registrada no PR.
3. Issue aberta no repositório com: CVE ID, prazo de reavaliação (máximo 30 dias para HIGH).
4. Monitorar feed de releases da dependência para fix.

---

## 7. Checklist de revisão de segurança por camada

### 7.1 — Backend (NestJS)

- [ ] `helmet()` configurado no `main.ts`
- [ ] CORS com allowlist explícita (não `*`)
- [ ] Rate limit nos endpoints sensíveis (login, registro, recuperação de senha)
- [ ] JWTs com `exp` e algoritmo explícito
- [ ] Refresh token em cookie `httpOnly`, com rotação
- [ ] Todos os endpoints têm guard (exceto os explicitamente `@Public()`)
- [ ] Verificação de ownership em operações por ID
- [ ] Inputs validados com `class-validator` ou `zod` no DTO
- [ ] Queries parametrizadas (Prisma — sem raw SQL concatenado)
- [ ] Exception filter global removendo stack trace da resposta
- [ ] Audit log em eventos de autenticação e operações destrutivas
- [ ] Sem `console.log` com dados sensíveis
- [ ] `npm audit` sem CRITICAL ou HIGH

### 7.2 — Frontend (React)

- [ ] Nenhum `dangerouslySetInnerHTML` sem `DOMPurify`
- [ ] Links com `href` dinâmico validam protocolo
- [ ] Dados sensíveis não armazenados em `localStorage` / `sessionStorage`
- [ ] Dados sensíveis não em `console.log`
- [ ] Tokens de acesso em memória (não em storage persistente)
- [ ] Formulários sem autocomplete inadequado em campos sensíveis (`autocomplete="off"` para senhas)
- [ ] CSP configurado no servidor (não apenas no frontend)

### 7.3 — BFF (NestJS)

- [ ] JWT validado no BFF antes de repassar ao upstream
- [ ] Dados PII não logados ao repassar requisições
- [ ] Headers `Authorization` do upstream não expostos ao frontend
- [ ] Resposta do BFF filtra campos sensíveis que vieram do backend

---

## 8. Referências externas

- [OWASP Top 10 2025](https://owasp.org/Top10/2025/)
- [OWASP ASVS (Application Security Verification Standard)](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST SP 800-63B — Autenticação digital](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [NestJS Security docs](https://docs.nestjs.com/security/authentication)
- [Helmet.js](https://helmetjs.github.io/)
- [STRIDE Threat Modeling — Microsoft](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
