# Microservices

Neste guia vamos descrever alguns critérios que acordamos no chapter de backend para definir o que deveria ser um microserviço.

## Critérios

Segue a tabela com alguns critérios já definidos:

Critério | Descrição | Exemplos
-- | ------- | ---
Contexto | Ms que geralmente faz algumas sagas entre vários serviços de domínios. | ms-issuer
Domínio | Ms que detém os dados e o domínio de negocio sobre uma entidade chave. | ms-policyholder, ms-broker
Escalabilidade | Ms que isola alguma feture que seja mais utilizada. | ms-policyholder-balance
Útil | Ms que resolve algum problema comum que nao cabe bem em uma library. | ms-pdf-generator

### Pontos de atenção

Sempre ao criar um "micro" serviço levar em conta o princípio de responsabilidade única.

Definimos que os microserviços nao podem compartilhar base de dados, cada microserviço deve ter a sua base de dados independente.

### Base de dados distribuídas

Uma maneira de garantir a confiabilidade de dados em bancos distribuidos é com "Idempotência".
Em resumo seria para cada operação em um ms terceira ele receber um identificador unico para processar esta solicitação, e antes de realizar o processamento validar se este identificador ainda nao foi processado por ele mesmo anteriormente. 