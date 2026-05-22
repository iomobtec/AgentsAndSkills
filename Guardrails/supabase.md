# Guardrail: Migração Supabase → NestJS + Prisma

Regras para conduzir a migração de projetos Lovable/Supabase para a stack NestJS + Prisma + PostgreSQL. Aplicável sempre que um projeto gerado no Lovable for levado a produção. Carregado pelos agentes `arquiteto` e `dev-backend` em tarefas de migração.

---

## §1 — Extração de schema

- Sempre exportar o schema via `supabase db dump --schema public` — nunca mapear manualmente
- Ignorar schemas internos `auth.*`, `storage.*`, `realtime.*`: são do Supabase, não dados do usuário
- O schema gerado pelo Lovable é protótipo — o arquiteto revisa antes de criar o Prisma schema
- `uuid` → `String @id @default(uuid())` no Prisma; nunca substituir por `Int` auto-increment
- Colunas `created_at`/`updated_at` → `@default(now())` e `@updatedAt` no Prisma
- Sempre revisar normalização e índices — Lovable prioriza simplicidade, não performance

---

## §2 — Autenticação (Supabase Auth → NestJS + Passport)

- JWT do Supabase tem claims proprietários (`sub`, `role`, `aal`, `session_id`) — nunca reusar o formato; definir novo contrato de JWT NestJS
- Tabela `auth.users` do Supabase → tabela `users` no Prisma com migração de dados explícita
- Plano de transição obrigatório: definir data de corte para invalidar tokens Supabase e como usuários existentes farão novo login
- Nunca importar `@supabase/supabase-js` no código NestJS após a migração
- Campos `user_metadata` e `app_metadata` do Supabase → mapear para colunas na tabela `users` antes de migrar

---

## §3 — Autorização (RLS → Guards NestJS)

- Toda RLS policy deve ter um Guard NestJS equivalente — nunca ignorar ou postergar
- RLS gerado pelo Lovable frequentemente usa `using (true)` ou `using (auth.uid() = user_id)` sem filtro de tenant — auditar todas antes de mapear
- Anti-padrão bloqueado: replicar `WHERE user_id = :userId` nas queries sem Guard que valide a propriedade do recurso
- Guards de autorização devem ser testados com cenário de acesso negado — não apenas acesso permitido
- Tabelas sem RLS habilitada com dados sensíveis → risco crítico; mapear Guard imediatamente

---

## §4 — Edge Functions → Services NestJS

- Edge functions do Lovable frequentemente misturam lógica de negócio com integração de terceiros — separar antes de converter
- Nunca migrar edge function diretamente como controller sem passar pela skill `implementar-endpoint`
- Chamadas `supabase.from()` dentro de edge functions → converter para Prisma service
- Variáveis `Deno.env.get('CHAVE')` → `process.env.CHAVE` com validação em `ConfigModule`
- Webhooks recebidos em edge functions → endpoint NestJS com validação de assinatura

---

## §5 — Migração de dados

- `pg_dump` exporta tudo — usar `--schema public` para filtrar apenas dados do usuário
- Dados em `storage.*` (arquivos) → definir destino (S3/MinIO) e plano de migração antes de migrar o código
- Nunca executar migração de dados em produção sem backup verificado e rollback documentado
- Sequência obrigatória: migrar schema → validar estrutura → migrar dados → validar integridade → cortar tráfego Supabase
- Não desligar o projeto Supabase até smoke tests no ambiente destino passarem
