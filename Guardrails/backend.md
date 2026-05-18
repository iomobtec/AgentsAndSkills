# GuardRails — Backend (Node.js)

Regras específicas para desenvolvimento de serviços backend em **Node.js** (NestJS, Express, Fastify). Complementa `00-core.md` — não substitui. Carregado por: `dev-system`, `dev-process`, `dev-bff`, `arquiteto`, `revisor`, `upstream`, `downstream`.

---

## §1 — Lockfile sempre commitado e nunca deletado

**Regra:** O arquivo de lockfile (`package-lock.json`, `yarn.lock` ou `pnpm-lock.yaml`) é parte do código — sempre commitado, nunca deletado ou ignorado via `.gitignore`. Não misturar gerenciadores de pacote no mesmo repositório (ex.: não adicionar `yarn.lock` em projeto que usa `npm`).

**Motivo:** Lockfile garante que todos os ambientes (dev, CI, PRD) instalam exatamente as mesmas versões transitivas. Sem lockfile, uma atualização silenciosa de dependência transitiva quebra produção sem mudança no `package.json`.

### §1.1 — Bloqueado pelo agent

- Adicionar `*.lock` ou `package-lock.json` ao `.gitignore`
- Deletar o lockfile para "resolver conflito de merge" — o caminho correto é resolver o conflito no próprio arquivo
- Misturar `npm install` em projeto que usa `yarn`, ou vice-versa

---

## §2 — Nunca deixar Promise sem tratamento (floating promise)

**Regra:** Toda `Promise` deve ser `await`-ada, `.then/.catch`-ada, ou explicitamente retornada ao caller. Não criar `Promise` sem tratamento de rejeição.

**Motivo:** Promise rejeitada sem handler silencia o erro em produção. Node.js pode encerrar o processo com `UnhandledPromiseRejection` — comportamento não determinístico dependendo da versão e configuração.

### §2.1 — Padrões bloqueados

```typescript
// ⛔ floating promise — rejeição silenciada
someAsyncOperation();

// ⛔ sem catch
someAsyncOperation().then(result => doSomething(result));

// ✅ aguardado
await someAsyncOperation();

// ✅ retornado ao caller
return someAsyncOperation();

// ✅ com handler explícito
someAsyncOperation().catch(err => logger.error(err));
```

---

## §3 — Validar entrada nas fronteiras do sistema

**Regra:** Todo dado que entra no sistema por fronteiras externas (HTTP request, mensagem de fila, evento, arquivo) deve ser **validado e tipado** antes de ser processado. Nunca confiar em `req.body`, `event.payload` ou similar sem validação explícita de schema.

**Motivo:** Dado não validado é superfície de injeção, crash silencioso e comportamento não determinístico. A responsabilidade de validar é da camada que recebe — não de quem consome internamente.

### §3.1 — Ferramentas aceitas

- `zod` — preferencial para validação + inferência de tipo TypeScript
- `class-validator` + `class-transformer` — padrão NestJS
- `joi` — aceitável em projetos legados

### §3.2 — Bloqueado

- Usar `as SomeType` em dado vindo de fora sem validação prévia
- Passar `req.body` direto para função de domínio sem parse/validation
- Silenciar erro de validação (catch vazio ou `|| {}` sem tratar)

---

## §4 — Retornar erros estruturados e consistentes

**Regra:** APIs retornam erros no formato padronizado do projeto. Se o projeto não definiu um formato, usar **RFC 7807 Problem Details** como base. Nunca retornar stack trace, mensagem de exceção interna ou caminho de arquivo em resposta de API em produção.

**Motivo:** Erro não estruturado força o consumidor a fazer parse frágil de strings. Stack trace em resposta expõe topologia interna e facilita reconhecimento para ataque.

### §4.1 — Formato mínimo de erro

```json
{
  "type": "https://example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "Field 'email' is required.",
  "instance": "/api/users"
}
```

### §4.2 — Bloqueado

```typescript
// ⛔ stack trace na response
res.status(500).json({ error: err.stack });

// ⛔ mensagem de exceção interna exposta
res.status(400).json({ message: err.message });

// ⛔ objeto de erro não tratado
res.status(500).json(err);
```

---

## §5 — Nunca usar `console.log` em código de produção

**Regra:** Logging em código de produção usa exclusivamente o logger configurado no projeto (ex.: `winston`, `pino`, `@nestjs/common Logger`). `console.log`, `console.error` e `console.warn` são permitidos apenas em scripts de CLI, seeds ou utilitários de desenvolvimento.

**Motivo:** `console.log` não é estruturado, não tem nível, não integra com sistemas de observabilidade, e pode expor dados sensíveis em ambientes onde stdout é coletado sem filtragem.

### §5.1 — Regras de logging

- Log em formato JSON estruturado com campos: `level`, `message`, `timestamp`, `correlationId` (quando disponível)
- Nunca logar dados pessoais em claro (ver `seguranca.md §1`)
- Nunca logar secrets ou tokens (ver `seguranca.md §2`)
- Nível adequado ao contexto: `debug` para desenvolvimento, `info` para fluxo normal, `warn` para situação inesperada recuperável, `error` para falha que requer atenção

---

## §6 — Variáveis de ambiente validadas na inicialização

**Regra:** Toda variável de ambiente que o serviço depende deve ser declarada e validada com schema no **startup** da aplicação, antes de aceitar tráfego. Serviço que inicia sem variável crítica deve falhar com erro claro — nunca subir silenciosamente com comportamento degradado.

**Motivo:** Descobrir variável faltando no meio do fluxo, em runtime, cria erros crípticos e dificulta diagnóstico. Fail-fast no boot torna o problema imediatamente visível no deploy.

### §6.1 — Padrão recomendado

```typescript
// Usar zod ou similar para validar process.env no módulo de config
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
```

---

## §7 — Não bloquear o event loop

**Regra:** Nenhuma operação síncrona pesada (`fs.readFileSync` em arquivo grande, cálculo intensivo de CPU, loop longo) pode ser executada no thread principal do Node.js dentro de um handler de request. Operações de I/O usam sempre a versão assíncrona.

**Motivo:** Node.js tem event loop single-threaded. Operação síncrona bloqueia todos os requests concorrentes enquanto dura — degrada latência de toda a aplicação, não apenas da request ofensora.

### §7.1 — Alternativas

- CPU intensiva: mover para `worker_threads` ou serviço dedicado
- Leitura de arquivo grande: stream, não `readFileSync`
- Parse pesado: processar fora do ciclo de request (queue, job)
