---
title: 'React.memo vs React.useCallback vs React.useMemo'
author: sylvain
type: post
date: 2024-09-07T14:51:26+00:00
categories:
  - blog

---
## Introduction

Nous allons découvrir dans ce post 3 hooks permettant d'améliorer les performances d'une application React, en limitant le nombre de render pour `React.memo` et `React.useCallback`, et en cachant le résultat d'une fonction couteuse avec `React.useMemo`.

## Update du state à partir du parent: `React.memo`

Imaginons un cas très simple, où un composant `Parent` met à jour sont état via un `useState`. Si ce composant `Parent` possède des enfants `Child`, alors ceux-ci seront également rendus, même s'ils ne sont pas concernés pas la mise à jour de l'état (c'est à dire qu'aucune `props` de `Child` ne change).

Pour tester simplement, on aura donc un composant `Parent` avec un state, et un bouton de mise à jour de ce state :
```javascript
const [count, setCount] = useState(0)
...
<button onClick={() => setCount(count + 1)}>Click Me!</button>
```
Le composant `Parent` rendera un composant `Child` tout simple:
```javascript
<Child  />
```

On va ajouter un `console.log` dans le retour de chaque composant ([à base de fonction](https://www.robinwieruch.de/react-function-component/)) pour vérifier le comportement.

### Problème

On se rend compte qu'au click sur le bouton, le composant `Child` est rendu! Or il n'y a pas lieu d'être : on a juste mis un jour le state de `Parent`, et rien n'est passé à `Child` via les props! Aucune raison de rendre de nouveau `Child`!

### Solution : `React.memo`

Une solution à ce problème est simplement de déclarer notre composant Child avec `memo` : cela indique à React que si les `props` du composant `Child` n'ont pas changé, alors ne pas le rendre à nouveau.

```javascript
  const Child = React.memo(() => {
...
   })
```
Ainsi le composant `Child` ne sera pluse rendu au click sur le bouton "Click Me".

## Update du state à partir de l'enfant: `React.useCallback`

Imaginons un autre cas, où  cette fois, un composant enfant `Child` a besoin de mettre à jour l'état de son parent (`Parent`).
On passera donc une fonction du `Parent` vers le `Child`, via une `prop`.

Comme dans l'exemple précédent, soit un composant `Parent` avec un state très simple, un compteur `count`:

```javascript
const [count, setCount] = useState(0)
```

la fonction qui incrémente le compteur et qui sera passée à `Child`: 

```javascript
 const handleClick = () =>{
    setCount(count+1)  
  }
```
Passée via une `prop` à `Child`:

```javascript
<Child handleClick={handleClick} />
```

Enfin j'affiche la valeur de `count` dans mon `Parent` :

```javascript
count is {count}
```

Dans mon `Child`, j'aurai un bouton simple pour appeler la fonction `handleClick` :

```javascript
<button onClick={handleClick}>update from child</button>
```

### Problème

Et bien si on laisse tel quel, au click sur le bouton, le composant `Child` va être rendu de nouveau! Pourtant c'est inutile, vu que la valeur de `count` est uniquement affichée dans le `Parent`, pourquoi re-render `Child`? C'est une pure perte de performance!

React agit ainsi, car la fonction `handleClick` aura une nouvelle référence à chaque rendu. Pour éviter cela, il faut utiliser `useCallback`.

### Solution

Nous allons simplement changer la fonction `handleClick` avec :
```javascript
const handleClick = useCallback(() => {
    setCount(count + 1)
  }, [])
```

En spécifiant `useCallback` avec un tableau vide, on indique à React que la fonction `handleClick` a besoin d'être instanciée une seule fois, à l'initialisation du composant : le composant `Child` ne sera pas rendu de nouveau, et on a corrigé notre problème!

## Mettre en cache un résultat couteux: `React.useMemo`

Cette fois-ci, on ne va pas pas se baser sur le rendu des composants `Parent` et `Enfant`, mais plutôt, imaginons une fonction trés lente (calcul complexes par exemple) dans un seul et même composant `Parent` :

```javascript
const computedValue = () => {
  let num=0;
  for (let i = 0; i < 1000000000; i++) {
    num += 1;
  }
  return num;
  };
```

Cette fonction n'a aucune dépendance sur un quelconque `state`.

Ajoutons en plus un `state` de compteur, comme fait précédemment dans le composant `Parent` :

```javascript
const [count, setCount] = useState(0);
```

Ajoutons un bouton pour mettre à jour le state `count` :

```javascript
<button onClick={() => setCount(count + 1)}>Click Me!</button>
```

Afficher le résultat de `computedValue` :
```javascript
<h1>Hello {computedValue()}</h1>
```
### Problème
Quand vous aller clicker sur le bouton, la fonction très lente `computedValue` va AUSSI être executée! En effet, le `state` change, et donc par défaut React execute de nouveau la fonction couteuse.

### Solution
Il faut indiquer à React que, vu que la fonction ne dépend pas d'un `state`, ne pas recalculer celle-ci. Avec `useMemo` ça donne :

```javascript
 const computedValue = useMemo(() => {
    let num=0;
    for (let i = 0; i < 1000000000; i++) {
      num += 1;
    }
    return num;
  }, []);
  ```

Il faut aussi changer l'appel à `computedValue` suite à l'utilisation de `useMemo`, en enlevant les parenthèses:
```javascript
<h1>Hello {computedValue}</h1>
```

Et là bingo, on ne rentre plus dans la fonction `computedValue()` au click sur le bouton, et donc du changement de state de `count`! On a mis en place un cache pour cette fonction.

J'espère que ces petits exemples vous autont familiarisé avec ces hooks fondamentaux de React.
Comme d'habitude le code est [ici](https://github.com/smaestri/blog-hook-react) sur mon Github. Changer le cas voulu dans `main.tsx`, puis lancer `npm i` et `npm run dev`.  

Voici également un article qui m'a inspiré :
https://kaushaldhakal40.medium.com/optimizing-react-performance-preventing-unnecessary-child-component-re-renders-17b421a6d39e#:~:text=The%20Solution%3A%20Memoization%20with%20React,change%2C%20effectively%20preventing%20unnecessary%20renders.

Codez bien!

Documentation:  
memo: https://fr.react.dev/reference/react/memo  
useCallback https://fr.react.dev/reference/react/useCallback  
usememo: https://fr.react.dev/reference/react/useMemo
