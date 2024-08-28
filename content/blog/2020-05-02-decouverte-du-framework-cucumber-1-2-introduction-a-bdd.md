---
title: Découverte du framework Cucumber (1/2) – Introduction à BDD et exemple pratique
author: sylvain
type: post
date: 2020-05-02T17:08:24+00:00
url: /index.php/2020/05/02/decouverte-du-framework-cucumber-1-2-introduction-a-bdd/
featured_image: http://www.effectivecoding.fr/wp-content/uploads/2020/05/cucumber-e1588490043653.jpeg
categories:
  - Backend
  - Test
tags:
  - bdd
  - cucumber
  - spring

---
## Introduction à BDD

*BDD*, ou _Behavior Driven Development_, est une méthode qui permet une collaboration entre la personne qui énonce le besoin (membre de l’équipe métier ou product-owner en Scrum par exemple), le développeur et le testeur. Dans des applications d’entreprise aux besoins parfois complexes, cette méthode permet de se mettre tous d’accord sur le besoin, et c’est la force principale de BDD.

Si on compare avec TDD (_Test Driven Develoment_), une autre méthode de développement qui a fais ses preuves, seul le développeur est maître de la mise en place de la méthode à partir des spécifications (voir mon article à ce sujet). La garantie est sur l’aspect technique, et la couverture de code notamment. BDD se concentre sur la garantie fonctionnelle globale de l’application.

Comment faire en sorte de mettre tout ce petit monde (product owner, développeur, testeur) d’accord? En se basant sur des scénarios dans une langue naturelle, et c’est ce que nous allons voir, à travers le framework *Cucumber*.

## L’écriture des scénarios en BDD

L’écriture des scénarios se fait donc en langage naturel mais on se doit de respecter une certaine syntaxe de base.

Ainsi, on déclare une _**Feature**_ avec une brève description générale du cas d’utilisation (par exemple gestion d’une Todo Liste).

On va ensuite déclarer un ou plusieurs _**Scénarios**_ de cette feature. Par exemple, ajout d’une TODO, suppression d’une TODO, etc.

Enfin, on décrit notre scénario, en se basant sur 3 mots clés : _**Given**_, _**When**_, _**Then.**_ On va prendre l’exemple l’ajout d’un TODO :

  * _Given_ : indique l’état du système avant l’action (ex. ma liste de Todos est vide);
  * _When_ : indique l’action effectué par l’utilisateur (ex : j’ajoute une Todo avec la description “Action à faire”);
  * _Then_ : indique l’état du système après l’action (ex : ma liste de Todos contient **_un_** élément avec la description “Action à faire”).

Cela donne: 
```yml
Feature: Gestion d'une liste de todos

  Scenario: Ajout d'un todo
    Given ma liste de todos est vide
    When j'insére un todo avec la description toto
    Then ma liste contient un todo avec la description toto
```


## L’écriture des étapes en JAVA

La deuxième partie de la mise en place de BDD consiste à écrire les différentes étapes des scénarios ci-dessus en JAVA (en langage _Cucumber_, on parlera de _**Glue**_).

Pour le _given_, on initialisera simplement une liste de _Todo_ vide (avec une _ArrayList_ pour faire simple par exemple).

Pour le _when_, on appellera la méthode de notre système à tester. Ici, il s’agit de l’ajout d’un TODO, _addTodo_().

Pour le _then_, on vérifiera que notre liste contient un élément. Par exemple avec la librairie _Junit_ et la méthode _assertEquals()_.

Cela donne :

```java
@Given("ma liste de todos est vide")
public void initActions() {
    TodoService.listTodos = new ArrayList<>();
}

@When("^j'insére un todo avec la description (.*)$")
public void insertAction(String description) {
    TodoService.listTodos.add(new Todo(description));
}

@Then("^ma liste contient un todo avec la description (.*)$")
public void checkAction(String description) {
    assrtEquals(1, TodoService.listTodos.size());
    assertEquals(description, TodoService.listTodos.get(0).getDescription());
}
```

Comme vous le voyez, on passe la description du *Todo* à ajouter en paramètre de l'étape. Cela se fait au moyen d’expressions régulières.

## Lancement de notre test avec le framework Cucumber

Ca y’est! on est prêt pour lancer notre premier test Cucumber! On va maintenant coder ensemble le reste de l’application :

  * service de gestion des Todos, *TodoService.java*
  * classe de test, *TodoTest.java*

### _Implémentation du service_

Pour faire simple, on va uniquement créer un service grâce à Spring-Boot et l’annotation _@Service._

Ce service nous servira à ajouter un _Todo_, ou les afficher. Bien entendu en contexte d’entreprise, on souhaite une base de données pour persister nos Todos, avec _Spring-Data_ pour gérer cela par exemple : ce sera l’objet de la 2ème partie de ce tutorial.

Voici à quoi ressemble notre service:

```java
@Component
public class TodoService {

    public static List<Todo> listTodos = new ArrayList<>();

    public void addTodo(String description) {
        this.listTodos.add(new Todo(description));
    }
}
```

Comme vous le voyez, on stocke pour l’instant nos _Todos_ dans une liste statique. Ceci est pour test uniquement, on verra dans la deuxième partie, comment améliorer cela!

### _Implémentation de la classe de test_

On va déclarer que l’on souhaite utiliser Cucumber pour le lancement de notre test via _<span class="pl-k">@RunWith</span>(<span class="pl-smi">Cucumber</span><span class="pl-k">.</span>class)_. De plus _<span class="pl-k">@CucumberOptions</span>(<span class="pl-c1">features</span> <span class="pl-k">=</span> <span class="pl-s"><span class="pl-pds"></span>src/test/resources<span class="pl-pds"></span></span>)_ nous permet d'indiquer où se situent nos fichiers _feature_. Je vous laisse voir la [doc][1] car on peut paramétrer pas mal de choses, par exemple l’emplacement des _steps_, la déclaration de plug-ins pour faire de jolis rapports, etc.).

Cela donne :  

```java
@RunWith(Cucumber.class)
@CucumberOptions(features = "src/test/resources")
public class TodoTests {
}
```

## Conclusion

Et voilà, on vient de voir la mise en place d’un scénario BDD avec le framework Cucumber, dans un exemple simple. Dans la seconde partie, nous verrons un exemple un peu plus complexe, avec l’intégration de Spring dans un test Cucumber et la mise en place d’une base de données locales pour persister nos Todos!

Comme d'habitude, l'ensemble du code est accessible sur mon github ici : *https://github.com/smaestri/cucumber-part1*

 [1]: https://docs.cucumber.io/