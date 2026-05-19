# Padrões de Teste — Referência Rápida

> Uso: durante escrita de testes. Não é um guia completo — são os padrões mais usados e as armadilhas mais comuns.

---

## Pirâmide de Testes — Quando Usar Cada Camada

| Camada | % do total | Quando usar |
|---|---|---|
| **Unit** | ~80% | Lógica de negócio isolada, transformações, validações, casos extremos |
| **Integration** | ~15% | Contratos entre camadas, queries reais no banco, serialização HTTP |
| **E2E** | ~5% | Fluxos críticos do usuário — não substituem unit/integration |

> Se você está escrevendo mais E2E do que unit, a pirâmide está invertida. Revise a estratégia.

---

## Nomenclatura de Testes

Padrão: **`deve <comportamento esperado> quando <condição>`**

```
// Correto
deve retornar erro 400 quando CPF for inválido
deve calcular prêmio com desconto quando cliente tiver mais de 3 anos de apólice
deve enviar e-mail de boas-vindas quando novo usuário for criado

// Errado
teste CPF
calcula prêmio
usuario()
```

> O nome do teste é a documentação do comportamento. Deve ser legível sem olhar o código.

---

## DAMP vs DRY em Testes

**Testes devem ser DAMP** (Descriptive And Meaningful Phrases) — **não DRY**.

- Repetição em testes é **aceitável** se melhora clareza
- Abstrair demais esconde o comportamento sendo testado
- Cada teste deve ser legível de forma **independente**, sem precisar rastrear helpers

```typescript
// DRY demais — o que exatamente está sendo testado?
it('deve processar', () => {
  setup();
  const result = act();
  assertResult(result);
});

// DAMP — claro e autocontido
it('deve rejeitar apólice quando veículo tiver mais de 20 anos', () => {
  const veiculo = { ano: 2000, modelo: 'Gol' };
  const resultado = avaliarElegibilidade(veiculo);
  expect(resultado.aprovado).toBe(false);
  expect(resultado.motivo).toBe('VEICULO_FORA_DE_FAIXA');
});
```

---

## Prioridade: Real vs Mock

**Real > Fakes > Stubs > Mocks**

| Tipo | Quando usar |
|---|---|
| **Implementação real** | Sempre que possível (banco em memória, lógica pura) |
| **Fake** | Substituto funcional simplificado (ex: repositório em memória) |
| **Stub** | Retorna valor fixo para um caminho específico |
| **Mock** | Apenas na **fronteira do sistema**: e-mail, SMS, API externa, fila |

> Mock que não está na fronteira do sistema é sinal de design ruim — provavelmente falta uma interface.

---

## Padrão AAA — Arrange → Act → Assert

Separe visualmente as três seções. Sem seções misturadas.

```typescript
it('deve aplicar desconto fidelidade quando cliente tiver mais de 2 anos', () => {
  // Arrange
  const cliente = criarClienteComAnosDeContrato(3);
  const calculadora = new CalculadoraDePremio();

  // Act
  const premio = calculadora.calcular(cliente);

  // Assert
  expect(premio.desconto).toBe(0.10);
  expect(premio.valorFinal).toBeLessThan(premio.valorBase);
});
```

---

## Beyonce Rule

> "Se não tem teste, não é uma regra."

Se um comportamento quebraria em produção, deve ter teste. Isso inclui:
- Regras de negócio implícitas ("nunca pode ser negativo")
- Casos de borda que já causaram bug antes
- Comportamentos de segurança (autorização, sanitização)

---

## Armadilhas Comuns

- [ ] **Teste que testa implementação, não comportamento** — se refatorar sem mudar comportamento e o teste quebrar, está errado
- [ ] **Mock que mascara ausência de interface** — se precisa mockar uma classe concreta, extraia uma interface
- [ ] **Dependência de ordem de execução** — cada teste deve funcionar de forma isolada e em qualquer ordem
- [ ] **Teste sem assertion** — `expect` ausente faz o teste sempre passar (use linters: `jest/expect-expect`)
- [ ] **Assertion sempre verdadeira** — `expect(true).toBe(true)` não testa nada útil
- [ ] **Setup compartilhado mutado entre testes** — use `beforeEach` para recriar, não reusar estado
- [ ] **Teste com múltiplos `Act`** — geralmente indica que deveriam ser dois testes separados

---

## Referências

- `Guardrails/testes.md` — regras obrigatórias de cobertura e qualidade de testes na Junto
- `Guidelines/testes/README.md` — guia completo de estratégia de testes
