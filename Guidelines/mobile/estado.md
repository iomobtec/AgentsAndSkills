# Estado — TanStack Query + Zustand

Pirâmide de estado para aplicações mobile: quando usar cada camada, como integrá-las e anti-padrões a evitar.

---

## Pirâmide de estado

```
┌─────────────────────────────────────┐
│        Estado de UI Local           │  useState, useReducer
│    (dentro do componente/tela)      │
├─────────────────────────────────────┤
│      Estado Global de Cliente       │  Zustand
│  (UI, preferências, auth session)   │
├─────────────────────────────────────┤
│       Estado de Servidor            │  TanStack Query
│  (dados do BFF: cache, sync, retry) │
└─────────────────────────────────────┘
```

**Regra de escalada:** só sobe para a camada acima quando necessário. Um dado que só uma tela usa fica em `useState`. Só vai para Zustand quando duas ou mais telas precisam compartilhá-lo sem relação pai-filho.

---

## TanStack Query — Server State

### Configuração do QueryClient

```typescript
// src/services/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutos — não refetch desnecessário
      gcTime: 1000 * 60 * 10,          // 10 minutos em cache após desmontagem
      retry: 2,                         // 2 tentativas em caso de erro
      refetchOnWindowFocus: false,      // mobile não tem "foco de janela"
      refetchOnReconnect: true,         // refetch ao reconectar à internet
    },
    mutations: {
      retry: 0,                         // mutations não reprocessam automaticamente
    },
  },
});
```

### Hook de query padrão

```typescript
// src/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/services/api';
import type { Order, CreateOrderDto } from '@/src/types/api';

// Query keys centralizadas (evitar magic strings)
export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

// Busca lista
export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: () => api.get<Order[]>('/orders').then((r) => r.data),
  });
}

// Busca item único
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api.get<Order>(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,   // não executar sem ID
  });
}

// Mutation com invalidação automática
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOrderDto) =>
      api.post<Order>('/orders', dto).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
  });
}
```

### Uso na tela

```tsx
export default function OrdersScreen() {
  const { data: orders, isLoading, error, refetch } = useOrders();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen onRetry={refetch} />;
  if (!orders?.length) return <EmptyState message="Nenhum pedido encontrado." />;

  return (
    <FlashList
      data={orders}
      renderItem={({ item }) => <OrderRow order={item} />}
      keyExtractor={(item) => item.id}
      estimatedItemSize={72}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}
```

---

## Zustand — Estado Global de Cliente

### Quando usar

- Autenticação (token, user info) — precisa estar disponível em qualquer tela
- Preferências de UI (tema, idioma) — persiste entre sessões
- Estado de seleção multi-tela (carrinho de compras) — compartilhado entre tabs
- Modais/drawers globais — controlados de qualquer ponto do app

**Não usar para:** dados que vêm do servidor (use TanStack Query). Zustand é para estado que o cliente controla.

### Store de autenticação

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  login: (token: string, user: AuthState['user']) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  user: null,

  login: async (token, user) => {
    // Token vai para SecureStore (mobile.md §7) — nunca no Zustand/AsyncStorage
    await SecureStore.setItemAsync('auth_token', token);
    set({ isAuthenticated: true, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ isAuthenticated: false, user: null });
  },
}));
```

### Store com persistência de preferências

```typescript
// src/stores/preferencesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesState {
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US';
  hasSeenOnboarding: boolean;
  setTheme: (theme: PreferencesState['theme']) => void;
  setLanguage: (lang: PreferencesState['language']) => void;
  markOnboardingComplete: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'pt-BR',
      hasSeenOnboarding: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      markOnboardingComplete: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Checklist — decisão de estado

Antes de escolher onde colocar um estado, responder:

| Pergunta | Se sim |
|---|---|
| O dado vem do servidor (BFF)? | TanStack Query |
| O dado é um token ou informação de auth? | Zustand (em memória) + SecureStore (persist) |
| O dado é uma preferência do usuário (tema, idioma)? | Zustand + AsyncStorage (persist) |
| O dado é compartilhado entre duas ou mais telas sem relação pai-filho? | Zustand |
| O dado é usado somente dentro de um componente/tela? | useState local |
| O dado é o estado de um formulário? | useState local ou react-hook-form |

---

## Anti-padrões bloqueados

```typescript
// ⛔ dados do servidor em Zustand (duplica cache, cria inconsistência)
const useOrderStore = create(() => ({ orders: [] as Order[] }));

// ⛔ fetch manual em useEffect em vez de TanStack Query
useEffect(() => {
  fetch('/orders').then(r => r.json()).then(setOrders);
}, []);

// ⛔ token em estado React (perde ao recarregar, exposto em React DevTools)
const [token, setToken] = useState('');

// ✅ token em SecureStore, user info em Zustand
const { user } = useAuthStore();
const token = await SecureStore.getItemAsync('auth_token');
```
