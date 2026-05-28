# GuardRails — Mobile (React Native + Expo)

Regras específicas para desenvolvimento de aplicações móveis híbridas com **React Native** e **Expo**. Complementa `00-core.md` e `seguranca.md` — não substitui. Carregado por: `dev-mobile`.

> **Regras visuais e de qualidade de interface** (acessibilidade, animação, tipografia, formulários) estão em `Guardrails/ux.md`. Este arquivo cobre exclusivamente padrões de código React Native/Expo e comportamento específico de plataforma móvel.

---

## §1 — Apenas componentes funcionais em código novo

**Regra:** Todo componente novo é escrito como **função** (`function` ou arrow function). Componentes de classe não são criados em código novo. Componentes de classe existentes são mantidos, nunca migrados sem solicitação explícita.

**Motivo:** Hooks resolvem todos os casos de uso de class components de forma mais legível e testável. Manter dois paradigmas eleva a carga cognitiva e dificulta testes.

### §1.1 — Bloqueado em código novo

```tsx
// ⛔ class component
class UserCard extends React.Component<Props, State> { ... }

// ✅ functional component
function UserCard({ user }: Props) { ... }
```

---

## §2 — Estilos via StyleSheet.create ou NativeWind — sem inline para layout e tema

**Regra:** Estilos que controlam layout, espaçamento, cores ou tipografia são definidos via `StyleSheet.create()` ou classes NativeWind. `style={[]}` inline é aceito **apenas** para valores dinâmicos computados em runtime que não podem ser expressos de outra forma (ex.: largura proporcional a dado do servidor).

**Motivo:** Inline styles são recriados a cada render, contornam o sistema de design, escapam de temas e impossibilitam mudanças globais (ex.: trocar cor primária).

### §2.1 — Padrões bloqueados

```tsx
// ⛔ inline para layout fixo
<View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>

// ✅ StyleSheet.create
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
});
<View style={styles.container}>

// ✅ NativeWind
<View className="flex-1 p-4 bg-white">

// ✅ inline apenas para valor dinâmico
<View style={{ height: progressHeight }}>   // valor calculado — aceitável
```

---

## §3 — Navegação exclusivamente via Expo Router

**Regra:** Em projetos novos, toda navegação usa **Expo Router** (file-based routing). Configuração manual de navegadores com `React Navigation` diretamente não é usada em código novo. Rotas ficam em `app/`; grupos de layout em `_layout.tsx`; parâmetros em `[id].tsx`.

**Motivo:** Expo Router é o padrão atual do ecossistema Expo, oferece deep linking nativo sem configuração adicional e tipagem automática de rotas, reduzindo boilerplate e inconsistências.

### §3.1 — Estrutura obrigatória de rotas

```
app/
├── _layout.tsx          # RootLayout — providers, tema, fonte
├── (auth)/
│   ├── _layout.tsx      # Stack sem header
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── _layout.tsx      # TabLayout — ícones, labels
│   ├── index.tsx        # Tab Home
│   └── profile.tsx      # Tab Perfil
└── [id].tsx             # Rota dinâmica
```

### §3.2 — Bloqueado

```tsx
// ⛔ configuração manual de NavigationContainer em projeto Expo Router
import { NavigationContainer } from '@react-navigation/native';
<NavigationContainer>...</NavigationContainer>

// ✅ Expo Router gerencia o NavigationContainer automaticamente
// navegação via Link ou router.push
import { router } from 'expo-router';
router.push('/profile');
```

---

## §4 — Nunca chamar backend diretamente — sempre via BFF

**Regra:** O app mobile **não chama** System APIs, Process APIs ou bancos de dados diretamente. Toda comunicação HTTP passa pelo BFF via hook customizado. Nenhuma URL de serviço interno é hardcoded no app mobile.

**Motivo:** O BFF é a camada de adaptação entre o mobile e o backend — ele agrega, formata e protege. Chamar diretamente acopla o mobile à estrutura interna do backend, expõe URLs internas e impossibilita mudanças de contrato sem versionar o app.

### §4.1 — Bloqueado

```tsx
// ⛔ chamada direta para System API ou Process API
const response = await fetch('https://api-interna.meudominio.com/orders');

// ✅ hook que encapsula chamada ao BFF
const { orders, isLoading, error } = useOrders();
```

---

## §5 — Acessibilidade mobile obrigatória

**Regra:** Todo elemento interativo deve ter `accessibilityLabel` descritivo. Elementos informativos relevantes devem ter `accessibilityRole`. Imagens decorativas recebem `accessible={false}`. O app deve funcionar com TalkBack (Android) e VoiceOver (iOS). Suporte a Dynamic Type é obrigatório — nunca usar `allowFontScaling={false}`.

**Motivo:** Acessibilidade é requisito legal em muitos mercados e uma responsabilidade de produto. Remoção de `allowFontScaling` penaliza usuários com necessidades de acessibilidade visual.

### §5.1 — Padrões obrigatórios

```tsx
// ✅ botão com label acessível
<TouchableOpacity
  onPress={handleDelete}
  accessibilityLabel="Excluir pedido"
  accessibilityRole="button"
  accessibilityHint="Toque duas vezes para excluir permanentemente"
>
  <TrashIcon />
</TouchableOpacity>

// ✅ imagem decorativa marcada como não acessível
<Image source={decorativeImg} accessible={false} />

// ✅ texto com Dynamic Type (padrão — não bloquear)
<Text>Conteúdo</Text>                    // allowFontScaling={true} por padrão

// ⛔ bloqueio de Dynamic Type
<Text allowFontScaling={false}>...</Text>
```

---

## §6 — Performance de listas: FlashList em vez de FlatList

**Regra:** Para listas com potencial de crescer além de 20 itens, usar **FlashList** (`@shopify/flash-list`) em vez de `FlatList`. `keyExtractor` é sempre fornecido com ID estável da entidade. `estimatedItemSize` é obrigatório no FlashList.

**Motivo:** FlatList realiza medição de layout por item, causando janks perceptíveis em listas longas. FlashList recicla componentes de forma mais eficiente, com performance próxima à de listas nativas.

### §6.1 — Padrões

```tsx
// ⛔ FlatList para listas grandes
<FlatList data={orders} renderItem={({ item }) => <OrderRow order={item} />} />

// ✅ FlashList com keyExtractor e estimatedItemSize
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={orders}
  renderItem={({ item }) => <OrderRow order={item} />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={72}
/>
```

---

## §7 — Armazenamento seguro para dados sensíveis

**Regra:** Tokens de autenticação, chaves de API, dados pessoais sensíveis e qualquer dado que não deva ser lido por outros apps são armazenados **exclusivamente** em `expo-secure-store`. `AsyncStorage` e `MMKV` são aceitos apenas para preferências não sensíveis (tema, idioma, flags de onboarding).

**Motivo:** `AsyncStorage` armazena em texto plano sem criptografia — em dispositivos com root/jailbreak ou backups, o conteúdo é legível. `expo-secure-store` usa Keychain (iOS) e Android Keystore, que são criptografados pelo sistema operacional.

### §7.1 — Classificação obrigatória antes de escolher storage

| Dado | Storage correto |
|---|---|
| Token JWT, refresh token | `expo-secure-store` |
| Chave de API | `expo-secure-store` |
| Dados pessoais (CPF, senha) | `expo-secure-store` |
| Tema, idioma, onboarding visto | `AsyncStorage` ou `MMKV` |
| Cache de dados públicos | `AsyncStorage` ou `MMKV` |

### §7.2 — Bloqueado

```tsx
// ⛔ token em AsyncStorage
await AsyncStorage.setItem('token', jwtToken);

// ✅ token em SecureStore
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('auth_token', jwtToken);
```

---

## §8 — Condicionais de plataforma explícitos

**Regra:** Código específico de plataforma deve ser **explícito**. Lógica simples usa `Platform.OS === 'ios'` / `Platform.OS === 'android'`. Quando a diferença é estrutural (layout completamente diferente, comportamento de gesto divergente), criar arquivos separados: `Component.ios.tsx` e `Component.android.tsx`. Nunca misturar lógica de plataforma com lógica de negócio no mesmo bloco.

**Motivo:** Condicionais de plataforma implícitos ou espalhados tornam o código difícil de manter e testar. A separação explícita torna o comportamento previsível e a responsabilidade de cada arquivo clara.

### §8.1 — Quando usar cada abordagem

```tsx
// ✅ diferença simples — Platform.OS inline
const shadowStyle = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
  android: { elevation: 4 },
});

// ✅ diferença estrutural — arquivos separados
// Header.ios.tsx    → usa BlurView do iOS
// Header.android.tsx → usa MaterialHeader nativo
// Import automático pelo Metro bundler pelo .ios/.android suffix
```

---

## §9 — Sem `any` em TypeScript

**Regra:** Uso de `any` em TypeScript é proibido em código de produção. Para tipos genuinamente desconhecidos, usar `unknown` com narrowing explícito. Tipos de resposta do BFF são sempre derivados do contrato definido pelo arquiteto.

**Motivo:** `any` desliga completamente a verificação de tipo para aquela variável e todos seus derivados — o benefício de TypeScript é eliminado na cadeia inteira.

### §9.1 — Bloqueados

```typescript
// ⛔ any explícito
function handleResponse(data: any) { ... }

// ⛔ any implícito por cast
const user = response.data as any;

// ✅ unknown com narrowing
function handleResponse(data: unknown) {
  if (!isValidUser(data)) throw new Error('Invalid response');
}
```

---

## §10 — Permissões sob demanda e explicadas ao usuário

**Regra:** Permissões sensíveis (câmera, microfone, localização, notificações, contatos, galeria) são solicitadas **somente** no momento em que o usuário tenta usar a funcionalidade correspondente, nunca no startup do app. Antes da solicitação nativa, o app exibe uma tela/modal próprio explicando por que a permissão é necessária.

**Motivo:** Solicitar permissões no startup sem contexto é a principal causa de rejeição pelo usuário. App Store e Google Play penalizam apps que solicitam permissões desnecessárias ou sem justificativa clara.

### §10.1 — Fluxo obrigatório de permissão

```
1. Usuário tenta acessar funcionalidade que requer permissão
2. App exibe modal próprio: "Para tirar fotos, o app precisa acessar sua câmera."
3. Usuário confirma → solicitar permissão nativa via expo-camera / expo-location / etc.
4. Se negada → informar o que fica indisponível e como habilitar nas configurações
```

### §10.2 — Bloqueado

```tsx
// ⛔ permissão no startup
useEffect(() => {
  Camera.requestCameraPermissionsAsync(); // no App.tsx ou _layout.tsx raiz
}, []);

// ✅ permissão contextual ao usar a funcionalidade
async function handleOpenCamera() {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    showPermissionDeniedModal();
    return;
  }
  openCamera();
}
```
