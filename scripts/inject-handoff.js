#!/usr/bin/env node
/**
 * Hook: UserPromptSubmit
 *
 * Lê plans/.handoff/current.md e injeta o contexto no prompt da nova sessão.
 * Após injetar, arquiva o arquivo para evitar reinjeção em mensagens seguintes.
 *
 * Configurado em .claude/settings.json > hooks > UserPromptSubmit.
 */

const fs = require('fs');
const path = require('path');

const HANDOFF_FILE = path.join(process.cwd(), 'plans', '.handoff', 'current.md');
const ARCHIVE_DIR  = path.join(process.cwd(), 'plans', '.handoff', 'archive');

if (!fs.existsSync(HANDOFF_FILE)) {
  process.exit(0);
}

const content = fs.readFileSync(HANDOFF_FILE, 'utf8');

// Arquiva antes de injetar para evitar reinjeção em mensagens seguintes da sessão
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.renameSync(HANDOFF_FILE, path.join(ARCHIVE_DIR, `${timestamp}.md`));

// Stdout é injetado no prompt pelo hook UserPromptSubmit do Claude Code
process.stdout.write(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥  CONTEXTO DO AGENTE ANTERIOR (injetado automaticamente)

${content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Leia o contexto acima antes de começar. Os arquivos de plano
listados em "Arquivos que você deve ler" estão no repositório local.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
