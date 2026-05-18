# Guideline

# Table of Contents

- [Guideline](#guideline)
- [Table of Contents](#table-of-contents)
  - [SOLID](#solid)
  - [Nomenclatura](#nomenclatura)
  - [Variaveis](#variaveis)
  - [Funcoes](#funcoes)
  - [Rotas](#rotas)
  - [Status code](#status-code)
  - [Requests e Responses](#requests-e-responses)
  - [Paginacao e Filtros](#paginacao-e-filtros)
    - [Paginacao](#paginacao)
    - [Filtros](#filtros)
  - [Errors Handling](#errors-handling)
    - [Erros e status code](#erros-e-status-code)
    - [Formato do retorno do erro](#formato-do-retorno-do-erro)
    - [Prioridade de erros](#prioridade-de-erros)
  - [Data e Hora](#data-e-hora)
  - [Branchs e Pull Requests](#branchs-e-pull-requests)
  - [Testes Unitarios](#testes-unitarios)
    - [Proposito](#proposito)
    - [Principios](#principios)
    - [Anatomia de um teste](#anatomia-de-um-teste)
      - [Triplo AAA](#triplo-aaa)
      - [Nomenclatura](#nomenclatura-1)
    - [Estrutura no projeto e cobertura de testes](#estrutura-no-projeto-e-cobertura-de-testes)
  - [Concorrencia](#concorrencia)
  - [Formatacao de Codigo](#formatacao-de-codigo)
  - [Bibliotecas](#bibliotecas)
  - [ORM](#orm)
    - [Node.js](#nodejs)
  - [Referencias](#referencias)



## SOLID

<details>
  <summary><b>O que é SOLID?</b></summary>

**SOLID**  é o acrônimo introduzido por ***Michael Feathers*** para os primeiros cinco princípios nomeados por Robert Margin,  como os cinco príncipios básicos da programação de orientação a objeto.

- [S: Single Responsibility Principle (SRP)](#single-responsibility-principle-srp)
- [O: Open/Closed Principle (OCP)](#openclosed-principle-ocp)
- [L: Liskov Substitution Principle (LSP)](#liskov-substitution-principle-lsp)
- [I: Interface Segregation Principle (ISP)](#interface-segregation-principle-isp)
- [D: Dependency Inversion Principle (DIP)](#dependency-inversion-principle-dip)

</details>

<details>
  <summary><b>Single Responsibility Principle (SRP)</b></summary>
Conforme declarado no ***Clean Code***, "Nunca deve haver mais de um motivo para uma classe mudar". É tentador encher uma classe com muitas funcionalidades, como quando você só pode levar uma mala em seu voo. O problema com isso é que sua classe não será conceitualmente coesa e isso lhe dará muitos motivos para mudar. Minimizar a quantidade de vezes que você precisa mudar de classe é importante.

É importante porque se houver muita funcionalidade em uma classe e você modificar uma parte dela, pode ser difícil entender como isso afetará outros módulos dependentes em sua base de código.

**Bad:**

```javascript
class UserSettings {
  constructor(user) {
    this.user = user;
  }

  changeSettings(settings) {
    if (this.verifyCredentials()) {
      // ...
    }
  }

  verifyCredentials() {
    // ...
  }
}
```

**Good:**

```javascript
class UserAuth {
  constructor(user) {
    this.user = user;
  }

  verifyCredentials() {
    // ...
  }
}

class UserSettings {
  constructor(user) {
    this.user = user;
    this.auth = new UserAuth(user);
  }

  changeSettings(settings) {
    if (this.auth.verifyCredentials()) {
      // ...
    }
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Open/Closed Principle (OCP)</b></summary>

Como afirma Bertrand Meyer, "entidades de software (classes, módulos, funções, etc.) devem ser abertas para extensão, mas fechadas para modificação." O que isso significa? Este princípio basicamente afirma que você deve permitir que os usuários adicionem novas funcionalidades sem alterar o código existente.

**Bad:**

```javascript
class AjaxAdapter {
  getName() {
    return 'ajaxAdapter';
  }
}

class NodeAdapter {
  getName() {
    return 'nodeAdapter';
  }
}

class HttpRequester {
  constructor(adapter) {
    this.adapter = adapter;
  }

  fetch(url) {
    const adapterName = this.adapter.getName();
    if (adapterName === 'ajaxAdapter') {
      return this.makeAjaxCall(url);
    } else if (adapterName === 'nodeAdapter') {
      return this.makeHttpCall(url);
    }
  }

  makeAjaxCall(url) { /* request and return promise */ }
  makeHttpCall(url) { /* request and return promise */ }
}
```

**Good:**

```javascript
class AjaxAdapter {
  request(url) {
    // request and return promise
  }
}

class NodeAdapter {
  request(url) {
    // request and return promise
  }
}

class HttpRequester {
  constructor(adapter) {
    this.adapter = adapter;
  }

  fetch(url) {
    return this.adapter.request(url);
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Liskov Substitution Principle (LSP)</b></summary>
Este é um termo assustador para um conceito muito simples. É formalmente definido como:

>"Se S é um subtipo de T, então objetos do tipo T podem ser substituídos por objetos do tipo S (ou seja, objetos do tipo S podem substituir objetos do tipo T) sem alterar qualquer uma das propriedades desejáveis desse programa (correção, tarefa realizada, etc.)."

Essa é uma definição ainda mais assustadora.

A melhor explicação para isso é se você tiver uma classe pai e uma classe filha, então a classe pai e a classe filha podem ser usadas alternadamente sem obter resultados incorretos. Isso ainda pode ser confuso, então vamos dar uma olhada no exemplo clássico de Retângulo Quadrado. Matematicamente, um quadrado é um retângulo, mas se você modelá-lo usando a relação "***is-a***" por meio de herança, você rapidamente
entra em um problema.

**Bad:**

```javascript
class Rectangle {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  setWidth(width) { this.width = width; }
  setHeight(height) { this.height = height; }
  getArea() { return this.width * this.height; }
  render(area) { /* ... */ }
}

class Square extends Rectangle {
  setWidth(width) { this.width = this.height = width; }
  setHeight(height) { this.width = this.height = height; }
}

function renderLargeRectangles(rectangles) {
  rectangles.forEach(rectangle => {
    rectangle.setWidth(4);
    rectangle.setHeight(5);
    const area = rectangle.getArea(); // BAD: Will return 25 for Square. Should be 20.
    rectangle.render(area);
  });
}

const rectangles = [new Rectangle(), new Rectangle(), new Square()];
renderLargeRectangles(rectangles);
```

**Good:**

```javascript
class Shape {
  getArea() {
    throw new Error('getArea() must be implemented');
  }

  render(area) { /* ... */ }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  getArea() {
    return this.width * this.height;
  }
}

class Square extends Shape {
  constructor(length) {
    super();
    this.length = length;
  }

  getArea() {
    return this.length ** 2;
  }
}

function renderLargeShapes(shapes) {
  shapes.forEach(shape => {
    const area = shape.getArea();
    shape.render(area);
  });
}

const shapes = [new Rectangle(4, 5), new Rectangle(4, 5), new Square(5)];
renderLargeShapes(shapes);
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Interface Segregation Principle (ISP)</b></summary>
O ISP afirma que "Os clientes não devem ser forçados a depender de interfaces que não usam."

Um bom exemplo que demonstra este princípio é para
classes que requerem grandes objetos de configuração. Não exigir que os clientes configurem grandes quantidades de opções é benéfico, porque na maioria das vezes eles não precisarão de todas as configurações. Torná-los opcionais ajuda a evitar uma "interface gorda".

**Bad:**

```javascript
class Human {
  work() {
    // working
  }

  eat() {
    // eating in lunch break
  }
}

class Robot {
  work() {
    // working much more
  }

  eat() {
    // robot can't eat, but is forced to implement this
  }
}
```

**Good:**

Nem todo `worker` é um  `employee`, mas o inverso é verdadeiro.

```javascript
class Human {
  work() {
    // working
  }

  eat() {
    // eating in lunch break
  }
}

// Robot only needs to work
class Robot {
  work() {
    // working
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Dependency Inversion Principle (DIP)</b></summary>

Este princípio afirma duas coisas essenciais:

1. Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.
2. As abstrações não devem depender de detalhes. Os detalhes devem depender das abstrações.

Isso pode ser difícil de entender no início, mas se você trabalhou com frameworks como [NestJS](https://nestjs.com/), viu uma implementação desse princípio na forma de [Dependency Injection](https://martinfowler.com/articles/injection.html) (DI). Embora não sejam conceitos idênticos, o DIP impede que os módulos de alto nível conheçam os detalhes de seus módulos de baixo nível e os configure.

Ele pode fazer isso por meio do DI. Um grande benefício disso é que reduz o acoplamento entre os módulos. O acoplamento é um padrão de desenvolvimento muito ruim porque torna seu código difícil de refatorar.

**Bad:**

```javascript
class Human {
  work() {
    // working
  }
}

class Robot {
  work() {
    // working much more
  }
}

class Manager {
  constructor(robot, human) {
    this.robot = robot;
    this.human = human;
  }

  manage() {
    this.robot.work();
    this.human.work();
  }
}
```

**Good:**

```javascript
class Human {
  work() {
    // working
  }
}

class Robot {
  work() {
    // working much more
  }
}

class Manager {
  constructor(employees) {
    this.employees = employees;
  }

  manage() {
    this.employees.forEach(employee => employee.work());
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Don't repeat yourself (DRY)</b></summary>

Tente observar o princípio [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) .

Faça o seu melhor para evitar código duplicado. O código duplicado é ruim porque significa que há mais de um lugar para alterar algo se você precisar alterar alguma lógica.

Imagine que você dirige um restaurante e controla seu estoque: todos os seus tomates, cebolas, alho, temperos, etc. Se você tem várias listas que mantém isso, então todas devem ser atualizadas quando você servir um prato com tomates neles. Se você tiver apenas uma lista, há apenas um lugar para atualizar!

Freqüentemente, você tem código duplicado porque tem duas ou mais coisas ligeiramente diferentes, que compartilham muito em comum, mas suas diferenças o forçam a ter duas ou mais funções separadas que fazem muitas das mesmas coisas. Remover código duplicado significa criar uma abstração que pode lidar com esse conjunto de coisas diferentes com apenas uma função /módulo /classe.

Obter a abstração certa é fundamental. Abstrações ruins podem ser piores do que código duplicado, então tome cuidado! Dito isso, se você pode fazer uma boa abstração, faça! Não se repita, caso contrário, você se verá atualizando vários lugares sempre que quiser mudar alguma coisa.

**Bad:**

```javascript
function showDeveloperList(developers) {
  developers.forEach(developer => {
    const expectedSalary = developer.calculateExpectedSalary();
    const experience = developer.getExperience();
    const githubLink = developer.getGithubLink();
    const data = { expectedSalary, experience, githubLink };
    render(data);
  });
}

function showManagerList(managers) {
  managers.forEach(manager => {
    const expectedSalary = manager.calculateExpectedSalary();
    const experience = manager.getExperience();
    const githubLink = manager.getGithubLink();
    const data = { expectedSalary, experience, githubLink };
    render(data);
  });
}
```

**Good:**

```javascript
function showEmployeeList(employees) {
  employees.forEach(employee => {
    const expectedSalary = employee.calculateExpectedSalary();
    const experience = employee.getExperience();
    const githubLink = employee.getGithubLink();
    const data = { expectedSalary, experience, githubLink };
    render(data);
  });
}
```

**Very good:**

É melhor utilizar uma versão compacta do código.

```javascript
function showEmployeeList(employees) {
  employees.forEach(employee => {
    render({
      expectedSalary: employee.calculateExpectedSalary(),
      experience: employee.getExperience(),
      githubLink: employee.getGithubLink(),
    });
  });
}
```

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**



## Nomenclatura

<details>
  <summary><b>Evite usar uma nomenclatura ruim</b></summary>
Uma boa nomenclatura permite que o código seja usado por muitos os desenvolvedores. O nome deveria refletir o propósito e dar um contexto.

**Bad:**

```javascript
let d;
```

**Good:**

```javascript
let daysSinceModification;
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite nomes que permitam mais de uma interpretação</b></summary>


Nomeie uma variável para refletir para o que ela vai ser utilizada.

**Bad:**

```javascript
const dataFromDb = db.getFromService();
```

**Good:**

```javascript
const listOfEmployees = employeeService.getEmployees();
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite notação Húngara</b></summary>


A notação Húngara reafirma um tipo que já está presente na declaração. Isso é desenecessário tendo em vista que IDEs modernas irão identificar o tipo do dado.

**Bad:**

```javascript
let iCounter;
let strFullName;
let dtModifiedDate;
```

**Good:**

```javascript
let counter;
let fullName;
let modifiedDate;
```

Notação Húngara não deve ser utilizada em parâmetros. 

**Bad:**

```javascript
function isShopOpen(pDay, pAmount) {
  // some logic
}
```

**Good:**

```javascript
function isShopOpen(day, amount) {
  // some logic
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Tenha consistência na capitalização na nomenclatura</b></summary>


Capitalização pode dizer muito sobre suas variáveis, funções, etc. Essas regras são subjetivas, então seu time pode escolher qualquer regra que achar melhor. O ponto é, não importa qual vocês decidam utilizar, seja consistente.

**Bad:**

```javascript
const DAYS_IN_WEEK = 7;
const daysInMonth = 30;

const songs = ['Back In Black', 'Stairway to Heaven', 'Hey Jude'];
const Artists = ['ACDC', 'Led Zeppelin', 'The Beatles'];

function eraseDatabase() {}
function Restore_database() {}

class animal {}
class Alpaca {}
```

**Good:**

```javascript
const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

const songs = ['Back In Black', 'Stairway to Heaven', 'Hey Jude'];
const artists = ['ACDC', 'Led Zeppelin', 'The Beatles'];

function eraseDatabase() {}
function restoreDatabase() {}

class Animal {}
class Alpaca {}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use uma nomenclatura que possa ser pronunciável</b></summary>


Leva tempo para investigar o significado de uma variável e funções quando eles não são pronunciáveis.

**Bad:**

```javascript
class Employee {
  constructor() {
    this.sWorkDate = new Date(); // what the heck is this
    this.modTime = new Date();   // same here
  }
}
```

**Good:**

```javascript
class Employee {
  constructor() {
    this.startWorkingDate = new Date();
    this.modificationTime = new Date();
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use a notação Camelcase</b></summary>


Use [Camelcase Notation](https://en.wikipedia.org/wiki/Camel_case) para variáveis e parâmetros de funções.

**Bad:**

```javascript
let employeephone;

function calculateSalary(workingdays, workinghours) {
  // some logic
}
```

**Good:**

```javascript
let employeePhone;

function calculateSalary(workingDays, workingHours) {
  // some logic
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use nomes que reflita o domínio</b></summary>


As pessoas que irão ler seu código também são desenvolvedores. Utilizando uma nomenclatura clara e de forma correta irá ajudar para que todos fiquem alinhados. Nós não queremos perder tempo tendo que explicar para todos para que uma variável ou função serve.

**Good**

```javascript
class SingletonObject {
  static getInstance() {
    if (!SingletonObject._instance) {
      SingletonObject._instance = new SingletonObject();
    }
    return SingletonObject._instance;
  }

  showMessage() {
    return 'Hello World!';
  }
}

// illegal construct
// const object = new SingletonObject();

// Get the only object available
const singletonObject = SingletonObject.getInstance();

// show the message
singletonObject.showMessage();
```

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**



## Variaveis

<details>
  <summary><b>Evite ter encadeamentos muito grandes e retorne o mais cedo possível</b></summary>


O uso de muitas cláusulas `if-else` pode tornar o código difícil de entender. **Algo explícito é melhor do que algo implícito**.

**Bad:**

```javascript
function isShopOpen(day) {
  if (day) {
    day = day.toLowerCase();
    if (day === 'friday') {
      return true;
    } else if (day === 'saturday') {
      return true;
    } else if (day === 'sunday') {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
```

**Good:**

```javascript
function isShopOpen(day) {
  if (!day) return false;

  const openingDays = ['friday', 'saturday', 'sunday'];
  return openingDays.includes(day.toLowerCase());
}
```

**Bad:**

```javascript
function fibonacci(n) {
  if (n < 50) {
    if (n !== 0) {
      if (n !== 1) {
        return fibonacci(n - 1) + fibonacci(n - 2);
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  } else {
    throw new Error('Not supported');
  }
}
```

**Good:**

```javascript
function fibonacci(n) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n > 50) throw new Error('Not supported');

  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite a necessidade de um mapeamento mental</b></summary>


Não force o leitor do código a ter que traduzir o propósito das variáveis. **Algo explícito é melhor do que algo implícito**.

**Bad:**

```javascript
const l = ['Austin', 'New York', 'San Francisco'];

for (let i = 0; i < l.length; i++) {
  const li = l[i];
  doStuff();
  doSomeOtherStuff();

  // ...
  // ...
  // ...
  // Wait, what is `li` for again?
  dispatch(li);
}
```

**Good:**

```javascript
const locations = ['Austin', 'New York', 'San Francisco'];

locations.forEach(location => {
  doStuff();
  doSomeOtherStuff();

  // ...
  // ...
  // ...
  dispatch(location);
});
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite uma string mágica</b></summary>


Strings mágicas são strings com valores especificados diretamente no código da aplicação que tem impacto no comportamento da aplicação. Frequentemente, esses tipos de strings são duplicadas na aplicação, e como elas não podem ser automaticamente atualizadas por ferramentas de refactoring, é muito comum delas se tornarem uma fonte de bugs quando mudanças são feitas em algumas strings e em outras não.

**Bad**

```javascript
if (userRole === 'Admin') {
  // logic in here
}
```

**Good**

```javascript
const ADMIN_ROLE = 'Admin';

if (userRole === ADMIN_ROLE) {
  // logic in here
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Não adicione contextos desnecessários</b></summary>


Se o nome da sua classe/objeto já te diz alguma coisa, não repita isso para o nome da variável.

**Bad:**

```javascript
class Car {
  constructor(carMake, carModel, carColor) {
    this.carMake = carMake;
    this.carModel = carModel;
    this.carColor = carColor;
  }
}
```

**Good:**

```javascript
class Car {
  constructor(make, model, color) {
    this.make = make;
    this.model = model;
    this.color = color;
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use uma nomenclatura na variável que tenha sifnigicado e seja pronunciável</b></summary>

**Bad:**

```javascript
const ymdstr = new Date().toISOString().split('T')[0];
```

**Good:**

```javascript
const currentDate = new Date().toISOString().split('T')[0];
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use o mesmo vocabulário para o mesmo tipo de variável</b></summary>


**Bad:**

```javascript
getUserInfo();
getUserData();
getUserRecord();
getUserProfile();
```

**Good:**

```javascript
getUser();
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use nomes que podem ser pesquisados (parte 1)</b></summary>


Será realizada mais leitura de código do que escrita. É importante que o código que nós iremos escrever seja claro de ler e pesquisar. Por optar não tornar claro uma variável que acaba se tornando importante para o entendimento da aplicação, nós prejudicamos quem irá ler e dar manutenção no código. Torne o nome das suas variáveis algo facilmente pesquisável. 

**Bad:**

```javascript
// What the heck is data for?
const data = { name: 'John', age: 42 };
console.log(JSON.stringify(data));
```

**Good:**

```javascript
const person = { name: 'John', age: 42 };
console.log(JSON.stringify(person));
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use nomes que podem ser pesquisados (parte 2)</b></summary>

**Bad:**

```javascript
const data = { name: 'John', age: 42, personAccess: 4 };

// What the heck is 4 for?
if (data.personAccess === 4) {
  // do edit ...
}
```

**Good:**

```javascript
const PersonAccess = {
  ACCESS_READ: 1,
  ACCESS_CREATE: 2,
  ACCESS_UPDATE: 4,
  ACCESS_DELETE: 8,
};

const person = {
  name: 'John',
  age: 42,
  personAccess: PersonAccess.ACCESS_CREATE,
};

if (person.personAccess === PersonAccess.ACCESS_UPDATE) {
  // do edit ...
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Use variáveis explicativas</b></summary>

**Bad:**

```javascript
const address = 'One Infinite Loop, Cupertino 95014';
const cityZipCodeRegex = /^[^,]+[,\s]+(.+?)\s*(\d{5})?$/;
const matches = address.match(cityZipCodeRegex);
if (matches[1] && matches[2]) {
  saveCityZipCode(matches[1], matches[2]);
}
```

**Good:**

```javascript
const address = 'One Infinite Loop, Cupertino 95014';
const cityZipCodeRegex = /^[^,]+[,\s]+(?<city>.+?)\s*(?<zipCode>\d{5})?$/;
const { groups: { city, zipCode } } = address.match(cityZipCodeRegex);
if (city && zipCode) {
  saveCityZipCode(city, zipCode);
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Prefira ter valores padrão do que condicionais</b></summary>

**Not good:**

```javascript
function createMicrobrewery(name = null) {
  const breweryName = name || 'Hipster Brew Co.';
  // ...
}
```

**Good:**

```javascript
function createMicrobrewery(breweryName = 'Hipster Brew Co.') {
  // ...
}
```

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**



## Funcoes

<details>
<summary><b>Evite side effects</b></summary>


Uma função deveria apenas fazer uma coisa para que caso haja algum problema, ele esteja centralizado e não torne difícil o entendimento e consequentemente a correção do mesmo.

**Bad:**

Nesse caso, o método em questão está substituindo o valor da variável `name` e não apenas fazendo o que dá a entender em sua descrição.

```javascript
// Global variable referenced by following function.
// If we had another function that used this name, now it'd be an array and it could break it.
let name = 'Ryan McDermott';

function splitAndEnrichFullName() {
  const temp = name.split(' ');
  name = `His first name is ${temp[0]}, and his last name is ${temp[1]}`; // side effect
}

splitAndEnrichFullName();

console.log(name); // His first name is Ryan, and his last name is McDermott
```

**Good:**

```javascript
function splitAndEnrichFullName(name) {
  const [firstName, lastName] = name.split(' ');
  return `His first name is ${firstName}, and his last name is ${lastName}`;
}

const name = 'Ryan McDermott';
const fullName = splitAndEnrichFullName(name);

console.log(name);     // Ryan McDermott
console.log(fullName); // His first name is Ryan, and his last name is McDermott
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite condicionais negativas</b></summary>

**Bad:**

```javascript
function isDOMNodeNotPresent(node) {
  // ...
}

if (!isDOMNodeNotPresent(node)) {
  // ...
}
```

**Good:**

```javascript
function isDOMNodePresent(node) {
  // ...
}

if (isDOMNodePresent(node)) {
  // ...
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Tente evitar o uso de condicionais</b></summary>


Nos casos de utilização de domínio rico, uma condicional pode facilmente ser substituida com o uso de polimorfismo. Uma função deveria fazer apenas uma coisa, e quando utilizamos condicionais pra "facilitar" a codificação, acabamos por acoplar regras ou gerar uma complexidade que poderia facilmente ser resolvida de outra forma. 

**Bad:**

```javascript
class Airplane {
  getCruisingAltitude() {
    switch (this.type) {
      case '777':
        return this.getMaxAltitude() - this.getPassengerCount();
      case 'Air Force One':
        return this.getMaxAltitude();
      case 'Cessna':
        return this.getMaxAltitude() - this.getFuelExpenditure();
    }
  }
}
```

**Good:**

```javascript
class Boeing777 {
  getCruisingAltitude() {
    return this.getMaxAltitude() - this.getPassengerCount();
  }
}

class AirForceOne {
  getCruisingAltitude() {
    return this.getMaxAltitude();
  }
}

class Cessna {
  getCruisingAltitude() {
    return this.getMaxAltitude() - this.getFuelExpenditure();
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite ter que validar o tipo da variável (parte 1)</b></summary>

**Bad:**

```javascript
function travelToTexas(vehicle) {
  if (vehicle instanceof Bicycle) {
    vehicle.pedalTo(new Location('texas'));
  } else if (vehicle instanceof Car) {
    vehicle.driveTo(new Location('texas'));
  }
}
```

**Good:**

```javascript
function travelToTexas(vehicle) {
  vehicle.travelTo(new Location('texas'));
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite ter que validar o tipo da variável (parte 2)</b></summary>

**Bad:**

```javascript
function combine(val1, val2) {
  if (typeof val1 !== 'number' || typeof val2 !== 'number') {
    throw new TypeError('Must be of type Number');
  }
  return val1 + val2;
}
```

**Good:**

```javascript
function combine(val1, val2) {
  return val1 + val2;
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Evite <i>flags</i> como parâmetro em um método</b></summary>


Uma *flag* indica que um método tem mais de uma responsabilidade. O melhor é o método ter apenas uma responsabilidade. Divida o método em dois se o parâmetro *boolean* adiciona múltiplas responsabilidades ao método. 

**Bad:**

```javascript
function createFile(name, temp = false) {
  if (temp) {
    touch(`./temp/${name}`);
  } else {
    touch(name);
  }
}
```

**Good:**

```javascript
function createFile(name) {
  touch(name);
}

function createTempFile(name) {
  touch(`./temp/${name}`);
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Não crie funções globais</b></summary>

Incluir funções globais é uma prática ruim em muitas linguagens por que pode interferir no uso de outras bibliotecas. 

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Não use o padrão Singleton</b></summary>


Singleton é um [anti-pattern](https://en.wikipedia.org/wiki/Singleton_pattern). Parafraseando Brian Button:

1. Eles geralmente usam uma **instância global**, porque é tão ruim? Porque **você esconde as dependências** da sua aplicacão no seu código, ao invés de expor elas através de interfaces. Fazendo alguma coisa global para evitar gerenciar ela é um [code smell](https://en.wikipedia.org/wiki/Code_smell).
2. Eles violam o [single responsibility principle](#single-responsibility-principle-srp): pelo simples fato de **ele controlar sua própria criação e ciclo de vida**.
3. Eles tornam o código ser altamente [coupled](https://en.wikipedia.org/wiki/Coupling_%28computer_programming%29). Isso acaba dificultando realizar um *mock* aumentando a **dificuldade em testar** em muitos casos .

**Bad:**

```javascript
class DBConnection {
  static getInstance() {
    if (!DBConnection._instance) {
      DBConnection._instance = new DBConnection();
    }
    return DBConnection._instance;
  }

  // ...
}

const singleton = DBConnection.getInstance();
```

**Good:**

```javascript
class DBConnection {
  constructor(options) {
    this.options = options;
    // ...
  }

  // ...
}

// Crie a instância com as configurações necessárias e injete onde for preciso
const connection = new DBConnection(config);
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Parâmetros de uma função (4 ou menos é o ideal)</b></summary>


Limitando a quantidade de parâmetros é incrivelmente importante porque torna o teste da sua função mais fácil. 

**Bad:**

```javascript
function createMenu(id, title, body, buttonText, cancellable) {
  // ...
}
```

**Good:**

```javascript
function createMenu({ id, title, body, buttonText, cancellable }) {
  // ...
}

createMenu({
  id: 1,
  title: 'Foo',
  body: 'Bar',
  buttonText: 'Baz',
  cancellable: true,
});
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Nomes de funções devem dizer o que elas fazem</b></summary>

**Bad:**

```javascript
class Email {
  handle() {
    this.sendMail(this.to, this.subject, this.body);
  }
}

const message = new Email(/* ... */);
// What is this? A handle for the message? Are we writing to a file now?
message.handle();
```

**Good:**

```javascript
class Email {
  send() {
    this.sendMail(this.to, this.subject, this.body);
  }
}

const message = new Email(/* ... */);
// Clear and obvious
message.send();
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Funções devem apenas ter um nível de abstração</b></summary>

Quando você tem mais de um nível de abstração sua função normalmente está fazendo mais do que deveria. Dividindo a função torna ela reusável e facilmente testável.

**Bad:**

```javascript
function parseBetterJSAlternative(code) {
  const regexes = [
    // ...
  ];

  const statements = code.split(' ');
  const tokens = [];
  regexes.forEach(regex => {
    statements.forEach(statement => {
      // ...
    });
  });

  const ast = [];
  tokens.forEach(token => {
    // lex...
  });

  ast.forEach(node => {
    // parse...
  });
}
```

**Bad too:**

```javascript
function tokenize(code) {
  const regexes = [
    // ...
  ];

  const statements = code.split(' ');
  const tokens = [];
  regexes.forEach(regex => {
    statements.forEach(statement => {
      tokens.push(/* ... */);
    });
  });

  return tokens;
}

function lexer(tokens) {
  const ast = [];
  tokens.forEach(token => {
    ast.push(/* ... */);
  });

  return ast;
}

function parseBetterJSAlternative(code) {
  const tokens = tokenize(code);
  const ast = lexer(tokens);
  ast.forEach(node => {
    // parse...
  });
}
```

**Good:**

```javascript
class Tokenizer {
  tokenize(code) {
    const regexes = [
      // ...
    ];

    const statements = code.split(' ');
    const tokens = [];
    regexes.forEach(regex => {
      statements.forEach(statement => {
        tokens.push(/* ... */);
      });
    });

    return tokens;
  }
}

class Lexer {
  lexify(tokens) {
    const ast = [];
    tokens.forEach(token => {
      ast.push(/* ... */);
    });

    return ast;
  }
}

class BetterJSAlternative {
  constructor(tokenizer, lexer) {
    this.tokenizer = tokenizer;
    this.lexer = lexer;
  }

  parse(code) {
    const tokens = this.tokenizer.tokenize(code);
    const ast = this.lexer.lexify(tokens);
    ast.forEach(node => {
      // parse...
    });
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Funções que chamam outras e são chamadas devem ficar próximas uma da outra</b></summary>


Se uma função chama outra, mantenha verticalmente próximas uma da outra no arquivo. Idealmente, mantenha a função principal logo acima da função secundária. Nós temos a tendência a ler o código de cima para baixo, como um jornal. Por conta disso, faça seu código ser lido dessa forma. 

**Bad:**

```javascript
class PerformanceReview {
  constructor(employee) {
    this.employee = employee;
  }

  lookupPeers() {
    return db.lookup(this.employee, 'peers');
  }

  lookupManager() {
    return db.lookup(this.employee, 'manager');
  }

  getPeerReviews() {
    const peers = this.lookupPeers();
    // ...
  }

  perfReview() {
    this.getPeerReviews();
    this.getManagerReview();
    this.getSelfReview();
  }

  getManagerReview() {
    const manager = this.lookupManager();
  }

  getSelfReview() {
    // ...
  }
}

const review = new PerformanceReview(employee);
review.perfReview();
```

**Good:**

```javascript
class PerformanceReview {
  constructor(employee) {
    this.employee = employee;
  }

  perfReview() {
    this.getPeerReviews();
    this.getManagerReview();
    this.getSelfReview();
  }

  getPeerReviews() {
    const peers = this.lookupPeers();
    // ...
  }

  lookupPeers() {
    return db.lookup(this.employee, 'peers');
  }

  getManagerReview() {
    const manager = this.lookupManager();
    return manager;
  }

  lookupManager() {
    return db.lookup(this.employee, 'manager');
  }

  getSelfReview() {
    // ...
  }
}

const review = new PerformanceReview(employee);
review.perfReview();
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Encapsule condicionais</b></summary>


**Bad:**

```javascript
if (article.state === 'published') {
  // ...
}
```

**Good:**

```javascript
if (article.isPublished()) {
  // ...
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
  <summary><b>Remova <i>dead code</i></b></summary>

*Dead code* é tão ruim quanto código duplicado. Não há razão para mantê-lo na sua base de código. Se ele não possui referência de uso, remova. 

**Bad:**

```javascript
function oldRequestModule(url) {
  // ...
}

function newRequestModule(url) {
  // ...
}

const request = newRequestModule(requestUrl);
inventoryTracker('apples', request, 'www.inventory-awesome.io');
```

**Good:**

```javascript
function requestModule(url) {
  // ...
}

const request = requestModule(requestUrl);
inventoryTracker('apples', request, 'www.inventory-awesome.io');
```

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**



## Rotas

<details>
    <summary><b>Utilize a intenção da funcionalidade na rota</b></summary>
    Devemos organizar as APIs pelos seus recursos, intenções e versão.
**Bad:**

```html
GET https://domain.com/api/v1/getAllOrders
```

**Good:**

```html
GET https://domain.com/api/v1/orders/
```

**[⬆ back to top](#table-of-contents)**
</details>



<details>
    <summary><b>Parâmetros de query string não devem alterar o status do objeto</b></summary>
**Bad:**

```html
GET https://domain.com/orders/20?processed
```

**Good:**

```html
POST https://domain.com/orders/20/processed
```

**[⬆ back to top](#table-of-contents)**
</details>



<details>
    <summary><b>Evite usar o singular na construção da rota</b></summary>

**Bad:**

```html
GET https://domain.com/order
```

**Good:**

```html
GET https://domain.com/orders
```

**[⬆ back to top](#table-of-contents)**
</details>



<details>
    <summary><b>Sempre utilize os verbos HTTP para definir as intenções da API</b></summary>

**GET:** Recupera uma apresentação do recurso

**POST:** Cria um novo recurso

**PUT:** Atualiza um recurso

**PATCH:** Atualiza uma parte do recurso

**DELETE:** Remove um recurso

**[⬆ back to top](#table-of-contents)**
</details>



<details>
    <summary><b>Evite usar mais de dois níveis de recurso</b></summary>

**Bad:**

```html
GET https://domain.com/brokers/1/policies/20/policyholders
```

**Good:**

```html
GET https://domain.com/brokers/1/policies
```

**[⬆ back to top](#table-of-contents)**
</details>

**[⬆ back to top](#table-of-contents)**



## Status code

Apenas os seguintes **status code** serão utilizados nos retornos das APIs.



**GET:**

- 200 OK
- 401 Unauthorized
- 403 Forbiden
- 404 Not Found
- 424 Failed Dependency
- 500 Internal Server Error

**POST:**

- 200 OK
- 201 Created (com location para recuperar o recurso caso necessário)
- 401 Unauthorized
- 403 Forbiden
- 404 Not Found
- 500 Internal Server Error
- 502 Bad Gateway

**PUT:**

- 204 No Content
- 401 Unauthorized
- 403 Forbiden
- 404 Not Found
- 500 Internal Server Error
- 502 Bad Gateway

**PATCH:**

- 204 No Content
- 401 Unauthorized
- 403 Forbiden
- 404 Not Found
- 500 Internal Server Error
- 502 Bad Gateway

**DELETE:**

- 204 No Content
- 401 Unauthorized
- 403 Forbiden
- 404 Not Found
- 500 Internal Server Error
- 502 Bad Gateway

**[⬆ back to top](#table-of-contents)**



## Requests e Responses

<details>
    <summary><b>Utilize o padrão Camelcase para requests e responses</b></summary>

```json
{
  "_id": "5d8391cf518a869f5de04e1c",
  "index": 0,
  "guid": "1d424f9b-1a47-4d8f-82e5-c0e5c535ab69",
  "isActive": true,
  "balance": "$1,083.06",
  "picture": "http://placehold.it/32x32",
  "age": 21,
  "eyeColor": "blue",
  "name": "Ines Simmons",
  "gender": "female",
  "company": "NETPLAX",
  "email": "inessimmons@netplax.com",
  "phone": "+1 (824) 469-2249",
  "address": "475 Bills Place, Zeba, North Carolina, 470",
  "about": "Exercitation ea velit ad sit irure veniam et excepteur sint pariatur culpa. Irure dolore nulla cupidatat sit laborum eiusmod proident amet nostrud labore nisi incididunt fugiat. Labore culpa ut elit magna officia elit proident exercitation mollit nisi. Sunt ea amet consequat sunt amet ex id dolor dolore reprehenderit fugiat qui nisi cupidatat. Laborum et ad nisi excepteur in minim ad voluptate culpa deserunt mollit aliquip dolore Lorem.\r\n",
  "registered": "2019-05-05T07:41:53 +03:00",
  "latitude": 18.987311,
  "longitude": 21.092848,
  "tags": [
    "velit",
    "esse",
    "est",
    "sit",
    "do",
    "nisi",
    "sunt"
  ],
  "friends": [
    {
      "id": 0,
      "name": "Warren Huffman"
    },
    {
      "id": 1,
      "name": "Cox Fisher"
    },
    {
      "id": 2,
      "name": "Minnie Alexander"
    }
  ],
  "greeting": "Hello, Ines Simmons! You have 7 unread messages.",
  "favoriteFruit": "apple"
}
```

**[⬆ back to top](#table-of-contents)**
</details>



<details>
    <summary><b>Cada rota deve ter seu próprio Request e Response</b></summary>

```javascript
// POST https://domain.com/v1/orders

// Request body
const orderRequest = {
  number: 0,       // number
  description: '', // string
};

// Response body
const orderResponse = {
  number: 0, // number
};
```

**[⬆ back to top](#table-of-contents)**
</details>

**[⬆ back to top](#table-of-contents)**



## Paginacao e Filtros

### Paginacao

Uma lista poderá conter paginação apenas se ela não for estática, ou seja, houver inclusão constantes em seus registros.



**Formato de retorno**

```json
{
  "total": 0,
  "page": 1,
  "hasMore": true,
  "data": []
}
```



### Filtros

Os filtros serão compostos dos seguintes parâmetros:

- Filter - Filtros para filtrar a consulta da paginação. Ex: dataMinima dataMaxima tomadorX
  - O filter apenas será possível com os dados que são retornados, sendo assim se uma resposta não contém uma propriedade `id` na sua resposta, ela não poderá ser utilizada como filtro.

- Page - a página que será recuperada
  - O valor mínimo será de 1
  - Caso não seja informado, será assumido o valor padrão de 1
- Limite - a quantidade de itens por página
  - O valor mínimo será de 1
  - O valor máximo será de 200
  - Caso não seja informado, será assumido o valor padrão de 10
- OrderBy - valor a ser ordenado
- Sort - valor da ordenação
  - Os valores disponíveis serão ASC e DESC
  - Caso não seja informado, será assumido o valor padrão de ASC



```
GET https://domain.com/orders?page=1&limit=20&orderBy=id&sort=DESC
```

**[⬆ back to top](#table-of-contents)**



## Errors Handling


- Acumule os erros o máximo que puder, para gerar o máximo de informação para o seu client
- Evite lançar exceção para regra de negócio, opte por usar a abordagem com `Notifications`
- Em uma integração entre Cliente/Aplicação, caso a entrada seja inválida, o status code deve ser **400**
- Em uma integração entre Aplicação/Aplicação, caso a resposta da aplicação 2 retornar um status code a partir de **500**, a primeira deve retornar com status code **502**
- Em caso da aplicação consumir um dado já persistido e este dado não contenha o dado esperado, a aplicação deve lançar uma exceção e nativamente o framework retornará status code **500**


### Erros e status code


**Status 400**
Erro proveniente de algum problema na validação de entrada de dados ou alguma validação de regra de negócio, o serviço **deve retornar um body** que respeite o [formato](#formato-do-retorno-do-erro) padrão de respostas de erro.
- Quando o valor de IS for maior do que o permitido para emissão direta;
- Quando a taxa flex for superior ao valor permitido para aquela proposta;

**Status 401**
Erro proveniente de algum problema de autenticação, o serviço **não de retornar um body**.
- Token não informado;
- Token expirado;

**Status 403**
Erro proveniente de algum problema de autorização, o serviço **pode retornar um body** desde que respeite o [formato](#formato-do-retorno-do-erro) padrão de respostas de erro.

- Quando um corretor tentar vinculara a uma proposta um tomador a qual ele não tenha permissões;
- Quando um corretor tentar vinculara a uma proposta uma modalidade a qual ele não tenha permissões;

**Status 404** 
Erro lançado quando o recurso principal especificado não existe, o serviço **não de retornar um body**.

**Status 5XX** 
Para erros acima de 500 o serviço **não de retornar um body**.


### Formato do retorno do erro

A propriedade `code` deve conter um prefixo da aplicação que disparou. Ex: **"EX_123"**.

```json
{
  "code": "EX_123",
  "message": "mensagem de erro"
}
```


### Prioridade de erros

Ao usar o `Notifications` para agregar vários erros, podemos nos deparar com uma diversidade de códigos de erros para montar a resposta do serviço, neste caso o nível de prioridade segue:


> 5XX > 404 > 403 > 400


Ou seja, quanto maior o valor do erro, maior é sua prioridade, então se tivermos um erro de regra de negócio(400) e um erro de falta de autorização(403), o serviço deve responder 403 seguindo suas regras de retorno.

**[⬆ back to top](#table-of-contents)**



## Data e Hora

Assuma sempre o fuso horário brasileiro **(GMT-3)** com o seguinte formato **(yyyy-MM-dd hh:mm:ss)**

**[⬆ back to top](#table-of-contents)**



## Branchs e Pull Requests

<details>
    <summary><b>Evite pull requests com mais de 20 arquivos de alteração</b></summary>

Pull requests que possuem muitos arquivos de alteração dificultam a revisão e consequentemente abrem espaço para surgimento de eventuais bugs.

**[⬆ back to top](#table-of-contents)**

</details>



<details>
    <summary><b>Quantidade de reviewers deve ser no mínimo 2 pessoas</b></summary>

A quantidade mínima de pelo menos 2 desenvolvedores, aumentam a confiabilidade na qualidade da revisão.

**[⬆ back to top](#table-of-contents)**

</details>



**No momento que o PR for criado**

- Reviewer , seja criterioso em sua análise

- Desenvolvedor, não seja preciosista com seu código, todos podem contribuir com a qualidade do código

- Desenvolvedor, ao fazer merge na master, não esqueça que o fluxo ainda não acabou e deve seguir até produção



**Padronização de nomes e Código do Jira**

O Código do JIRA deve conter sempre as letras maiúsculas seguidos de números separados por hífen

- Nomenclatura das branchs
  - Para funcionalidades utilizar o seguinte padrão `feature/descricao-da-funcionalidade`, ex: `feature/add-new-feature`
  -  Para correções de bugs utilizar o seguinte padrão `hotfix/descricao-da-funcionalidade`, ex: `hotfix/fix-bug`

**[⬆ back to top](#table-of-contents)**



## Testes Unitarios



### Proposito

Os testes são a prova de que o desenvolvedor realmente testou que um método faz o que deveria fazer. Quando fazemos manutenção em um código os testes são o respaldo para termos segurança em lançar uma nova versão, validando se o que foi feito não impactou em outro lugar.



### Principios

Os testes de unidade funciona independente da interação com outras partes do código, verificando o funcionamento da menor unidade testável da nossa aplicação

- Isolados - sem dependências externas como por exemplo banco de dados, apis
- Sem estado - todo teste deve morrer completamente sem guardar estado do teste anterior
- Unitário - Deve testar apenas uma unidade



### Anatomia de um teste

#### Triplo AAA

- Arrange : Deve preparar tudo que vai ser utilizado no teste, como dados e mock's
- Act : Deve ter apenas uma action por teste
- Assert : Deve validar o resultado se positivo ou negativo do teste

> usar comentários //Arrange //Act //Assert



#### Nomenclatura

> methodName_shouldAny_whenCondition



**Exemplo**

```javascript
// Usando Jest

test('setName_shouldSetAValueInName_whenValueHasValue', () => {
  // Arrange
  const user = new User();
  const value = 'Name';

  // Act
  user.setName(value);

  // Assert
  expect(user.name).toBeDefined();
  expect(user.name).not.toBe('');
});
```



### Estrutura no projeto e cobertura de testes

**Em aplicações**

- Camadas onde se tem regra de negócio/orquestração deve conter 100% de cobertura nos testes unitários
- Os testes devem estar co-localizados ou em pasta `__tests__` que espelha a estrutura do projeto

```
src/
  application/
  domain/
__tests__/
  application/
  domain/
```

Ou usando a convenção de sufixo de arquivo:

```
src/
  application/
    order.service.js
    order.service.test.js
  domain/
    order.js
    order.test.js
```



**Em bibliotecas**

- Devem conter sempre testes de suas funcionalidades, sempre que possível
- Os testes devem estar separados pra cada projeto próprio, como mencionado no tópico de testes em aplicações

```
packages/
  string-extensions/
    src/
    __tests__/
  object-extensions/
    src/
    __tests__/
```

## Concorrencia

<details>
<summary><b>Use Async/Await</b></summary>

**Prefira async/await a callbacks e Promises encadeadas**

Async/await torna o código assíncrono mais legível e fácil de depurar.

**Bad:**

```javascript
fetchUser(userId)
  .then(user => fetchOrders(user.id))
  .then(orders => fetchInvoices(orders[0].id))
  .then(invoice => processInvoice(invoice))
  .catch(err => console.error(err));
```

**Good:**

```javascript
async function processUserInvoice(userId) {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchOrders(user.id);
    const invoice = await fetchInvoices(orders[0].id);
    await processInvoice(invoice);
  } catch (err) {
    console.error(err);
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Use Promise.all para operações paralelas independentes</b></summary>

Quando operações assíncronas não dependem umas das outras, execute-as em paralelo.

**Bad:**

```javascript
async function getUserDashboard(userId) {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(userId);   // espera desnecessária
  const invoices = await fetchInvoices(userId); // espera desnecessária
  return { user, orders, invoices };
}
```

**Good:**

```javascript
async function getUserDashboard(userId) {
  const [user, orders, invoices] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchInvoices(userId),
  ]);
  return { user, orders, invoices };
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Sempre trate erros em funções assíncronas</b></summary>

Promises rejeitadas sem tratamento podem encerrar o processo ou gerar comportamentos silenciosos e imprevisíveis.

**Bad:**

```javascript
async function deleteUser(userId) {
  const user = await fetchUser(userId); // pode lançar, sem tratamento
  await db.delete(user.id);
}
```

**Good:**

```javascript
async function deleteUser(userId) {
  try {
    const user = await fetchUser(userId);
    await db.delete(user.id);
  } catch (err) {
    logger.error('Failed to delete user', { userId, err });
    throw err;
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Evite bloquear o event loop</b></summary>

O Node.js usa um único thread. Operações síncronas pesadas bloqueiam o event loop e degradam a performance de todas as requisições.

**Bad:**

```javascript
app.get('/report', (req, res) => {
  const result = heavySyncComputation(largeDataset); // bloqueia o event loop
  res.json(result);
});
```

**Good:**

```javascript
const { Worker } = require('worker_threads');

app.get('/report', async (req, res) => {
  const result = await runInWorker(largeDataset); // processa em thread separada
  res.json(result);
});
```

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**



## Formatacao de Codigo

<details>
    <summary><b>Use um arquivo .editorconfig</b></summary>

**Bad:**

Existe muitos estilos de formatar um código em um projeto. Por exemplo, estilo de indentação com `espaço` e `tab` misturado em um projeto.

**Good:**

Definir e manter um estilo de código consistente na sua base de código.

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**


## Bibliotecas

**Tentar sempre ter retro compatibilidade**

A retrocompatibilidade facilita o uso da biblioteca por mais de um projeto.



**Utilize o conceito de semver para o versionamento (https://semver.org/lang/pt-BR/)**

- Major - quando fizer mudanças incompatíveis na API
- Minor - quando adicionar funcionalidades mantendo compatibilidade
- Patch - quando corrigir falhas mantendo compatibilidade


## ORM

### Node.js

O ORM adotado é o **Prisma** — type-safety nativo via `schema.prisma`, geração automática de tipos TypeScript, migrations integradas e excelente documentação. As práticas abaixo assumem Prisma como padrão.

<details>
<summary><b>Prefira queries tipadas e evite strings SQL raw desnecessárias</b></summary>

Strings SQL raw contornam a camada de abstração do ORM e são propensas a erros de digitação e SQL injection.

**Bad:**

```javascript
const users = await db.query(`SELECT * FROM users WHERE role = '${role}'`);
```

**Good:**

```javascript
const users = await prisma.user.findMany({
  where: { role },
});
```

Quando SQL raw for inevitável, use sempre parâmetros parametrizados:

```javascript
const users = await prisma.$queryRaw`SELECT * FROM users WHERE role = ${role}`;
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Evite o problema N+1</b></summary>

O problema N+1 ocorre quando uma query carrega uma lista e depois faz uma query adicional para cada item. Use eager loading (include/relations) para carregar dados relacionados em uma única operação.

**Bad:**

```javascript
const orders = await prisma.order.findMany();

for (const order of orders) {
  // N queries adicionais — uma por pedido
  order.customer = await prisma.customer.findUnique({
    where: { id: order.customerId },
  });
}
```

**Good:**

```javascript
const orders = await prisma.order.findMany({
  include: { customer: true },
});
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Use transações para operações que devem ser atômicas</b></summary>

Sempre que múltiplas operações de escrita precisam ser concluídas juntas ou nenhuma delas deve persistir, use transações.

**Bad:**

```javascript
await prisma.order.create({ data: orderData });
await prisma.stock.update({ where: { id: stockId }, data: { quantity: newQty } });
// se a segunda falhar, o pedido já foi criado — estado inconsistente
```

**Good:**

```javascript
await prisma.$transaction(async (tx) => {
  await tx.order.create({ data: orderData });
  await tx.stock.update({ where: { id: stockId }, data: { quantity: newQty } });
});
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Selecione apenas os campos necessários</b></summary>

Evite `SELECT *` implícito. Buscar campos desnecessários aumenta o tráfego de rede e o consumo de memória.

**Bad:**

```javascript
const user = await prisma.user.findUnique({ where: { id } });
// retorna todos os campos, incluindo hash de senha, dados sensíveis etc.
```

**Good:**

```javascript
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
});
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Gerencie o schema com migrations versionadas</b></summary>

Nunca altere o schema do banco de dados diretamente em produção. Use o sistema de migrations do ORM para manter o histórico de alterações rastreável e reproduzível.

**Bad:**

```sql
-- executado manualmente em produção
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

**Good:**

```bash
# 1. Altere o schema.prisma
# 2. Gere a migration
npx prisma migrate dev --name add-phone-to-users

# 3. Aplique em produção
npx prisma migrate deploy
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Use o padrão Repository para isolar o acesso a dados</b></summary>

Encapsule as chamadas ao ORM em repositórios. Isso facilita testes unitários (mock do repositório) e centraliza as queries de um agregado em um único lugar.

**Bad:**

```javascript
// lógica de negócio acoplada ao ORM
class OrderService {
  async getActiveOrders() {
    return prisma.order.findMany({
      where: { status: 'ACTIVE' },
      include: { customer: true },
    });
  }
}
```

**Good:**

```javascript
// repository
class OrderRepository {
  async findActive() {
    return prisma.order.findMany({
      where: { status: 'ACTIVE' },
      include: { customer: true },
    });
  }
}

// service depende da abstração, não do ORM diretamente
class OrderService {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async getActiveOrders() {
    return this.orderRepository.findActive();
  }
}
```

**[⬆ back to top](#table-of-contents)**

</details>

<details>
<summary><b>Configure o connection pool adequadamente</b></summary>

O ORM mantém um pool de conexões com o banco. Um pool subdimensionado cria gargalos; um pool superdimensionado sobrecarrega o banco.

Configure o limite de conexões via `connection_limit` na `DATABASE_URL` ou diretamente no `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```
# .env — connection_limit controla o tamanho do pool
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**[⬆ back to top](#table-of-contents)**

</details>

**[⬆ back to top](#table-of-contents)**


## Referencias

- https://cloud.google.com/apis/design/

**[⬆ back to top](#table-of-contents)**
