# Guidelines

Olá, seja bem-vindo!

Neste guia você vai encontrar detalhes do nosso processo de engenharia, <b>é muito importante você ler todos os tópicos</b> pois gostaríamos de ver todos eles presentes no nosso dia a dia.

### Arquitetura de referência

Antes de começar a desenvolver é necessário você entender como funciona nossa arquitetura, pois tudo que voce vai construir precisa seguir essa diretriz a fim de garantir que nossos aplicativos tenham a melhor experiência, tanto para quem utiliza, quanto para quem desenvolve. Havendo qualquer dúvida quando arquitetura de referência, procure um Staff Engineer. 

>DISCLAIMER
**Sim seguir essa arquitetura irá facilitar a sua vida e dos demais colaboradores da engenharia de sistemas.** 

Então vamos apresentar rapidamente os componentes que compoem nossa arquitetura de referência:

#### Experience APIs 
É a camada a aplicação diretamente responsável pela experiencia do usuário, geralmente está localizada entre o frontend e Process API, também conhecida BFF, ou Backend For Frontend.

#### Process APIs 
Esta é a camada de orquestração, resolvendo as complexidades, integrando e simplificando a manipulação das informações. Ela fica situada entre a camada de Experience e as diversas camadas System.

#### System APIs 
É a camada mais próxima do nosso CORE, expondo funcionalmente dominios e contextos de dados. Essa camada fica entre os a Process APIs e dos bancos de dados.

[Guide de arquitetura](./arquitetura/README.md)

### Fluxo de desenvolvimento

Para entregarmos um software de maneira segura e consistente entendemos que seguir um fluxo de desenvolvimento padronizado é fundamental, ele nos da a segurança de que realizamos o nosso trabalho da melhor maneira possível.

### Codificação

Agora que você ja sabe como entregamos software e esta bem alinhado com nossa arquitetura, chegou a hora de por a mao na massa. Hoje, nossa stak principal é mais ou menos assim:

> React -> Node.js

#### Frontend
  Se você for fazer algo no frontend veja:

  [Guide de frontend](./frontend/README.md)

#### Backend
  Se você for fazer algo no backend:

  [Guide de backend](./backend/README.md)

### Testes – qualidade nas entregas
Os testes desempenham um papel crucial no ciclo de desenvolvimento de software, garantindo a qualidade e confiabilidade do código. Este guia abrange três níveis essenciais de testes: unitário, integrado e end-to-end (E2E).

Ao clicar [Guide dos Testes](./testes/README.md) 
  
### Responsabilidade de Todos os engenheiros:
 
- **Automatização é Chave:** Todos os engenheiros têm a responsabilidade de contribuir para a automação dos testes, garantindo execução consistente e eficiente.
 
- **Mocking e Stubs:** Utilize técnicas de mocking e stubbing para isolar unidades durante os testes. Todos os engenheiros devem se esforçar para controlar o comportamento de dependências.
 
- **Testes Contínuos:** Integre testes ao processo de integração contínua. Cada engenheiro deve garantir que suas contribuições não quebrem o fluxo de CI, identificando falhas rapidamente.
 
- **Cobertura Adequada:** Todos os engenheiros devem se esforçar para alcançar uma cobertura de código adequada (mínimo 80%) em todos os níveis de teste. Isso reduz riscos e facilita a manutenção.
 
Ao seguir essas diretrizes, todos os engenheiros contribuem para a construção de um sólido conjunto de testes, fortalecendo a robustez e confiabilidade do software em todas as fases do desenvolvimento.
