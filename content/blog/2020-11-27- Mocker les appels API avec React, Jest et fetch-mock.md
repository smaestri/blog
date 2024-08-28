---
title: 'Mocker les appels API avec React, Jest et fetch-mock'
author: sylvain
type: post
date: 2020-11-27T14:51:26+00:00
categories:
  - react

---
## Introduction

Récemment dans un projet, nous avons souhaité mettre en place des tests unitaires côté front, afin de sécuriser et optimiser le code de l'application WEB. Notre environnement une application React crée à partir de [create-react-app](https://create-react-app.dev/docs/getting-started/).
Il n'est pas concevable d'executer les requetes aux APIs, et donc il est nécessaire de mocker la fonction [*fetch*](https://developer.mozilla.org/fr/docs/Web/API/Fetch_API) (ou autre appel aynchrone avec la librairie *axios* par exemple).
Plusieurs solutions s'offrent à nous pour mocker cette fonction *fetch*, et donc spécifier une valeur de retour. Pour rappel, cette fonction est asynchrone (une [promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) est retournée)
- Mocker manuellement `window.mock` avec *Jest*, cependant nous verrons qu'il y a quelques inconvénients;
- Utiliser une librairie externe pour faire cela, nous verrons comment avec la librairie [*Fetch-Mock*](http://www.wheresrhys.co.uk/fetch-mock/);
- Utiliser un serveur de mock par exemple avec [*msw*](https://mswjs.io/), mais je ne voulais pas rentrer dans cette configuration et donc c'est hors scope pour ce post.


## Mocker manuellement *window.mock*
Avec *Jest*, on peut assez facilement mocker la fonction `fetch`.
Pour ce faire, à chaque fois qu'on lance un test, on a plusieurs options :  mocker le retour de la fonction `fetch` via  `mockResolvedValue`, ou carrément mocker son implémentation via `mockImplementation` (référence : https://jestjs.io/docs/en/mock-function-api)

Explications :

### *mockResolvedValue()*
On peut mocker le retour de la fonction `fetch` (qui est une *promise* pour rappel) grâce à la fonction *Jest* `mockResolvedValue`. Veuillez également noter que la fonction `json(`) est également une *promise*, et donc pensez à bien indiquer `async`!
Cela donne :

```javascript
window.fetch.mockResolvedValue({
    ok: true,
    json: async () => (/** JSON à retourner */),
  })
```

### *mockImplementation()*

On a plus de souplesse avec la fonction `mockImplementation` qu'avec `mockResolvedValue`.
En effet, on va pouvoir définir en fonction de l'URL d'entrée de la fonction `fetch`, le mock à utiliser. C'est donc plus puissant que la précédente, qui autorise seulement à renvoyer toujours le meme résultat quelquesoit l'URL.

On initialise le mock à chaque test :
```javascript
beforeEach(() => window.fetch.mockImplementation(mockFetch))`
```

avec `mockFetch` défini comme suit par exemple :

```javascript
async function mockFetch(url, config) {
switch (url) {
    case '/login':
      return {
        ok: true,
        status: 200,
        json: async () => (/* Mock retour pour login */),
      }

    case '/checkout': {
       return {
        ok: true,
        status: 200,
        json: async () => (/* Mock retour pour checkout */),
        }
    }
}
```
Ainsi, on va pouvoir en fonction de l'URL passsée en paramètre (ici *login* ou *checkout*), définir le mock à utiliser de la fonction `fetch`.
Une explication détaillée est présente sur ce superbe article (en anglais) : https://kentcdodds.com/blog/stop-mocking-fetch


### *fetch-mock*

[*Fetch-Mock*](http://www.wheresrhys.co.uk/fetch-mock/) est une librairie qui va nous permettre de simplifier le fonctionnement ci-dessus. En effet, on va pouvoir définir le mapping entre URL et valeur de retour de la fonction `fetch` de manière plus simple qu'avec `mockImplementation`.

- Import de la librairie :

```javascript
import fetchMock from "fetch-mock"`
```
- Mock de la fonction `fetch` : 
```javascript
fetchMock.mock("myUrl/login"), {/*retour attendu par fetch(sans la promise*/}`
```
Remarque : il est possible de debugger la librairie en ajoutant `DEBUG=fetch-mock*` en paramètre de *Jest*, dans le `package.json`.

## Conclusion

Et voilà, nous avons vu différents moyens de mocker cette fonction `fetch`, et tester en isolation notre *frontend*. Dans notre projet, nous avons utilisé la troisième approche avec *fetch-mock*, mais *msw* peut être intéressant aussi, ce sera l'objet d'un autre post!