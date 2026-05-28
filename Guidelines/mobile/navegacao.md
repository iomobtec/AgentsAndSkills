# Navegação — Expo Router

Padrões de navegação com Expo Router (file-based routing). Referência para implementação de layouts, autenticação, deep linking e passagem de parâmetros.

---

## Conceitos fundamentais

| Conceito | Descrição |
|---|---|
| `_layout.tsx` | Define o layout (Stack, Tabs, Drawer) para as rotas do diretório |
| `(grupo)/` | Agrupa rotas sob um layout sem afetar a URL — ex: `(auth)/login` → `/login` |
| `[param].tsx` | Rota dinâmica — `[id].tsx` captura `/orders/123` com `params.id = '123'` |
| `+not-found.tsx` | Tela de 404 para rotas inexistentes |
| `index.tsx` | Rota padrão do diretório (equivale a `/`) |

---

## RootLayout — providers globais

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/src/services/queryClient';
import { useAuthRedirect } from '@/src/hooks/useAuthRedirect';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  useAuthRedirect(); // redireciona para (auth) se não autenticado
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

---

## Autenticação com redirect condicional

```tsx
// src/hooks/useAuthRedirect.ts
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export function useAuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);
}
```

---

## Layout de Tabs

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { House, User, ShoppingCart } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          tabBarAccessibilityLabel: 'Tela inicial',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

---

## Stack com cabeçalho

```tsx
// app/(tabs)/orders/_layout.tsx
import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Meus Pedidos' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalhes do Pedido' }} />
    </Stack>
  );
}
```

---

## Rota dinâmica e passagem de parâmetros

```tsx
// app/(tabs)/orders/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { useOrder } from '@/src/hooks/useOrder';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, isLoading, error } = useOrder(id);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;
  if (!order) return <NotFoundScreen />;

  return <OrderDetail order={order} />;
}
```

### Navegação programática

```tsx
import { router } from 'expo-router';

// Navegar para frente
router.push('/orders/123');
router.push({ pathname: '/orders/[id]', params: { id: '123' } });

// Substituir (sem voltar)
router.replace('/(tabs)');

// Voltar
router.back();

// Verificar se pode voltar
router.canGoBack();
```

---

## Modais

```tsx
// app/_layout.tsx — adicionar rota de modal
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen
    name="modal/confirm-delete"
    options={{
      presentation: 'modal',
      title: 'Confirmar exclusão',
    }}
  />
</Stack>

// Abrir modal
router.push('/modal/confirm-delete');
```

---

## Deep linking

Expo Router configura deep linking automaticamente com base na estrutura de arquivos. Para testar:

```bash
# iOS Simulator
xcrun simctl openurl booted "meuapp://orders/123"

# Android Emulator
adb shell am start -a android.intent.action.VIEW -d "meuapp://orders/123"
```

Configurar scheme no `app.config.ts`:

```typescript
scheme: 'meuapp',   // habilita meuapp://...
```

---

## Tipagem de parâmetros de rota

```typescript
// Parâmetros seguros com useLocalSearchParams
const { id, filter } = useLocalSearchParams<{
  id: string;
  filter?: 'active' | 'completed';
}>();

// Parâmetros globais (disponíveis em qualquer nível da stack)
const params = useGlobalSearchParams();
```
