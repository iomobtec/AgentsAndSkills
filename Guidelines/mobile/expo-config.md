# Expo Config — app.config.ts e eas.json

Referência para configuração do projeto Expo, variáveis de ambiente e perfis EAS.

---

## app.config.ts (dinâmico vs app.json estático)

Usar `app.config.ts` (TypeScript) em vez de `app.json` para habilitar configuração dinâmica com variáveis de ambiente e lógica condicional por ambiente.

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_ENV === 'production' ? 'MeuApp' : 'MeuApp (Dev)',
  slug: 'meu-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',   // suporte a dark mode automático
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.empresa.meuapp',
    buildNumber: process.env.BUILD_NUMBER ?? '1',
    config: {
      usesNonExemptEncryption: false,   // declaração obrigatória para App Store
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.empresa.meuapp',
    versionCode: Number(process.env.VERSION_CODE ?? 1),
    permissions: [],   // declarar apenas permissões usadas
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-camera',
      { cameraPermission: 'O app usa a câmera para escanear QR codes.' },
    ],
    [
      'expo-location',
      { locationWhenInUsePermission: 'O app usa sua localização para encontrar lojas próximas.' },
    ],
  ],
  extra: {
    bffUrl: process.env.BFF_URL,
    environment: process.env.APP_ENV ?? 'development',
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    enabled: process.env.APP_ENV === 'production',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  experiments: {
    typedRoutes: true,   // tipagem automática das rotas Expo Router
  },
});
```

---

## Variáveis de ambiente

Usar `.env` local + `process.env` no `app.config.ts`. Expo carrega `.env` automaticamente via `dotenv` interno.

```bash
# .env.development
APP_ENV=development
BFF_URL=http://localhost:3000
EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# .env.staging
APP_ENV=staging
BFF_URL=https://bff-staging.meudominio.com
EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# .env.production
APP_ENV=production
BFF_URL=https://bff.meudominio.com
EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Acessar no código via `expo-constants`:

```typescript
import Constants from 'expo-constants';

const bffUrl = Constants.expoConfig?.extra?.bffUrl as string;
const env = Constants.expoConfig?.extra?.environment as string;
```

**Nunca** usar `process.env` diretamente dentro do código do app (somente em `app.config.ts`). Valores de `extra` são embarcados no bundle; **não colocar secrets** em `extra`.

---

## eas.json — Perfis de build

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "requireCommit": true
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "APP_ENV": "staging",
        "BFF_URL": "https://bff-staging.meudominio.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production",
        "BFF_URL": "https://bff.meudominio.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@empresa.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## Config Plugins — quando e como usar

Config Plugins modificam o código nativo gerado durante o `prebuild`. Usar sempre que uma biblioteca nativa precisar de configuração que vai além do `app.config.ts`.

```typescript
// app.config.ts — plugin customizado
plugins: [
  // Plugin oficial da biblioteca (forma preferida)
  'expo-camera',

  // Plugin com opções
  ['expo-camera', { cameraPermission: 'Mensagem personalizada.' }],

  // Plugin local (quando não existe plugin oficial)
  ['./plugins/withCustomPermissions', { permissionName: 'valor' }],
],
```

**Regra:** se uma biblioteca exige modificação manual de `AndroidManifest.xml`, `Info.plist`, `build.gradle` ou `AppDelegate`, ela **deve** ter um Config Plugin. Modificações manuais nesses arquivos são sobrescritas pelo `eas build`.

---

## Tipagem de rotas (typedRoutes)

Com `experiments.typedRoutes: true`, o Expo Router gera tipos automáticos:

```typescript
import { Link } from 'expo-router';

// ✅ tipo verificado em compile-time
<Link href="/profile">Perfil</Link>
<Link href={{ pathname: '/orders/[id]', params: { id: orderId } }}>Pedido</Link>

// ⛔ rota inexistente — erro em compile-time com typedRoutes ativo
<Link href="/pagina-que-nao-existe">...</Link>
```
