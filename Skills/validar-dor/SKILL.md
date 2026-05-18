# Skill: validar-dor

Verifica se uma história de usuário satisfaz o **Definition of Ready** antes de ser assumida por um agente de desenvolvimento. Bloqueia início de implementação quando informações críticas estão ausentes e orienta o que é necessário para desbloquear.

**Agente:** tech-lead  
**Guardrails aplicáveis:** `00-core.md`, `processo.md`

---

## Quando usar

- No início de qualquer sessão de desenvolvimento, antes de acionar dev-backend, dev-frontend, dev-bff ou dev-mensageria
- Quando o tech-lead recebe uma tarefa e precisa confirmar que ela está pronta
- Para auditar o backlog antes de um sprint planning

---

## Diferença entre validar-dor e refinar-historia

| `validar-dor` | `refinar-historia` |
|---|---|
| Verifica se o DoR já está satisfeito | Constrói o DoR do zero a partir de rascunho |
| Responde: "está pronto para desenvolvimento?" | Responde: "como tornar isso pronto?" |
| Saída: aprovado ou lista de bloqueadores | Saída: história refinada com CA, escopo e dependências |
| Dura minutos | Dura uma sessão de refinamento |

---

## Processo de execução

### Passo 1 — Verificar o "Como / Quero / Para"

```
✅ Satisfeito quando:
  - "Como" identifica um papel com responsabilidade clara (usuário, administrador, sistema)
  - "Quero" descreve uma ação, não uma tecnologia
  - "Para" declara benefício de negócio verificável

⛔ Bloqueado quando:
  - "Para" está ausente ou é "para que funcione"
  - "Quero" descreve implementação técnica ("para criar a tabela X")
  - Papel em "Como" é tão genérico que não ajuda a priorizar ("Como sistema...")
```

### Passo 2 — Verificar critérios de aceite

```
✅ Satisfeito quando:
  - Há ao menos um critério de aceite por caminho de negócio (sucesso + erro principal)
  - Cada critério é verificável por teste — pode ser automatizado ou testado manualmente
  - Critérios cobrem: estado de sucesso, estado de erro, estado vazio (quando aplicável)

⛔ Bloqueado quando:
  - Não há critérios de aceite
  - Critérios usam linguagem vaga: "deve funcionar", "conforme combinado", "igual ao design"
  - Critérios cobrem apenas o happy path sem mencionar o comportamento em caso de erro
```

Exemplos de critério válido vs. inválido:

```
# ⛔ inválido — não verificável
"O sistema deve se comportar corretamente durante o checkout"

# ⛔ inválido — referência externa sem definição
"Seguir o que foi discutido na reunião de sexta"

# ✅ válido — verificável, com contexto e resultado observável
"Quando o pagamento é aprovado, o pedido é criado com status 'Confirmado'
e o carrinho é esvaziado"
```

### Passo 3 — Verificar escopo

```
✅ Satisfeito quando:
  - O que está fora do escopo está declarado explicitamente
  - A história pode ser entregue em um sprint por um desenvolvedor
  - Não depende de outra história não iniciada para ser testável

⛔ Bloqueado quando:
  - Não há declaração de "fora do escopo"
  - A história acumula múltiplas responsabilidades independentes entre si
  - A entrega só faz sentido junto com outra história ainda não iniciada
```

### Passo 4 — Verificar dependências

```
✅ Satisfeito quando:
  - Todas as dependências estão listadas com status (resolvida / pendente)
  - Contratos de API necessários estão definidos (pelo arquiteto)
  - Designs ou protótipos necessários estão disponíveis
  - Acesso a sistemas externos de teste está confirmado

⛔ Bloqueado quando:
  - Contrato de API necessário não está definido
  - Design de tela está pendente de aprovação do produto
  - Dependência de serviço externo sem ambiente de sandbox confirmado
  - História depende de migração de banco ainda não planejada
```

### Passo 5 — Emitir o resultado da validação

```markdown
## Validação DoR — <título da história>

**Resultado:** ✅ Aprovada para desenvolvimento | ⛔ Bloqueada

---

### Itens aprovados
- ✅ "Como / Quero / Para" claro e orientado ao valor
- ✅ Critérios de aceite verificáveis — <N> critérios definidos
- ✅ Escopo delimitado com "fora do escopo" declarado

### Bloqueadores (devem ser resolvidos antes do início)
- ⛔ Critérios de aceite ausentes para o caminho de erro no pagamento
  → Necessário: definir comportamento quando cartão é recusado
  → Responsável: produto / PO

- ⛔ Contrato do endpoint `POST /orders` não definido
  → Necessário: arquiteto definir o contrato com `planejar-api`
  → Responsável: arquiteto

### Próximo passo
<"Pronta para desenvolvimento" | "Retornar para refinamento com [responsável] antes de [data]">
```

---

## Matriz de bloqueadores por responsável

| Bloqueador | Responsável de resolver | Skill para resolver |
|---|---|---|
| Critérios de aceite ausentes ou vagos | Produto / PO | `refinar-historia` |
| Contrato de API não definido | Arquiteto | `planejar-api` |
| Schema de evento não definido | Arquiteto | `definir-evento` |
| Design de tela não aprovado | Designer / Produto | — |
| História grande demais | Tech-lead + Produto | `refinar-historia` |
| Dependência de serviço externo sem sandbox | Infraestrutura / Ops | — |

---

## Checklist de conclusão

- [ ] "Como / Quero / Para" verificado
- [ ] Critérios de aceite verificáveis — happy path + ao menos um erro
- [ ] Escopo delimitado com declaração de "fora do escopo"
- [ ] Dependências identificadas com status (resolvida / bloqueada)
- [ ] Resultado emitido: aprovada ou bloqueada com responsável por cada item
