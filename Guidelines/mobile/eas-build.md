# EAS Build e EAS Submit — Build e Publicação

Processo completo de build e publicação para iOS e Android usando Expo Application Services (EAS).

---

## Pré-requisitos

```bash
# Instalar CLI
npm install -g eas-cli

# Autenticar na conta Expo
eas login

# Configurar projeto (gera eas.json e vincula ao projeto Expo)
eas init
```

---

## Fluxo de build

### 1. Build de desenvolvimento (Expo Go com módulos nativos)

```bash
# Gera cliente de desenvolvimento — instalar no dispositivo físico ou simulador
eas build --profile development --platform ios
eas build --profile development --platform android

# Build local (sem enviar para servidores EAS — requer Xcode/Android Studio)
eas build --profile development --platform ios --local
```

### 2. Build de preview (distribuição interna — TestFlight / Firebase App Distribution)

```bash
# Ambas plataformas em paralelo
eas build --profile preview --platform all

# Gera link de download para distribuição interna
```

### 3. Build de produção (envio às stores)

```bash
# iOS (gera .ipa para App Store)
eas build --profile production --platform ios

# Android (gera .aab para Google Play)
eas build --profile production --platform android

# Ambas em paralelo
eas build --profile production --platform all
```

---

## Certificados e keystores

### iOS — Automático via EAS (recomendado)

```bash
# EAS gera e gerencia certificados automaticamente
# Na primeira execução, solicita credenciais Apple Developer

eas credentials --platform ios
```

O EAS gerencia:
- Distribution Certificate
- Provisioning Profile (Ad Hoc, App Store)
- Push Notification Certificate

### Android — Keystore automático

```bash
eas credentials --platform android
```

O EAS gera e armazena o keystore com segurança. **Nunca commitar o keystore no repositório.** Fazer backup no painel EAS.

### CI/CD — Credenciais via variáveis de ambiente

```bash
# Definir no painel EAS ou via CLI
eas secret:create --scope project --name EXPO_TOKEN --value "xxx"
eas secret:create --scope project --name APPLE_ID --value "dev@empresa.com"
```

---

## EAS Submit — Publicação nas stores

### App Store (iOS)

```bash
# Após build de produção bem-sucedido
eas submit --platform ios --latest

# Ou especificando o build
eas submit --platform ios --id <build-id>
```

Requisitos:
- Apple Developer Program ativo ($99/ano)
- App criado em App Store Connect
- `ascAppId` configurado no `eas.json`
- Metadados da store prontos (screenshots, descrição, palavras-chave)

### Google Play (Android)

```bash
eas submit --platform android --latest
```

Requisitos:
- Conta Google Play Console ativa ($25 único)
- App criado no Google Play Console
- Service Account JSON com permissões de publicação
- `serviceAccountKeyPath` configurado no `eas.json`
- Track configurado: `internal` → `alpha` → `beta` → `production`

---

## OTA Updates — expo-updates

OTA (Over-the-Air) permite publicar atualizações de JavaScript sem passar pelas stores, desde que não haja mudança de código nativo.

### Publicar update OTA

```bash
# Publicar para o canal de produção
eas update --branch production --message "Corrige layout da tela de pedidos"

# Publicar para canal de preview (staging)
eas update --branch preview --message "Nova feature: filtro de pedidos"
```

### Quando OTA **não** é suficiente (requer novo build)

- Adição ou remoção de Config Plugin
- Mudança de versão nativa de dependência (`expo-camera`, `expo-notifications`, etc.)
- Mudança em `app.config.ts` que afeta código nativo (permissões, schemes, etc.)
- Atualização de versão do SDK Expo

### Configuração de canais (branches)

```json
// eas.json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

---

## Automação via GitHub Actions

```yaml
# .github/workflows/eas-build.yml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build production
        run: eas build --profile production --platform all --non-interactive

      - name: Submit to stores
        run: eas submit --platform all --latest --non-interactive
        env:
          EXPO_APPLE_ID: ${{ secrets.APPLE_ID }}
```

---

## Checklist pré-publicação

- [ ] `version` e `buildNumber`/`versionCode` incrementados
- [ ] Assets de store atualizados (screenshots 6.7" iPhone, 12.9" iPad, vários Android)
- [ ] `app.config.ts` revisado: permissões apenas do que é usado
- [ ] `expo-updates` configurado com `runtimeVersion` correto
- [ ] Build de preview testado no TestFlight e distribuição Android interna
- [ ] Notas de versão escritas (What's New)
- [ ] Rating e classificação etária revisados se houver nova funcionalidade
- [ ] Política de privacidade atualizada se houver coleta de novos dados
