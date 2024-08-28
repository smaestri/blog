---
title: 'Spring Boot et Bean Validation : injecter un repository dans un Validator custom'
author: sylvain
type: post
date: 2021-04-02T14:51:26+00:00
categories:
  - spring-boot
  - bean validation

---
## Introduction

La spécification [Bean Validation](https://beanvalidation.org/2.0/), dont l'implémentation est [Hibernate Validator](http://hibernate.org/validator/), permet de valider si certains champs sont *null*, la longueur des champs, etc. C'est bien pratique car ça évite de devoir réimplémenter la roue, une seul annotation par exemple *@NotNull* suffit pour dire que le champ annoté de ne doit pas être *null*.

On peut aller plus loin et faire une classe de validation personnalisée. Par exemple, vérifier qu'un mail n'est pas existant en base avant une inscription.

La spécification nous permet de mettre en place un tel controle personnalisé, c'est ce que nous allons voir en 1/.

Le problème c'est qu'on souhaite avoir un repository *Spring Data*  dans cette classe de validation, afin d'interrgoer la base de données. Et là on un soucis, que je vais vous présenter en 2 .
On verra deux solutions à ce problème.

## 1 - Mise en place de notre contrôle personnalisé

Pour mettre en place notre contrôle de vérification d'e-mail, on va tout d'abord importer la librairie *Bean Validation* dans le *pom.xml*:

```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
```
Ensuite on va mettre en place une annotation particulière, *@EmailExisting*, qu'on va placer sur le champ *email* de notre entité, pour lancer le contrôle. Ce contrôle est stocké dans la classe *EmailValidator*. L'annotation *@Constraint* permet le lien entre l'annotation et la classe *EmailValidator* :

```java
@Documented
@Constraint(validatedBy = EmailValidator.class)
@Target( { ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface EmailExisting {
    String message() default "Email already exists";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

Enfin on code notre controle de vérification d'email, avec la déclaration de notre repository Spring Data pour interroger la base de données:

```java
public class EmailValidator implements
        ConstraintValidator<EmailExisting, String> {

    @Autowired
    UserRepository userRepository;

    @Override
    public boolean isValid(String email,
                           ConstraintValidatorContext cxt) {
        List<User> users = userRepository.findByEmail(email);
        if (!users.isEmpty()) {
            return false;
        }
        return true;
    }

}
```

Il faut aussi déclarer *@Valid* dans le controlleur MVC REST pour activer la validation:
```java
    @PostMapping(value = "/users")
    public ResponseEntity addUSer(@Valid @RequestBody User user, HttpServletResponse response) {

        user.setEmail(user.getEmail());
        user.setLastName(StringUtils.capitalize(user.getLastName()));
        user.setFirstName(StringUtils.capitalize(user.getFirstName()));
        userRepository.save(user);

        return new ResponseEntity(user, HttpStatus.CREATED);
    }
```

## Problème : l'injection du repository est null!

Testons cela : lancer le serveur, et appeler le endpoint sur http://localhost:8080/users avec par exemple [Postman](https://www.postman.com/). Il faudra indiquer un *requestBody* adapté, par exemple :
```json
{
email: "tata@yopmail.com",
firstName: "tata",
lastName: "tata",
password: "tatata"
}
```

Le contrôle se déclenche deux fois, du fait que nous ayons déclaré la classe *User* à la fois comme entrée du service REST dans le controlleur, et aussi comme entité JPA correspondant à la table USER. Ainsi, on a 2 validations :
- une première fois dans la couche controlleur par SPRING MVC via l'annotation *@Valid*. Aucun problème, le controle se passe bien ;
- une deuxième fois lorsque l'on tente de sauvegarder le *User* via la méthode *save()* de Spring JPA. On rappelle à nouveau le contrôle d'email, et là le repository devient *null*, pour une raison que j'ignore! Ca implique une hideuse *NullPointerException*!

La solution que l'on va mettre en place va désactiver purement et simplement la validation au moment de la sauvegarde. En effet, on a déjà effectué la validation dans la couche controleur. Il est inutile de le faire une nouvelle fois. Nous allons voir deux méthodes : passer par un DTO, ou utiliser la configuration Spring.

## Solution 1 : Via un DTO

Nous allons divider notre Objet *User* en 2 :
- un *UserDTO* correspondant à l'entrée du service;
- un *User* correspondant à notre entité JPA

Ainsi, on supprime tous les validator sur l'entité JPA *User*, et on les garde uniquement sur *UserDTO*. C'est en général ce qui est fait en entreprise. Vous pouvez voir le code source de cette solution [ici ](https://github.com/smaestri/poc-spring-validation/tree/solution-1-with-dto).

## Solution 2 : Via la configuration Spring
Une autre solution, si vous tenez absolument à garder une seule classe *User*, est tout simplement de désactiver le contrôle lors de l'enregistrement. Ca fait sens, vu qu'on a déjà fait le contrôle juste avant dans la couche Controlleur.

Il faut ajouter au fichier de configuration Spring Boot *application.properties* :

`spring.jpa.properties.javax.persistence.validation.mode=none 
`

Et bingo, ça marche cette fois, mais on ne rentre qu'une seule fois dans le controle de validation, via *@Valid* et Spring MVC.

Le code est accessible ici :https://github.com/smaestri/poc-spring-validation

## Conclusion
Aucune de ces 2 solutions n'est idéale, si vous avez une idée comment injecter le repository et permettre ainsi de valider deux fois avec un seul et même objet *User*, je suis preneur!

Cheers,

PS : Très bons articles qui m'ont été utiles :
- https://reflectoring.io/bean-validation-with-spring-boot/
- http://dolszewski.com/spring/custom-validation-annotation-in-spring/

et stackoverflow: 

- https://stackoverflow.com/questions/47245122/spring-hibernate-autowired-is-null-in-constraintvalidator
- https://stackoverflow.com/questions/36368190/can-i-autowired-one-repository-inside-spring-boot-custom-validator
- https://stackoverflow.com/questions/12676299/spring-3-1-autowiring-does-not-work-inside-custom-constraint-validator
- https://stackoverflow.com/questions/30715795/how-to-inject-spring-bean-into-validatorhibernate