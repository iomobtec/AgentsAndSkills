# GuardRails — Application Security (AppSec)

Regras técnicas de segurança de aplicação para **revisão aprofundada de código, arquitetura e dependências**. Complementa `seguranca.md` (que cobre dados pessoais, secrets e migrations) com vetores de ataque, padrões de codificação segura e verificação de supply chain.

Baseado no **OWASP Top 10 2025** (`https://owasp.org/Top10/2025/`). Inclui controles adicionais além do Top 10 quando relevantes para a stack.

Carregado por: **dev-security**, **tech-lead**, **arquiteto**.

> Para regras universais mínimas que todos os agentes seguem (LGPD, secrets, migrations, boas práticas de codificação segura), ver `seguranca.md`.

---

## §1 — Injeção

**Regra:** Toda entrada externa (parâmetros de URL, body, headers, query string, mensagens de fila, arquivos) é tratada como não-confiável. Nunca concatenar entrada do usuário em queries SQL, comandos shell, expressões de template, consultas NoSQL ou chamadas a processos externos.

**Motivo:** Injeção continua entre os vetores mais críticos (OWASP A05:2025 — inclui XSS com mais de 30k CVEs e SQL injection com mais de 14k CVEs). Um único ponto de concatenação pode comprometer todo o banco de dados ou o servidor.

### §1.1 — Bloqueado

- Query SQL com concatenação: `"SELECT * FROM users WHERE id = " + req.params.id`
- Consulta MongoDB com operador não sanitizado: `{ name: req.body.name }` onde `name` pode ser `{ $gt: "" }`
- `child_process.exec()` com entrada do usuário sem sanitização
- Template literals usados diretamente em queries de banco

### §1.2 — Forma correta

```typescript
// SQL — Prisma (queries parametrizadas por padrão)
await prisma.user.findFirst({ where: { id: userId } })

// Raw SQL — sempre com placeholders
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`

// NoSQL — validar tipo antes de passar
const name = z.string().parse(req.body.name);
await collection.findOne({ name })
```

### §1.3 — Verificação obrigatória em revisão

- [ ] Todos os pontos de entrada usam ORM/queries parametrizadas?
- [ ] Nenhuma concatenação de string em query ou comando?
- [ ] Entradas de fila/mensageria também são validadas antes de uso?

---

## §2 — Autenticação quebrada

**Regra:** JWTs devem ter tempo de expiração definido (`exp`), algoritmo explícito (`RS256` ou `HS256` — nunca `none`), e o refresh token deve ser rotacionado a cada uso. Endpoints sem autenticação devem ser declarados explicitamente como públicos — o padrão é protegido.

**Motivo:** JWT sem expiração ou com algoritmo `none` permite acesso permanente com token comprometido (OWASP A07:2025 — Authentication Failures).

### §2.1 — Bloqueado

- JWT sem campo `exp` no payload
- Algoritmo `none` aceito na verificação
- Refresh token reutilizável sem rotação
- Endpoints com `@Public()` sem justificativa documentada
- Senha armazenada em texto plano ou com MD5/SHA1
- Login sem rate limit ou lockout após tentativas

### §2.2 — Forma correta

```typescript
// JWT com expiração e algoritmo explícito
JwtModule.register({
  secret: configService.get('JWT_SECRET'),
  signOptions: {
    expiresIn: '15m',
    algorithm: 'HS256',
  },
})

// Senhas com bcrypt — custo mínimo 12
const hash = await bcrypt.hash(password, 12);

// Guard global — exceções declaradas explicitamente
@UseGuards(JwtAuthGuard)  // aplicado globalmente no AppModule
@Public()  // decorador para exceções documentadas
```

### §2.3 — Verificação obrigatória em revisão

- [ ] Todo JWT tem `exp` definido (máximo 1h para access token)?
- [ ] Refresh token é invalidado após uso (rotação)?
- [ ] Senhas usam bcrypt/argon2 com custo ≥ 12?
- [ ] Existe rate limit em endpoints de login/registro?
- [ ] Endpoints públicos estão documentados como exceção intencional?

---

## §3 — Exposição de dados sensíveis

**Regra:** Respostas de API nunca incluem campos desnecessários. Dados sensíveis (senhas, hashes, tokens internos, PII além do necessário) são explicitamente excluídos dos DTOs de resposta. Logs nunca contêm dados pessoais ou tokens de autenticação.

**Motivo:** Exposição de dados excessivos em APIs é vetor de exfiltração mesmo sem ataque ativo (OWASP A04:2025 — Cryptographic Failures inclui exposição de dados sensíveis em trânsito e em repouso).

### §3.1 — Bloqueado

- Response com campo `password` ou `passwordHash`
- Response com token de refresh exposto no body (deve ser httpOnly cookie)
- `JSON.stringify(req)` ou `console.log(req.body)` em handlers de produção
- Mensagem de erro com stack trace em resposta ao cliente
- Erro de banco exposto diretamente: `"duplicate key value violates unique constraint"`

### §3.2 — Forma correta

```typescript
// DTO de resposta explícito — nunca retornar a entidade diretamente
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  // sem password, sem passwordHash, sem tokens
}

// Exceção mapeada sem exposição interna
throw new ConflictException('E-mail já cadastrado');
// NÃO: throw new ConflictException(error.message)

// Refresh token em cookie httpOnly, não no body
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### §3.3 — Verificação obrigatória em revisão

- [ ] DTOs de resposta excluem todos os campos sensíveis?
- [ ] Mensagens de erro para o cliente são genéricas (sem stack trace)?
- [ ] Refresh token está em cookie httpOnly, não no body?
- [ ] Logs não contêm PII, tokens ou passwords?

---

## §4 — Controle de acesso quebrado

**Regra:** Toda operação que acessa ou modifica recursos de um usuário verifica se o usuário autenticado tem autorização sobre aquele recurso específico. Nunca confiar apenas no ID fornecido pelo cliente.

**Motivo:** IDOR (Insecure Direct Object Reference) é o subvetor mais comum de A01:2025 (Broken Access Control — manteve a 1ª posição). Um usuário autenticado pode acessar dados de outro usuário se a autorização por recurso não for verificada.

### §4.1 — Bloqueado

```typescript
// IDOR — busca pelo ID fornecido pelo cliente sem verificar ownership
const order = await ordersService.findOne(req.params.orderId);
return order; // ⛔ qualquer usuário pode ver o pedido de outro

// Endpoint admin acessível por usuário comum por falta de guard
@Get('/admin/users')
// ⛔ sem @Roles('admin') e sem RolesGuard
```

### §4.2 — Forma correta

```typescript
// Verificar ownership antes de retornar
const order = await ordersService.findOne({
  id: req.params.orderId,
  userId: req.user.id,  // garante que o pedido pertence ao usuário autenticado
});
if (!order) throw new NotFoundException();

// Role-based access
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('/admin/users')
```

### §4.3 — Verificação obrigatória em revisão

- [ ] Operações por ID verificam ownership (`userId === req.user.id`)?
- [ ] Endpoints administrativos têm guard de role?
- [ ] Deleção/edição verifica se o recurso pertence ao usuário?
- [ ] Endpoints que listam dados filtram por `userId` do token, não do request?

---

## §5 — Security misconfiguration

**Regra:** Toda resposta HTTP inclui headers de segurança obrigatórios. CORS é restritivo por padrão — allowlist explícita de origens. Stack traces nunca aparecem em ambiente de produção. Valores padrão (senhas default, chaves de exemplo) são substituídos antes do deploy.

**Motivo:** Security Misconfiguration subiu para **A02:2025** (era A05:2021) — 100% das aplicações testadas apresentaram alguma forma de misconfiguração. É fácil de introduzir acidentalmente e difícil de detectar.

### §5.1 — Headers obrigatórios (NestJS)

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// CORS restritivo
app.enableCors({
  origin: configService.get<string[]>('CORS_ORIGINS'),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

### §5.2 — Bloqueado

- `app.enableCors()` sem opções (permite qualquer origem)
- `NODE_ENV=production` com `DEBUG=*` ativo
- `app.useGlobalFilters()` retornando stack trace em produção
- Credenciais padrão de banco ou serviço em `.env.example` com valores reais
- Porta de administração exposta sem autenticação

### §5.3 — Verificação obrigatória em revisão

- [ ] `helmet()` configurado em main.ts?
- [ ] CORS com allowlist explícita de origens?
- [ ] Exception filter global remove stack trace em produção?
- [ ] Variáveis de ambiente sem valores padrão inseguros?

---

## §6 — Cross-Site Scripting (XSS)

**Regra:** Nenhum conteúdo controlado pelo usuário é inserido no DOM sem sanitização. `dangerouslySetInnerHTML` é proibido salvo caso de necessidade documentada com sanitização comprovada. Cookies de sessão usam `httpOnly`.

**Motivo:** XSS permite roubo de sessão e execução de código arbitrário no browser do usuário (OWASP A05:2025 — XSS é subvetor de Injection com mais de 30k CVEs registrados, a maior frequência entre todos os vetores do Top 10).

### §6.1 — Bloqueado

```tsx
// XSS refletido via dangerouslySetInnerHTML sem sanitização
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// XSS via href controlado pelo usuário
<a href={user.website}>site</a>  // ⛔ pode ser javascript:alert(1)

// Criação manual de elemento DOM com conteúdo do usuário
document.getElementById('container').innerHTML = data.description;
```

### §6.2 — Forma correta

```tsx
// Exibir como texto — React escapa por padrão
<div>{userInput}</div>

// Se HTML é necessário — sanitizar com DOMPurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userHtml, { ALLOWED_TAGS: ['b', 'i', 'em', 'p'] })
}} />

// href com protocolo controlado
const safeUrl = url.startsWith('https://') ? url : '#';
<a href={safeUrl}>site</a>
```

### §6.3 — Verificação obrigatória em revisão

- [ ] Nenhum `dangerouslySetInnerHTML` sem `DOMPurify.sanitize()`?
- [ ] Links com `href` dinâmico validam protocolo (`https://` apenas)?
- [ ] CSP header configurado no servidor (`helmet` no backend)?
- [ ] Cookies de sessão com `httpOnly: true`?

---

## §7 — Cross-Site Request Forgery (CSRF)

**Regra:** Endpoints que modificam estado (POST, PUT, PATCH, DELETE) verificam origem da requisição. Cookies de sessão usam `SameSite=strict` ou `SameSite=lax`. APIs REST stateless com JWT no header `Authorization` são naturalmente protegidas.

**Motivo:** CSRF permite que sites maliciosos executem ações em nome de usuário autenticado sem seu conhecimento.

### §7.1 — Regras por tipo de aplicação

| Tipo | Proteção necessária |
|---|---|
| API REST com JWT no header `Authorization` | Naturalmente protegida — CSRF não se aplica a headers customizados |
| API com autenticação por cookie de sessão | Obrigatório: `SameSite=strict` + token anti-CSRF ou verificação de `Origin`/`Referer` |
| Formulários server-side (não-SPA) | Token anti-CSRF sincronizado obrigatório |

### §7.2 — Configuração de cookie seguro

```typescript
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true,         // apenas HTTPS
  sameSite: 'strict',   // bloqueia envio cross-site
  maxAge: 3600000,
});
```

---

## §8 — Software Supply Chain Failures

**Regra:** Dependências com CVE de severidade CRITICAL ou HIGH conhecidos devem ser atualizadas antes do merge. O arquivo `package-lock.json` ou `yarn.lock` é sempre commitado. Scripts `postinstall` de dependências novas são inspecionados antes da aprovação. Pacotes comprometidos por atacantes (não apenas com CVEs) também são escopo desta regra.

**Motivo:** Software Supply Chain Failures subiu para **A03:2025** (era A06:2021 como "Vulnerable Components"). O escopo expandiu: agora cobre não apenas CVEs conhecidos, mas também comprometimento intencional de fornecedores confiáveis (ex: SolarWinds 2019, Bybit 2025), worms em ecossistemas npm e comportamento malicioso condicional em pacotes legítimos. Taxa de incidência média mais alta de todo o Top 10 (5.19%).

### §8.1 — Verificação obrigatória antes do merge

```bash
# Verificar CVEs na árvore de dependências
npm audit --audit-level=high

# Verificar se lockfile está atualizado e commitado
git status package-lock.json  # não deve aparecer como modificado fora do PR

# Inspecionar scripts de nova dependência antes de instalar
cat node_modules/<nova-dep>/package.json | jq '.scripts'
```

### §8.2 — Bloqueado

- `npm install` sem lockfile commitado no repositório
- Dependência com CVE CRITICAL ou HIGH sem justificativa de exceção aprovada pelo arquiteto
- Script `postinstall` que faz download de binário ou executa `curl | sh`
- Dependência de repositório GitHub direto (não npm registry): `"dep": "github:user/repo"`
- Imagem Docker sem tag versionada: `FROM node:latest`

### §8.3 — Imagens Docker

```dockerfile
# Sempre imagem versionada com digest ou tag específica
FROM node:20.11-alpine3.19

# Nunca
FROM node:latest
FROM node:lts  # lts muda ao longo do tempo
```

---

## §9 — Logging e monitoramento insuficientes

**Regra:** Toda falha de autenticação, tentativa de acesso não autorizado, mudança de privilégio e operação destrutiva deve gerar log estruturado com: timestamp, userId, IP, ação tentada e resultado. Logs de segurança não podem ser silenciados por `try/catch` vazio.

**Motivo:** Sem audit trail, incidentes não são detectados nem investigados (OWASP A09:2025 — Security Logging and Alerting Failures; "Alerting" foi adicionado ao nome em 2025 para enfatizar que log sem alerta ativo é insuficiente).

### §9.1 — Eventos que obrigatoriamente geram log

| Evento | Campos obrigatórios no log |
|---|---|
| Login bem-sucedido | `userId`, `ip`, `userAgent`, `timestamp` |
| Falha de autenticação | `email tentado`, `ip`, `userAgent`, `motivo`, `timestamp` |
| Acesso negado (403) | `userId`, `recurso tentado`, `ip`, `timestamp` |
| Mudança de role/permissão | `userId executor`, `userId alvo`, `role anterior`, `role nova`, `timestamp` |
| Deleção de registro | `userId`, `entidade`, `id deletado`, `timestamp` |
| Operação em lote (bulk) | `userId`, `operação`, `quantidade`, `timestamp` |

### §9.2 — Bloqueado

```typescript
// try/catch vazio silencia falha de segurança
try {
  await authService.validateToken(token);
} catch {
  // ⛔ falha de validação silenciada — ninguém sabe que o token foi inválido
}

// Log sem campos obrigatórios
logger.warn('login failed');  // ⛔ sem ip, sem userId, sem motivo
```

### §9.3 — Forma correta

```typescript
try {
  await authService.validateToken(token);
} catch (error) {
  this.logger.warn('authentication_failed', {
    ip: req.ip,
    email: req.body.email,
    reason: error.message,
    timestamp: new Date().toISOString(),
  });
  throw new UnauthorizedException();
}
```

---

## §10 — Server-Side Request Forgery (SSRF)

**Regra:** Endpoints que fazem chamadas HTTP com URL fornecida pelo usuário validam a URL contra allowlist de domínios permitidos. IPs internos, `localhost`, metadados de cloud (`169.254.169.254`) e esquemas não-HTTP são bloqueados explicitamente.

**Motivo:** SSRF foi removido do Top 10 2025 como categoria isolada (era A10:2021), mas permanece um vetor ativo e relevante — especialmente em arquiteturas cloud com metadados acessíveis internamente. Mantido neste guardrail como controle adicional além do Top 10.

### §10.1 — Bloqueado

```typescript
// URL fornecida pelo usuário sem validação
const { url } = req.body;
const response = await axios.get(url);  // ⛔ SSRF
```

### §10.2 — Forma correta

```typescript
const ALLOWED_DOMAINS = ['api.parceiro.com', 'cdn.empresa.com'];

function validateExternalUrl(url: string): void {
  const parsed = new URL(url);
  if (!['https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Protocolo não permitido');
  }
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    throw new BadRequestException('Domínio não permitido');
  }
  // Bloquear IPs internos
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/.test(parsed.hostname)) {
    throw new BadRequestException('Endereço interno não permitido');
  }
}
```

---

## §11 — Supply chain e integridade de artefatos

**Regra:** Todo artefato publicado (imagem Docker, pacote npm, binário) tem sua integridade verificável. O pipeline CI/CD assina imagens Docker com digest imutável. Dependências de desenvolvimento não chegam à imagem de produção.

**Motivo:** Software or Data Integrity Failures (OWASP A08:2025 — manteve posição). Comprometimento do pipeline ou do registry pode substituir artefatos legítimos por versões maliciosas sem que o time perceba.

### §11.1 — Verificações obrigatórias no pipeline

```yaml
# Verificar integridade do lockfile antes de instalar
- name: Verify lockfile integrity
  run: npm ci  # falha se lockfile não bater com package.json

# Scan de vulnerabilidades no CI
- name: Security audit
  run: npm audit --audit-level=high

# Build multi-stage — dependências de dev não chegam à imagem final
FROM node:20-alpine AS builder
RUN npm ci
RUN npm run build

FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist
# node_modules de produção apenas
RUN npm ci --omit=dev
```

### §11.2 — Bloqueado

- `npm install` no CI (usar `npm ci` — falha se lockfile divergir)
- Imagem Docker com `node_modules` de desenvolvimento em produção
- Pipeline sem etapa de `npm audit`
- Dependência instalada via `curl | sh` ou script externo

---

## §12 — Rate limiting e proteção contra DoS

**Regra:** Endpoints públicos ou sensíveis (login, registro, recuperação de senha, upload) têm rate limit configurado. Payloads têm tamanho máximo definido. Consultas com parâmetros de paginação têm limite máximo (`pageSize` ≤ 100).

**Motivo:** Endpoints sem throttle são vetores de DoS e de brute force automatizado.

### §12.1 — Implementação obrigatória

```typescript
// Rate limit global com ThrottlerModule
ThrottlerModule.forRoot({
  ttl: 60,    // janela de 60 segundos
  limit: 100, // máximo 100 requisições por IP por janela
})

// Rate limit específico para endpoints sensíveis
@Throttle(5, 60)  // 5 tentativas por minuto
@Post('/auth/login')

// Limite de tamanho de payload no main.ts
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// pageSize com limite máximo
const pageSize = Math.min(req.query.pageSize ?? 20, 100);
```

### §12.2 — Bloqueado

- Endpoint `/auth/login` sem `@Throttle`
- Endpoint de upload sem limite de tamanho de arquivo
- Parâmetro `pageSize` sem limite superior (pode retornar tabela inteira)
- Query sem `LIMIT` em banco (via Prisma: sempre usar `take`)

---

## §13 — Mishandling of Exceptional Conditions (A10:2025)

**Regra:** Toda exceção, erro ou condição inesperada deve ser capturada, logada e tratada de forma segura. "Falhar com segurança" (fail secure) significa que em caso de erro o sistema nega acesso — nunca concede. Erros nunca expõem stack trace, dados internos ou mensagens de sistema para o cliente.

**Motivo:** Nova categoria no OWASP Top 10 2025 (A10:2025). Abrange 24 CWEs e cobre situações onde o programa falha em prevenir, detectar e responder a condições imprevistas — incluindo DoS por exceção, corrupção de estado em transações e exposição de informações sensíveis em mensagens de erro.

### §13.1 — Padrões bloqueados

```typescript
// ⛔ Falha aberta — erro silenciado concede acesso indevido
try {
  await authService.validatePermission(userId, resource);
} catch {
  return true;  // falha aberta: qualquer erro concede acesso
}

// ⛔ Stack trace exposto ao cliente
app.use((err, req, res, next) => {
  res.json({ error: err.stack });  // expõe caminhos internos, versões de libs
});

// ⛔ Exceção não tratada em handler de evento (mensageria)
consumer.on('message', async (msg) => {
  await processOrder(msg);  // sem try/catch: falha não-tratada derruba o consumer
});

// ⛔ Transação sem rollback em caso de erro
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.inventory.update({ ... }),
  // se a segunda operação falhar, a primeira fica sem reverter em algumas implementações
]);
```

### §13.2 — Forma correta

```typescript
// ✅ Fail secure — erro nega acesso, nunca concede
try {
  const allowed = await authService.validatePermission(userId, resource);
  if (!allowed) throw new ForbiddenException();
} catch (error) {
  this.logger.error('permission_check_failed', { userId, resource, error });
  throw new ForbiddenException();  // sempre nega em caso de dúvida
}

// ✅ Exception filter global — log interno, resposta genérica ao cliente
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : 500;
    const message = isHttp ? exception.getResponse() : 'Erro interno do servidor';

    this.logger.error('unhandled_exception', {
      status,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    host.switchToHttp().getResponse().status(status).json({ message, status });
  }
}

// ✅ Consumer com tratamento de exceção e dead-letter
consumer.on('message', async (msg) => {
  try {
    await processOrder(msg);
  } catch (error) {
    this.logger.error('message_processing_failed', { msgId: msg.id, error });
    await deadLetterQueue.send(msg);  // não perde a mensagem
  }
});

// ✅ Transação com rollback explícito
await prisma.$transaction(async (tx) => {
  await tx.order.create({ data: orderData });
  await tx.inventory.update({ ... });
  // rollback automático se qualquer operação falhar
});
```

### §13.3 — Verificação obrigatória em revisão

- [ ] Nenhum `catch {}` ou `catch (e) {}` vazio — toda exceção é logada
- [ ] Erros de autenticação/autorização sempre negam acesso (fail secure), nunca concedem
- [ ] Exception filter global configurado e remove stack trace da resposta HTTP
- [ ] Consumers de eventos (mensageria) têm tratamento de exceção + dead-letter queue
- [ ] Transações bancárias/financeiras têm rollback garantido em caso de erro
- [ ] `process.on('unhandledRejection')` e `process.on('uncaughtException')` configurados no `main.ts` com log e graceful shutdown

```typescript
// main.ts — captura de exceções não tratadas
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', { error });
  process.exit(1);
});
```

---

## §15 — Padrão geral de relatório de achado

Quando um achado de segurança é identificado, reportar no formato:

```
🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW

**Vetor:** appsec.md §<n> — <título>
**Arquivo:** <caminho>:<linha>
**Descrição:** <o que o código faz de errado>
**Impacto:** <o que um atacante pode fazer>
**Correção:** <como corrigir com exemplo de código>
**Bloqueia merge:** <Sim (CRITICAL/HIGH) | Não — vira issue (MEDIUM/LOW)>
```

---

## §16 — Fluxo de correção de achados CRITICAL

Achados CRITICAL não bloqueiam o merge diretamente — passam pelo tech-lead para coordenação:

```
1. dev-security entrega relatório com achados classificados
   ↓
2. tech-lead recebe relatório e identifica o dev responsável pela camada afetada
   ↓
3. tech-lead aciona dev responsável (dev-backend / dev-bff / dev-frontend)
   com o achado específico e a correção sugerida
   ↓
4. dev corrige e reabre PR
   ↓
5. dev-security re-audita o PR corrigido
   ↓
6. Se limpo → tech-lead aprova o merge
```

MEDIUM e LOW: viram issues rastreáveis no repositório — não bloqueiam o ciclo de correção imediato.
