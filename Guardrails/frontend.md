# GuardRails — Frontend (React)

Regras específicas para desenvolvimento de interfaces com **React** e TypeScript. Complementa `00-core.md` — não substitui. Carregado por: `dev-frontend`, `dev-ui-ux`, `tech-lead`, `arquiteto`.

> **Regras visuais e de qualidade de interface** (acessibilidade, animação, touch, tipografia, formulários, performance visual) estão em `Guardrails/ux.md`. Este arquivo cobre exclusivamente padrões de código React/TypeScript.

---

## §1 — Apenas componentes funcionais em código novo

**Regra:** Todo componente novo é escrito como **função** (`function` ou arrow function). Componentes de classe (`class X extends React.Component`) não são criados em código novo. Componentes de classe existentes são mantidos, não migrados sem solicitação explícita.

**Motivo:** Hooks resolvem todos os casos de uso de class components de forma mais legível e testável. Manter dois paradigmas no mesmo codebase aumenta carga cognitiva.

### §1.1 — Bloqueado em código novo

```tsx
// ⛔ class component
class UserCard extends React.Component<Props, State> { ... }

// ✅ functional component
function UserCard({ user }: Props) { ... }
```

---

## §2 — Nunca manipular o DOM diretamente

**Regra:** Manipulação de DOM via `document.getElementById`, `querySelector`, `.innerHTML`, `.classList.add` é proibida em componentes React. Para acessar elementos DOM quando necessário, usar `useRef`. Para efeitos de estilo condicional, usar classes ou props de estilo controladas por estado.

**Motivo:** Manipulação direta do DOM bypassa o Virtual DOM do React, cria inconsistência de estado e causa bugs difíceis de reproduzir — a próxima renderização do React pode sobrescrever a mudança manual sem aviso.

---

## §3 — Estado colocado o mais próximo possível de onde é usado

**Regra:** Estado vive no componente que o usa. Só sobe (`lift state up`) quando dois ou mais componentes precisam compartilhá-lo. Só vai para gerenciador global (Context, Zustand, Redux, etc.) quando o dado é genuinamente global (sessão de usuário, tema, preferências de idioma).

**Motivo:** Estado global desnecessário torna o fluxo de dados difícil de rastrear, aumenta acoplamento e dificulta testes. Componente com estado local é autocontido e testável em isolamento.

### §3.1 — Checklist antes de usar estado global

- [ ] Mais de um componente **não-relacionado** precisa deste dado?
- [ ] O dado sobrevive a desmontagem de componente (ex.: cache, sessão)?
- [ ] Prop drilling ficaria com mais de 2 níveis?

Se nenhum for sim, o estado fica local.

---

## §4 — Sem `any` em TypeScript

**Regra:** Uso de `any` em TypeScript é proibido em código de produção. Para casos onde o tipo é genuinamente desconhecido, usar `unknown` e narrowing explícito. Para tipos de bibliotecas externas sem tipagem, declarar o tipo mínimo necessário.

**Motivo:** `any` desliga completamente a verificação de tipo para aquela variável e seus derivados — o benefício do TypeScript é eliminado na cadeia inteira a partir do `any`.

### §4.1 — Padrões bloqueados

```typescript
// ⛔ any explícito
function processData(data: any) { ... }

// ⛔ any implícito por cast
const user = response.data as any;

// ✅ unknown com narrowing
function processData(data: unknown) {
  if (!isValidUserData(data)) throw new Error('Invalid data');
  // data é narrowed a partir daqui
}
```

---

## §5 — Elementos interativos devem ser semânticamente corretos

**Regra:** Ações de clique ficam em `<button>`. Navegação fica em `<a>`. Nunca em `<div>` ou `<span>` sem `role` e `keyboard handler`. Para regras completas de acessibilidade (ARIA, contraste, formulários, animação, touch), ver `Guardrails/ux.md §1–§2`.

### §5.1 — Padrões bloqueados

```tsx
// ⛔ clique em div sem role
<div onClick={handleDelete}>Deletar</div>

// ⛔ botão sem label (apenas ícone sem texto alternativo)
<button onClick={handleClose}><XIcon /></button>

// ✅ button com aria-label quando sem texto visível
<button onClick={handleClose} aria-label="Fechar modal">
  <XIcon aria-hidden="true" />
</button>

// ✅ div com role quando realmente necessário
<div role="button" tabIndex={0} onClick={handleSelect} onKeyDown={handleKeyDown}>
  Selecionar
</div>
```

---

## §6 — Sem estilos inline para layout e tema

**Regra:** Estilos que controlam layout, espaçamento, cores ou tipografia são definidos via sistema de design (classes utilitárias, tokens CSS, CSS Modules, styled-components com tokens). `style={{ }}` inline é aceito apenas para valores **dinâmicos computados em runtime** que não podem ser expressos com classes (ex.: posição calculada, largura em porcentagem baseada em dado do servidor).

**Motivo:** Estilos inline não respondem a tema, não são reutilizáveis, escapam do sistema de design e tornam mudanças globais (ex.: trocar cor primária) incompletas.

---

## §7 — Não importar entre módulos sem contrato declarado (Module Federation)

**Regra:** Em projetos com Module Federation, um micro-frontend **nunca** importa diretamente do código-fonte de outro micro-frontend. Imports cruzados são feitos apenas via exposes/remotes declarados no `webpack.config` ou configuração equivalente. Tipos compartilhados ficam em pacote de tipos compartilhado.

**Motivo:** Import direto entre MFs cria acoplamento de build-time que derrota o propósito do Module Federation — deploys independentes ficam impossíveis porque uma mudança interna de um MF quebra outro.

### §7.1 — Bloqueado

```typescript
// ⛔ import direto do source de outro MF
import { UserHeader } from '../../mfe-auth/src/components/UserHeader';

// ✅ import via remote declarado
import { UserHeader } from 'mfe-auth/UserHeader'; // configurado como remote
```

---

## §8 — Chaves únicas e estáveis em listas

**Regra:** Todo elemento de lista renderizado com `.map()` deve ter prop `key` com valor **único e estável** (ID de entidade, slug, índice de banco). Nunca usar índice do array (`index`) como `key` em listas onde a ordem pode mudar ou itens podem ser inseridos/removidos.

**Motivo:** `key` baseada em índice faz o React reutilizar componentes de forma incorreta quando a lista muda — causa bugs de estado em inputs, animações e componentes com efeitos.
