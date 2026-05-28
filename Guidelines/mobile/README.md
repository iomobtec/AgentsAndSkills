# Guidelines — Mobile (React Native + Expo)

Guia de referência para desenvolvimento de aplicações móveis híbridas com **React Native** e **Expo**. Cobre a stack completa, decisões de arquitetura e padrões de implementação.

> Este arquivo é lido manualmente ou referenciado por skills. Não é carregado automaticamente no contexto do agente.

---

## Stack oficial

| Camada | Tecnologia | Versão mínima |
|---|---|---|
| Runtime | React Native | 0.76+ (Nova Architecture ativada por padrão) |
| SDK | Expo SDK | 52+ |
| Linguagem | TypeScript | 5.x |
| Navegação | Expo Router | 4.x |
| Estilização | NativeWind | 4.x |
| Server state | TanStack Query (React Query) | 5.x |
| Global state | Zustand | 5.x |
| Storage seguro | expo-secure-store | latest |
| Storage não-sensível | @react-native-async-storage/async-storage | latest |
| Listas performáticas | @shopify/flash-list | latest |
| Testes | Jest + React Native Testing Library | latest |
| Build & Publish | EAS Build + EAS Submit | latest |
| Updates OTA | expo-updates | latest |

---

## Princípios arquiteturais

### 1. Managed Workflow

O projeto usa **Expo Managed Workflow** — sem `android/` e `ios/` nativos no repositório. Customizações nativas são feitas exclusivamente via **Config Plugins** no `app.config.ts`.

Quando adotar **Bare Workflow** (exceção, requer aprovação do arquiteto):
- Biblioteca nativa sem Config Plugin disponível
- Módulo nativo próprio com código C++/Swift/Kotlin
- Performance crítica que exige customização de renderização

### 2. Separação de responsabilidades mobile

```
Tela (Screen)          → composição de componentes + orquestração de estado
Componente             → apresentação pura, recebe props, sem lógica de dados
Hook de dados          → integração com TanStack Query/BFF, retorna data/loading/error
Hook de lógica         → lógica de UI complexa extraída do componente
Store Zustand          → estado global de cliente (UI, preferências, session)
```

### 3. Fluxo de dados

```
BFF (HTTP)
   ↓
TanStack Query (cache, refetch, retry)
   ↓
Custom Hook (useOrders, useUser, etc.)
   ↓
Screen / Component
   ↓
Zustand Store (estado de UI local/global)
```

O app **nunca** acessa System APIs ou Process APIs diretamente (`mobile.md §4`).

---

## Estrutura de diretórios padrão

```
meu-app/
├── app/                           # Rotas Expo Router
│   ├── _layout.tsx                # RootLayout — providers globais
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── profile.tsx
│   └── +not-found.tsx
│
├── src/
│   ├── components/                # Componentes reutilizáveis
│   │   └── <ComponentName>/
│   │       ├── index.ts
│   │       ├── <ComponentName>.tsx
│   │       └── <ComponentName>.test.tsx
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useOrders.ts
│   │   └── useColorScheme.ts
│   │
│   ├── stores/                    # Zustand stores
│   │   └── authStore.ts
│   │
│   ├── services/                  # Clientes HTTP para o BFF
│   │   └── api.ts
│   │
│   ├── types/                     # Tipos TypeScript compartilhados
│   │   └── api.ts
│   │
│   └── utils/                     # Utilitários puros
│       └── formatters.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── app.config.ts                  # Configuração Expo (dinâmica)
├── eas.json                       # Perfis de build EAS
├── babel.config.js
├── tailwind.config.js             # NativeWind
├── tsconfig.json
└── .env                           # Variáveis de ambiente (nunca commitado)
```

---

## Configuração de cliente HTTP

```typescript
// src/services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.bffUrl,
  timeout: 10_000,
});

// Interceptor de autenticação
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

---

## Documentos relacionados

- [expo-config.md](expo-config.md) — Configuração `app.config.ts` e `eas.json`
- [navegacao.md](navegacao.md) — Padrões Expo Router
- [estado.md](estado.md) — TanStack Query + Zustand
- [eas-build.md](eas-build.md) — Build e publicação iOS + Android
