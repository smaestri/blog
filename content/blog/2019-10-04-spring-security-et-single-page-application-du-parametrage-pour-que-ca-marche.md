---
title: 'Spring Security et Single Page Application : du paramétrage pour que ça marche!'
author: sylvain
type: post
date: 2019-10-04T21:17:38+00:00
url: /index.php/2019/10/04/spring-security-et-single-page-application-du-parametrage-pour-que-ca-marche/
categories:
  - Backend
tags:
  - backend
  - spring-security

---

## Introduction

*Spring Security *est un framework qui permet l’authentification des utilisateurs, et de vérifier s'ils sont bien autorisés à accéder aux ressources voulues.  
On va constater dans cet article qu'il est nécessaire de paramétrer *Spring Security* afin de le faire fonctionner convenablement avec une *Single Page Application* (*Angular* ici).

## Appel au service built-in Login

Spring Security vient avec un service d'authentification automatiquement, dont le endpoint est _**Login**_.  
Malheureusement, celui-ci accepte uniquement le format en entrée de type _**[FormData][1]**_, issus des formulaires HTML traditionnels. Or les SPA récents comme Angular envoient par défaut du JSON lors des appels REST. Il faut donc modifier cela pour envoyer du FormData:

```javascript
var bodyFormData = new FormData();
bodyFormData.set('username', user.email);
bodyFormData.set('password', user.password);
return this.http.post('/login', bodyFormData);
```

## Paramétrage du Login avec succès

Lorsqu'une authentification est réalisée avec succès, Spring Security va par défaut effectuer une redirection vers / avec un code HTTP 302.  
Or dans le cas d'une SPA, nous voulons simplement renvoyer un code HTTP 200 de succès, sans aucune redirection. C'est le front (SPA) qui réagira en fonction du code retourné.  
Pour cela, nous devons surcharger la classe Spring Security _[SimpleUrlAuthenticationSuccessHandler][2]_ :

Et ne pas oublier la configuration via la méthode `successHandler` de Spring Security: `successHandler(mySuccessHandler)`.

```java
@Component
public class MySavedRequestAwareAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(final HttpServletRequest request, final HttpServletResponse response, final Authentication authentication) throws ServletException, IOException {
        response.setStatus(200);
    }

}
```

## Paramétrage de la redirection vers Login

Par défaut, lorsque l'utilisateur n'est pas autorisé à accéder à une ressource (non connecté par exemple), alors Spring Security redirige vers une page de Login prédéfinie via un code HTTP 302.  
Nous ne voulons pas cela dans une SPA : nous voulons renvoyer simplement un code HTTP 401, _**not authorized**_ pour indiquer que l'utilisateur ne peut pas accéder à la ressource. Charge au front d'afficher une belle pas d'erreur, ou rediriger vers la page de login. Pour ce faire, nous devons surcharger la méthode _commence()_ de l'interface Spring Security _[AuthenticationEntryPoint][3]_, comme ceci :


```java
/**
 * The Entry Point will not redirect to any sort of Login - it will return the 401
 */
@Component
public final class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(
            final HttpServletRequest request,
            final HttpServletResponse response,
            final AuthenticationException authException) throws IOException {

        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }
}
```
et ne pas oublier la configuration via la méthode Spring Security `authenticationEntryPoint()` associée : `authenticationEntryPoint(restAuthenticationEntryPoint)`

## Conclusion 

Voilà, vous avez maintenant une authentification qui fontionne dans le cadre d'une Single Page Application, youpi!  
Vous pouvez accéder à une application concrète qui met en pratique tout ce qu'on vient d'apprendre [ici][4] A votre écoute pour tout commentaire ou remarque, je vous dis à très bientôt pour de nouvelles aventures!

 [1]: https://developer.mozilla.org/fr/docs/Web/API/FormData
 [2]: https://docs.spring.io/spring-security/site/docs/4.2.12.RELEASE/apidocs/org/springframework/security/web/authentication/SimpleUrlAuthenticationSuccessHandler.html
 [3]: https://docs.spring.io/spring-security/site/docs/4.2.12.RELEASE/apidocs/org/springframework/security/web/AuthenticationEntryPoint.html
 [4]: https://github.com/smaestri/sharebook/blob/master/backend/src/main/java/com/udemy/sharebook/configuration/WebSecurityConfig.java