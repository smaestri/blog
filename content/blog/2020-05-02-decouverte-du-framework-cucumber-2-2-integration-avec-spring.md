---
title: Découverte du framework Cucumber (2/2) – Intégration avec Spring
author: sylvain
type: post
date: 2020-05-02T18:12:01+00:00
url: /index.php/2020/05/02/decouverte-du-framework-cucumber-2-2-integration-avec-spring/
featured_image: http://www.effectivecoding.fr/wp-content/uploads/2020/05/cucumber-e1588490043653.jpeg
categories:
  - Backend
  - Test
tags:
  - bdd
  - cucumber
  - spring
  - spring-data

---
## Introduction

Dans <a href="https://www.effectivecoding.fr/index.php/2020/05/02/decouverte-du-framework-cucumber-1-2-introduction-a-bdd/" target="_blank" rel="noopener noreferrer">notre première partie</a>, nous avons mis en place un cas simple d’une gestion de *Todos* avec la méthodologie BDD, et le framework *Cucumber*.

Cependant nous avons stocké notre liste de *Todos* en dur, sans passer par une base de données. En contexte d’entreprise, il y a fort à parier qu’on persiste nos Todos dans une base de données, et qu’on utilise Spring pour simplifier cela! Nous allons donc voir dans ce billet comment intégrer Spring avec Cucumber.

## Mise en place d’une base de données avec *Spring-Data*

Nous allons mettre en place un _Repository_ Spring qui va se connecter à la base de données déclarée. Comme vous le savez, Spring Boot se base sur les dépendances Maven (ou autre système de build) pour configurer automatiquement la source de données ( principe _convention over configuration)_. Ainsi, en déclarant une base _HsqlDb_ dans notre _pom.xml,_ on aura une base opérationnelle en mémoire, et ce automatiquement!

```xml
<dependency>
	<groupId>org.hsqldb</groupId>
	<artifactId>hsqldb</artifactId>
	<version>2.4.0</version>
	<scope>test</scope>
</dependency>
```

Étant donné que nous sommes dans un contexte BDD, nous allons mettre le scope *test* pour cette base. Nous allons instancier notre base de données _Hsqldb_ uniquement lors du lancement de notre test Cucumber. On peut imaginer une autre base en condition réelle (hors tests).

Ensuite, il faut déclarer notre _repository_ qui accédera à la Base de données. On utilise le formalisme *Spring-Data* pour cela. Si vous voulez plus d’informations au sujet de Spring-Data, c'est par [ici](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#reference).

```java
@Repository
public interface TodoRepository  extends JpaRepository<Todo, String> {
}
```

Il faut également modifier notre service, qui appellera notre repository à présent au lieu de la liste statique pas très élégante de notre première partie.

```java
@Service
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    public void addTodo(String description) {
        this.todoRepository.save(new Todo(description));
    }

    public List<Todo> getTodos() {
        return todoRepository.findAll();
    }
}
```

## Intégration de Spring dans Cucumber

Maintenant que nous avons mis à jour notre code de production (c’est à dire pas le code de test) à jour pour se connecter à une base de données, il faut maintenant permettre à nos *steps* d’appeler le contexte Spring et vérifier que la persistance de nos *Todos* marche bien. Ainsi, il faudra injecter le service _TodoService_, pour permettre la création d’un *Todo* à partir d’une Step Cucumber.

Pour cela, il faut avant tout déclarer la dépendance suivante dans notre _pom.xml_ pour faire le lien entre Cucumber et Spring :

```xml
<dependency>
	<groupId>io.cucumber</groupId>
	<artifactId>cucumber-spring</artifactId>
	<version>4.7.4</version>
	<scope>test</scope>
</dependency>
```

Pour permettre à Cucumber d’accéder au contexte Spring, il faut indiquer dans la classe _TodoSteps_ : Run_With(SringRunner.class)_, ainsi que l'injection du contexte Spring via l’annotation _@SpringBootTest._ Pour plus d’informations sur cette annotation, se référer [ici][1].

De plus, on injecte dorénavant notre service Spring _TodoService_ directement dans notre classe des Steps. Notre classe des Steps ayant été largement modifiée, je la mets ci-dessous au complet:

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class TodoSteps {

    @Autowired
    TodoService todoService;

    @Autowired
    TodoRepository todoRepository;

    @Given("ma liste de todos est vide")
    public void initActions(){
    }

    @When("^j'insére un todo avec la description (.*)$")
    public void insertAction(String description) {
        todoService.addTodo(description);
    }

    @Then("^ma liste contient un todo avec la description (.*)$")
    public void checkAction(String description) {
        List<Todo> todos = todoService.getTodos();
        assertEquals(1, todos.size());
        assertEquals(description, todos.get(0).getDescription());
    }
}
```

## Conclusion

Nous avons désormais un test Cucumber qui se greffe au contexte Spring, afin d’ajouter un *Todo* en base de données, via une requête SQL _insert_. On vérifie ensuite via une autre requête _Select_ que notre Todo a bien été inséré_._ J’ai affiché les requêtes SQL&nbsp; dans la console afin que vous constatiez le résultat! L’ensemble du code est accessible [ici][2].

 [1]: https://www.effectivecoding.fr/index.php/2019/12/09/test-unitaires-et-dintegration-avec-spring-boot-le-test-slicing/
 [2]: https://github.com/smaestri/cucumber-part2