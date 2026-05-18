# React Style Guide

# Índice

- [React Style Guide](#react-style-guide)
- [Índice](#índice)
  - [Nomenclatura](#nomenclatura)
  - [Estrutura de Pastas](#estrutura-de-pastas)
  - [Componentes](#componentes)
  - [Props](#props)
  - [Hooks](#hooks)
  - [Estado](#estado)
  - [Rotas](#rotas)
  - [Estilos](#estilos)
  - [Performance](#performance)
  - [Testes](#testes)
    - [Propósito](#propósito)
    - [Princípios](#princípios)
    - [Anatomia de um teste](#anatomia-de-um-teste)
      - [Triplo AAA](#triplo-aaa)
      - [Nomenclatura](#nomenclatura-1)
    - [Estrutura no projeto](#estrutura-no-projeto)
  - [Acessibilidade](#acessibilidade)
  - [React Native](#react-native)
  - [Commits e Branches](#commits-e-branches)
  - [Referências](#referências)



## Nomenclatura

<details>
  <summary><b>Use PascalCase para componentes e camelCase para instâncias</b></summary>

**Bad:**

```tsx
import eventDetails from './EventDetails';

const eventitem = <EventDetails />;
```

**Good:**

```tsx
import EventDetails from './EventDetails';

const eventItem = <EventDetails />;
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use o nome do arquivo como nome do componente</b></summary>

O nome do componente deve corresponder ao nome do arquivo. Para componentes raiz de um diretório, use `index.ts` como nome de arquivo e o nome do diretório como nome do componente.

**Bad:**

```tsx
import Footer from './Footer/Footer';

import Footer from './Footer/index';
```

**Good:**

```tsx
import Footer from './Footer';
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Prefixe hooks customizados com "use"</b></summary>

Hooks devem sempre começar com `use` para que o React possa aplicar as regras de hooks e para deixar a intenção clara para o leitor.

**Bad:**

```tsx
function fetchUserData(userId: string) {
  const [user, setUser] = useState(null);
  // ...
  return user;
}
```

**Good:**

```tsx
function useUserData(userId: string) {
  const [user, setUser] = useState(null);
  // ...
  return user;
}
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Evite abreviações e siglas em nomes de componentes e variáveis</b></summary>

**Bad:**

```tsx
const UsrPrfCard = () => { /* ... */ };

const btnLbl = 'Confirmar';
```

**Good:**

```tsx
const UserProfileCard = () => { /* ... */ };

const buttonLabel = 'Confirmar';
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Variáveis de ambiente</b></summary>

Variáveis de ambiente devem seguir o padrão:

```
NX_<ESCOPO>_<DESCRICAO>
```

Onde `ESCOPO` é `GLOBAL` para variáveis de monorepo, ou o identificador da plataforma/squad (ex: `NCL`, `BEX`) para variáveis específicas.

**Feature Flags** seguem o mesmo padrão com a adição de `_FEAT_` antes da descrição:

```
NX_NCL_FEAT_NOVO_FLUXO_PAGAMENTO=true
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Identificadores para mapeamento analítico</b></summary>

Componentes de interação devem ter um `id` para rastreamento pelo Google Analytics. O padrão é:

```
componente-acao-elemento
```

```tsx
<Button id="sendForm-submit-button">Enviar</Button>

<Input id="loginForm-fill-emailInput" />
```

Os seguintes elementos **devem** possuir `id`:

- Alert, Button, Checkbox, CheckboxMultiSelect, Dropdown
- Form, Inputs, LinkButton, Modal, Tabs, Tag
- TextArea, Toggle, Tooltip, Upload

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Estrutura de Pastas

**Estrutura de monorepo**

```
apps/
  plataforma-web/
  plataforma-mobile/
libs/
  shared/
    httpclient/
    ui/
    hooks/
  modules/              (microfrontends / feature modules)
    eventos-criacao/
    eventos-relatorio/
    cliente-compra/
    cliente-pagamento/
```

**Estrutura de um módulo / microfrontend**

```
src/
  index.ts
  config/
    router.ts
    store.ts
  presentation/
    pages/
      criacao/
        CriacaoContainer.tsx
        index.ts
        components/
          CriacaoForm.tsx
    components/           (componentes reutilizáveis do módulo)
  application/
    types/
      dto/
        CriacaoDTO.ts
      model/
        CriacaoModel.ts
    features/
      criarEvento/
        criarEventoSlice.ts
        criarEventoAPI.ts
```

**[⬆ voltar ao topo](#índice)**



## Componentes

<details>
  <summary><b>Prefira componentes funcionais a componentes de classe</b></summary>

Componentes funcionais são mais simples, mais fáceis de testar e permitem o uso de hooks.

**Bad:**

```tsx
class UserCard extends React.Component<Props> {
  render() {
    return <div>{this.props.name}</div>;
  }
}
```

**Good:**

```tsx
const UserCard = ({ name }: Props) => {
  return <div>{name}</div>;
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Um componente deve ter apenas uma responsabilidade</b></summary>

Se um componente faz muitas coisas ao mesmo tempo (busca dados, controla estado e renderiza UI), divida-o.

**Bad:**

```tsx
const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => { setOrders(data); setLoading(false); });
  }, []);

  const handleCancel = (id: string) => {
    fetch(`/api/orders/${id}`, { method: 'DELETE' });
  };

  return (
    <div>
      {loading ? <Spinner /> : orders.map(o => (
        <div key={o.id}>
          {o.description}
          <button onClick={() => handleCancel(o.id)}>Cancelar</button>
        </div>
      ))}
    </div>
  );
};
```

**Good:**

```tsx
// hook responsável pelos dados
const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => { setOrders(data); setLoading(false); });
  }, []);

  const cancelOrder = (id: string) =>
    fetch(`/api/orders/${id}`, { method: 'DELETE' });

  return { orders, loading, cancelOrder };
};

// componente responsável apenas pela UI
const OrderPage = () => {
  const { orders, loading, cancelOrder } = useOrders();

  if (loading) return <Spinner />;

  return (
    <div>
      {orders.map(order => (
        <OrderItem key={order.id} order={order} onCancel={cancelOrder} />
      ))}
    </div>
  );
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Prefira composição a herança</b></summary>

React favorece composição. Em vez de herdar comportamento de um componente pai, componha componentes menores e especializados.

**Bad:**

```tsx
class SpecialButton extends Button {
  render() {
    return <button className="special">{this.props.children}</button>;
  }
}
```

**Good:**

```tsx
const SpecialButton = ({ children, ...props }: ButtonProps) => (
  <Button className="special" {...props}>
    {children}
  </Button>
);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Mantenha o JSX limpo: extraia lógica para variáveis ou funções</b></summary>

**Bad:**

```tsx
const UserList = ({ users }: Props) => (
  <ul>
    {users.filter(u => u.active).sort((a, b) => a.name.localeCompare(b.name)).map(u => (
      <li key={u.id}>{u.name} — {u.role === 'admin' ? 'Administrador' : 'Usuário'}</li>
    ))}
  </ul>
);
```

**Good:**

```tsx
const UserList = ({ users }: Props) => {
  const activeUsers = users
    .filter(u => u.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  const roleLabel = (role: string) => role === 'admin' ? 'Administrador' : 'Usuário';

  return (
    <ul>
      {activeUsers.map(user => (
        <li key={user.id}>{user.name} — {roleLabel(user.role)}</li>
      ))}
    </ul>
  );
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Sempre forneça uma key única e estável em listas</b></summary>

A `key` ajuda o React a identificar quais itens mudaram. Evite usar o índice do array quando a lista pode ser reordenada ou filtrada.

**Bad:**

```tsx
{items.map((item, index) => (
  <ItemCard key={index} item={item} />
))}
```

**Good:**

```tsx
{items.map(item => (
  <ItemCard key={item.id} item={item} />
))}
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Props

<details>
  <summary><b>Tipage todas as props com TypeScript</b></summary>

Defina uma interface ou type para as props de cada componente. Evite o uso de `any`.

**Bad:**

```tsx
const UserCard = (props: any) => (
  <div>{props.name}</div>
);
```

**Good:**

```tsx
interface UserCardProps {
  name: string;
  avatarUrl?: string;
  onSelect: (id: string) => void;
}

const UserCard = ({ name, avatarUrl, onSelect }: UserCardProps) => (
  <div onClick={() => onSelect(name)}>{name}</div>
);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Evite prop drilling — use composição ou contexto</b></summary>

Passar props por muitos níveis de componentes torna o código difícil de manter. Ao chegar no terceiro nível, considere contexto ou uma solução de estado global.

**Bad:**

```tsx
<App user={user}>
  <Dashboard user={user}>
    <Sidebar user={user}>
      <UserAvatar user={user} />
    </Sidebar>
  </Dashboard>
</App>
```

**Good:**

```tsx
// contexto ou store — UserAvatar consome diretamente
const UserAvatar = () => {
  const { user } = useUserContext();
  return <img src={user.avatarUrl} alt={user.name} />;
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Evite usar nomes de props DOM para outros fins</b></summary>

Props como `style` e `className` têm significado específico no React. Usar esses nomes para outros fins torna o código confuso.

**Bad:**

```tsx
<MyComponent style="fancy" />

<MyComponent className="fancy" />
```

**Good:**

```tsx
<MyComponent variant="fancy" />
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Prefira desestruturação de props</b></summary>

**Bad:**

```tsx
const UserCard = (props: UserCardProps) => (
  <div>
    <img src={props.avatarUrl} />
    <span>{props.name}</span>
  </div>
);
```

**Good:**

```tsx
const UserCard = ({ name, avatarUrl }: UserCardProps) => (
  <div>
    <img src={avatarUrl} />
    <span>{name}</span>
  </div>
);
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Hooks

<details>
  <summary><b>Siga as regras dos hooks</b></summary>

1. Chame hooks apenas no nível superior — nunca dentro de condicionais, loops ou funções aninhadas.
2. Chame hooks apenas em componentes funcionais React ou em hooks customizados.

**Bad:**

```tsx
const MyComponent = ({ isLoggedIn }: Props) => {
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // hook dentro de condicional
  }
  // ...
};
```

**Good:**

```tsx
const MyComponent = ({ isLoggedIn }: Props) => {
  const [user, setUser] = useState(null);

  if (!isLoggedIn) return null;

  return <div>{user?.name}</div>;
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Sempre declare o array de dependências do useEffect</b></summary>

Omitir o array de dependências faz o efeito rodar a cada render. Deixá-lo vazio faz rodar apenas na montagem. Declare explicitamente o que o efeito depende.

**Bad:**

```tsx
useEffect(() => {
  fetchUser(userId); // roda em todo render
});
```

**Bad:**

```tsx
useEffect(() => {
  fetchUser(userId); // não reage a mudanças de userId
}, []);
```

**Good:**

```tsx
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Faça limpeza (cleanup) em efeitos com assinaturas ou timers</b></summary>

Sem cleanup, efeitos que configuram assinaturas, listeners ou timers podem gerar memory leaks ou atualizar estado de componentes desmontados.

**Bad:**

```tsx
useEffect(() => {
  const subscription = eventBus.subscribe('update', handleUpdate);
  // sem cleanup — subscription fica ativa após desmontagem
}, []);
```

**Good:**

```tsx
useEffect(() => {
  const subscription = eventBus.subscribe('update', handleUpdate);
  return () => subscription.unsubscribe();
}, []);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Extraia lógica reutilizável em hooks customizados</b></summary>

Se dois componentes compartilham a mesma lógica stateful, mova-a para um hook customizado.

**Bad:**

```tsx
// lógica duplicada em OrderList e InvoiceList
const OrderList = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // ...lógica de paginação...
};

const InvoiceList = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // ...mesma lógica de paginação...
};
```

**Good:**

```tsx
const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const nextPage = () => setPage(p => p + 1);

  return { page, hasMore, setHasMore, nextPage };
};

const OrderList = () => {
  const { page, hasMore, nextPage } = usePagination();
  // ...
};

const InvoiceList = () => {
  const { page, hasMore, nextPage } = usePagination();
  // ...
};
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Estado

<details>
  <summary><b>Mantenha o estado o mais local possível</b></summary>

Não eleve o estado para um nível mais alto do que o necessário. Estado que pertence a um único componente deve ficar nele.

**Bad:**

```tsx
// estado de UI de um modal no store global
dispatch(setModalOpen(true));
```

**Good:**

```tsx
// estado local para controlar o modal
const [isModalOpen, setModalOpen] = useState(false);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use Context para estado compartilhado entre componentes distantes</b></summary>

O Context é adequado para dados que precisam ser acessados por muitos componentes em diferentes níveis da árvore (tema, usuário autenticado, idioma).

```tsx
interface AuthContextValue {
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use estado derivado em vez de sincronizar estados</b></summary>

Evite usar `useEffect` apenas para sincronizar um estado com outro. Compute o valor derivado diretamente.

**Bad:**

```tsx
const [items, setItems] = useState<Item[]>([]);
const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]);
```

**Good:**

```tsx
const [items, setItems] = useState<Item[]>([]);

const total = items.reduce((sum, item) => sum + item.price, 0);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Prefira um objeto de estado a múltiplos estados relacionados</b></summary>

Quando múltiplos estados representam uma única entidade, agrupe-os.

**Bad:**

```tsx
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');
```

**Good:**

```tsx
const [form, setForm] = useState({
  firstName: '',
  lastName: '',
  email: '',
});

const updateField = (field: string, value: string) =>
  setForm(prev => ({ ...prev, [field]: value }));
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Rotas

<details>
  <summary><b>Web — organize rotas por módulo/feature</b></summary>

Use React Router v6 e defina as rotas próximas ao módulo que elas representam, não em um único arquivo centralizado que cresce indefinidamente.

**Bad:**

```tsx
// routes.tsx — arquivo gigante com todas as rotas da aplicação
<Routes>
  <Route path="/orders" element={<OrderList />} />
  <Route path="/orders/:id" element={<OrderDetail />} />
  <Route path="/invoices" element={<InvoiceList />} />
  {/* ... 50 rotas ... */}
</Routes>
```

**Good:**

```tsx
// modules/orders/routes.tsx
export const orderRoutes = [
  { path: 'orders', element: <OrderList /> },
  { path: 'orders/:id', element: <OrderDetail /> },
];

// app/router.tsx — compõe as rotas dos módulos
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [...orderRoutes, ...invoiceRoutes],
  },
]);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Web — proteja rotas autenticadas com um componente wrapper</b></summary>

**Good:**

```tsx
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// uso
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Mobile — use React Navigation e defina tipos para os parâmetros de rota</b></summary>

Tipar os parâmetros de navegação evita erros em tempo de execução ao navegar entre telas.

**Bad:**

```tsx
navigation.navigate('OrderDetail', { id: order.id });

// na tela de destino
const { id } = route.params; // tipo desconhecido
```

**Good:**

```tsx
// types/navigation.ts
export type RootStackParamList = {
  OrderList: undefined;
  OrderDetail: { id: string };
};

// uso tipado
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
navigation.navigate('OrderDetail', { id: order.id });

// na tela de destino
const { id } = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>().params;
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Estilos

<details>
  <summary><b>Web — prefira CSS Modules ou styled-components a estilos inline</b></summary>

Estilos inline não suportam pseudo-seletores, media queries e dificultam a manutenção.

**Bad:**

```tsx
<div style={{ display: 'flex', padding: 16, backgroundColor: '#fff' }}>
  <span style={{ fontSize: 14, color: '#333' }}>{label}</span>
</div>
```

**Good (CSS Modules):**

```tsx
// UserCard.module.css
// .container { display: flex; padding: 16px; background: #fff; }
// .label { font-size: 14px; color: #333; }

import styles from './UserCard.module.css';

<div className={styles.container}>
  <span className={styles.label}>{label}</span>
</div>
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Web — use a nomenclatura BEM para classes CSS customizadas</b></summary>

O padrão BEM (Bloco, Elemento, Modificador) torna as classes CSS mais legíveis e evita conflitos de nomes.

```scss
// Bloco
.order-card { }

// Elemento
.order-card__title { }
.order-card__footer { }

// Modificador
.order-card--highlighted { }
.order-card__title--truncated { }
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Mobile — use StyleSheet.create em vez de objetos inline</b></summary>

`StyleSheet.create` valida os estilos em tempo de desenvolvimento e otimiza o envio dos estilos para a thread nativa.

**Bad:**

```tsx
<View style={{ flex: 1, padding: 16 }}>
  <Text style={{ fontSize: 16, color: '#000' }}>{title}</Text>
</View>
```

**Good:**

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 16,
    color: '#000',
  },
});

<View style={styles.container}>
  <Text style={styles.title}>{title}</Text>
</View>
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Centralize tokens de design (cores, espaçamentos, tipografia)</b></summary>

Evite valores mágicos espalhados pelo código. Centralize tokens em um arquivo de tema.

**Bad:**

```tsx
const styles = StyleSheet.create({
  button: { backgroundColor: '#FF6B00', borderRadius: 8, padding: 12 },
  title: { fontSize: 18, color: '#1A1A2E' },
});
```

**Good:**

```tsx
// theme/tokens.ts
export const colors = { primary: '#FF6B00', text: '#1A1A2E' };
export const spacing = { sm: 8, md: 12, lg: 16 };
export const font = { body: 14, title: 18 };

// componente
const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    padding: spacing.md,
  },
  title: { fontSize: font.title, color: colors.text },
});
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Performance

<details>
  <summary><b>Use React.memo para evitar re-renders desnecessários</b></summary>

`React.memo` faz com que o componente só re-renderize quando suas props mudarem.

**Good:**

```tsx
const OrderItem = React.memo(({ order, onCancel }: OrderItemProps) => (
  <div>
    <span>{order.description}</span>
    <button onClick={() => onCancel(order.id)}>Cancelar</button>
  </div>
));
```

> Use com critério: `React.memo` tem custo de comparação. Aplique apenas em componentes que re-renderizam com frequência e com props que raramente mudam.

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use useCallback para funções passadas como props</b></summary>

Sem `useCallback`, uma nova referência de função é criada a cada render, fazendo componentes filhos memorizados re-renderizarem mesmo assim.

**Bad:**

```tsx
const OrderList = () => {
  const handleCancel = (id: string) => {
    cancelOrder(id); // nova referência a cada render
  };

  return <OrderItem onCancel={handleCancel} />;
};
```

**Good:**

```tsx
const OrderList = () => {
  const handleCancel = useCallback((id: string) => {
    cancelOrder(id);
  }, []); // referência estável

  return <OrderItem onCancel={handleCancel} />;
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use useMemo para cálculos custosos</b></summary>

**Bad:**

```tsx
const ReportPage = ({ data }: Props) => {
  const summary = computeHeavySummary(data); // recalculado a cada render

  return <SummaryChart data={summary} />;
};
```

**Good:**

```tsx
const ReportPage = ({ data }: Props) => {
  const summary = useMemo(() => computeHeavySummary(data), [data]);

  return <SummaryChart data={summary} />;
};
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use carregamento lazy para rotas e componentes pesados</b></summary>

Dividir o bundle por rota reduz o tempo de carregamento inicial da aplicação.

**Good (Web):**

```tsx
const OrderDetail = lazy(() => import('./pages/OrderDetail'));

<Suspense fallback={<Spinner />}>
  <Route path="/orders/:id" element={<OrderDetail />} />
</Suspense>
```

**Good (Mobile):**

```tsx
// React Navigation já faz lazy loading de telas por padrão.
// Para componentes pesados dentro de uma tela, use lazy + Suspense da mesma forma.
const HeavyChart = lazy(() => import('./HeavyChart'));
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Testes

### Propósito

Os testes garantem que componentes e hooks se comportam como esperado para o usuário final. Ao fazer manutenção, os testes são o respaldo para não introduzir regressões.

### Princípios

- Teste comportamento, não implementação — evite verificar nomes de métodos internos ou estado direto
- Prefira queries que refletem o que o usuário vê: `getByRole`, `getByText`, `getByLabelText`
- Mocks apenas para dependências externas (API, navegação, storage)

### Anatomia de um teste

#### Triplo AAA

- **Arrange**: prepare o componente, props e mocks
- **Act**: simule a interação do usuário
- **Assert**: verifique o resultado na tela

> use comentários `// Arrange` `// Act` `// Assert`

#### Nomenclatura

> `ComponentName_shouldBehavior_whenCondition`

**Exemplo**

```tsx
// Usando Jest + React Testing Library

test('LoginForm_shouldShowError_whenCredentialsAreInvalid', async () => {
  // Arrange
  renderWithProviders(<LoginForm />);

  // Act
  await userEvent.type(screen.getByLabelText('E-mail'), 'wrong@email.com');
  await userEvent.type(screen.getByLabelText('Senha'), 'wrongpassword');
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

  // Assert
  expect(await screen.findByText(/credenciais inválidas/i)).toBeInTheDocument();
});
```

### Estrutura no projeto

```
src/
  components/
    UserCard/
      UserCard.tsx
      UserCard.test.tsx
  hooks/
    useOrders/
      useOrders.ts
      useOrders.test.ts
  pages/
    OrderDetail/
      OrderDetail.tsx
      OrderDetail.test.tsx
```

**[⬆ voltar ao topo](#índice)**



## Acessibilidade

<details>
  <summary><b>Use elementos HTML semânticos e roles ARIA corretamente</b></summary>

Prefira elementos nativos semânticos. Use atributos ARIA apenas quando não há alternativa nativa.

**Bad:**

```tsx
<div onClick={handleSubmit}>Enviar</div>

<div role="button" onClick={handleClose}>✕</div>
```

**Good:**

```tsx
<button type="submit" onClick={handleSubmit}>Enviar</button>

<button type="button" aria-label="Fechar modal" onClick={handleClose}>✕</button>
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Associe labels a campos de formulário</b></summary>

**Bad:**

```tsx
<input type="email" placeholder="Digite seu e-mail" />
```

**Good:**

```tsx
<label htmlFor="email">E-mail</label>
<input id="email" type="email" />
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Mobile — forneça accessibilityLabel em elementos interativos</b></summary>

Leitores de tela no mobile (TalkBack/VoiceOver) dependem de `accessibilityLabel` para descrever elementos que não possuem texto visível.

**Bad:**

```tsx
<TouchableOpacity onPress={handleFavorite}>
  <Icon name="heart" />
</TouchableOpacity>
```

**Good:**

```tsx
<TouchableOpacity
  onPress={handleFavorite}
  accessibilityLabel="Adicionar aos favoritos"
  accessibilityRole="button"
>
  <Icon name="heart" />
</TouchableOpacity>
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## React Native

<details>
  <summary><b>Separe código específico de plataforma com extensões de arquivo</b></summary>

O Metro Bundler (React Native) resolve automaticamente arquivos `.ios.tsx` e `.android.tsx`. Use isso para variações de plataforma, mantendo a interface do componente igual.

**Good:**

```
DatePicker.ios.tsx      ← implementação para iOS
DatePicker.android.tsx  ← implementação para Android
DatePicker.d.ts         ← tipos compartilhados
```

```tsx
// em ambos os arquivos, exporte o mesmo contrato
export interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use Platform.OS apenas para ajustes pontuais — evite em lógica complexa</b></summary>

**Bad:**

```tsx
const handlePress = () => {
  if (Platform.OS === 'ios') {
    doIOSThing();
    doAnotherIOSThing();
    // 20 linhas específicas de iOS
  } else {
    doAndroidThing();
    // 20 linhas específicas de Android
  }
};
```

**Good:**

```tsx
// ajuste pontual de estilo — OK
const shadowStyle = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },
  android: { elevation: 4 },
});

// lógica complexa — use extensões de arquivo (.ios.tsx / .android.tsx)
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Use FlatList em vez de ScrollView para listas longas</b></summary>

`ScrollView` renderiza todos os itens de uma vez. `FlatList` virtualiza a lista, renderizando apenas o que está visível na tela.

**Bad:**

```tsx
<ScrollView>
  {orders.map(order => <OrderItem key={order.id} order={order} />)}
</ScrollView>
```

**Good:**

```tsx
<FlatList
  data={orders}
  keyExtractor={order => order.id}
  renderItem={({ item }) => <OrderItem order={item} />}
/>
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Trate o teclado em formulários mobile</b></summary>

Sem tratamento, o teclado virtual pode cobrir campos de entrada, frustrando o usuário.

**Good:**

```tsx
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

const LoginScreen = () => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    <ScrollView keyboardShouldPersistTaps="handled">
      <TextInput label="E-mail" />
      <TextInput label="Senha" secureTextEntry />
      <Button title="Entrar" />
    </ScrollView>
  </KeyboardAvoidingView>
);
```

**[⬆ voltar ao topo](#índice)**

</details>

<details>
  <summary><b>Evite funções anônimas inline em renderItem do FlatList</b></summary>

Funções anônimas inline são recriadas a cada render, impedindo a otimização de `React.memo` nos itens da lista.

**Bad:**

```tsx
<FlatList
  data={orders}
  renderItem={({ item }) => <OrderItem order={item} onCancel={id => cancelOrder(id)} />}
/>
```

**Good:**

```tsx
const handleCancel = useCallback((id: string) => cancelOrder(id), []);

<FlatList
  data={orders}
  renderItem={({ item }) => <OrderItem order={item} onCancel={handleCancel} />}
/>
```

**[⬆ voltar ao topo](#índice)**

</details>

**[⬆ voltar ao topo](#índice)**



## Commits e Branches

**Formato do commit**

```
<tipo>: <resumo curto>
  │          │
  │          └─⫸ Resumo no tempo presente. Sem capitalização. Sem ponto final.
  │
  └─⫸ Tipo: feat | fix | docs | style | refactor | test | chore | perf | ci | build
```

**Exemplos:**

```
feat: adiciona paginação na listagem de pedidos
fix: corrige crash ao abrir modal sem dados
refactor: extrai lógica de autenticação para hook useAuth
```

**Nomenclatura de branches**

```
<tipo>/<descricao-curta>
```

- Funcionalidades: `feature/add-order-pagination`
- Correções: `fix/crash-empty-modal`

**[⬆ voltar ao topo](#índice)**



## Referências

- https://react.dev/learn
- https://reactnative.dev/docs/getting-started
- https://testing-library.com/docs/react-testing-library/intro/
- https://reactnavigation.org/docs/getting-started
- https://www.prisma.io/docs

**[⬆ voltar ao topo](#índice)**
