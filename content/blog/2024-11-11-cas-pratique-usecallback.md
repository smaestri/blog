---
title: 'Cas pratique des hooks React useCallback et memo'
author: sylvain
type: post
date: 2024-11-11T14:51:26+00:00
categories:
  - blog

---

Nous allons découvrir dans ce post un cas pratique de l'utilisation des hooks `useCallback()` et `memo()`.

## Présentation de l'application

Supposons qu'on ait une application toute simple avec 2 composants :
- `App` qui affichera une liste d'éléments sélectionnés (chaine de charactères pour faire simple dans notre cas), et qui sera le parent d'un autre composant `Child`;
- `Child`,qui permettra :
  -  afficher une liste d'éléments en dur (on peut imaginer en entreprise que ces éléments viennent d'une API REST par exemple)
  -  sélectionner un élément via un bouton, et afficher cet élément sélectionné dans `App`

Règle importante : on ne doit pas afficher deux fois le même élément sélectionné dans `App`.


## Mise en place des composants

### App

On va voir besoin de stocker les éléments sélectionnés dans `App` via un `useState()`, le hook qui nous permet de sauvegarder l'état de nos composants React. Nommons ce state `selectedItems`, qui stockera simplement des `string`:

```javascript
const [selectedItems, setSelectedItems] = useState([])
```

La séléction d'un élément se fera via une fonction de callback passée à `Child` par `App`, `addSelectedItem`.
Il faudra mettre à jour ce state via `setSelectedItems`, et concaténer la valeur. On va vérifier qu'on n'a pas déjà sélectionné cette valeur via un `findIndex()`.  
Rappel important : il faut toujours renvoyer une nouvelle valeur quand met à jour le state React! plus d'infos [ici](https://fr.react.dev/learn/updating-objects-in-state).  
Ca tombe bien, [_concat_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat) que l'on va utiliser,  renvoit un nouveau tableau et ne modifie pas l'existant:

```javascript
    const addSelectedItem = (item: string) => {
        const exist = selectedItems.findIndex(
          (selectedItem) => selectedItem === item
        );
        if (exist === -1) {
          setSelectedItems(selectedItems.concat(item));
        }
    }
```

On va afficher ces éléments dans un simple `span`, ainsi que déclarer le composant `Child` et sa fonction de callback, `addSelectedItem` :

```javascript
<div>
  Items selected : {selectedItems.map((item: string) => <span key={item}>{item}</span>)}
</div>
<Child addSelectedItem={addSelectedItem}></Child>
```

### Child

Dans `Child`, on affichera tous les élements via un `state` spécifique, `items` (pas besoin de `setXXX` pour ce cas simple, on les initialise directement):
```javascript
const [items,] = useState(["item1", "item2", "item3"])
```
Et on affichera ces élements avec pour chacun un bouton, afin appeler la fonction de callback, et ainsi afficher l'élement sélectionné dans `App`.

```javascript
 <div>
  {items.map((item : string) => 
    <div key={item}>{item}<button onClick={() => addSelectedItem(item)}>Add</button></div>
  )}
</div>
```

Ajouton un `console.log `juste avant le `return` de `Child`, pour ainsi constater à quel moment exactement le composant est rendu: 
`console.log('render Child!')`

## Problèmes rencontrés et solutions

Démarrons l'application sans aucun hook particulier, et ouvrons les DevTools afin de voir notre `console.log `dans la console JS: nous allons constater divers problèmes avec ce code.

### Le Child est rendu trop de fois

Premier problème : à chaque fois que je click sur un bouton pour sélectionner un élément, on se rend compte que le composant `Child` est rendu (le message "render Child" s'affiche dans la console JS).  
Ici on a très peu d'éléments, mais pour une vraie application ca peut vite dégrader les performances! Surtout, il n'y a aucune raison de rendre à nouveau `Child`, car on sélectionne simplement une valeur qu'on stocke et affiche dans le composant `App`!  
Problème: Pourquoi `Child` est rendu de nouveau? Il faut comprendre le mécanisme de rendu des composants en React. Voici les deux événements qui déclenchent un rendu: 
- le state du parent change : tous les composants enfants sont rendus par défaut. Nous pouvons empêcher ce comportement, et nous avons vu dans [ce POST](https://effectivecoding.fr/2024-09-07-usecallback-vs-usememo/) comment faire; c'est ce que nous allons faire dans la partie suivante;
- les props du composant concerné changent.

Voyons si l'application du premier point corrige le problème.

### useCallback et memo

Pour éviter qu'un composant Child soit rendu quand son parent est rendu, on peut utiliser conjointement les hooks `useCallback` pour la fonction de callback `addSelectedItem`, et `memo()` pour le composant `Child`.

Déclarons `addSelectedItem` avec le hook `useCallback`, et un tableau de dépendance vides. Le reste est identique :

```javascript
  const addSelectedItem = useCallback((item: string) => {
...
   }, [])
```

Egalement, ajoutons le hook `memo()` au composant `Child` :

```javascript
export default memo(Child)
```

Testons de nouveau! Cliquez sur un élément, puis un autre : _patatra_, seul le dernier élément sélectionné s'affiche!

Nouveau problème : on affiche à présent seulement la dernière valeur sélectionnée! Cela est du au tableau vide déclaré avec `useCallback` : la fonction aura toujours connaissance de la première valeur de `selectedItems`, qui est un tableau vide.

Essayons donc de mettre `selectedItems` dans le tableau de dépendances de `useCallback` :
```javascript
  const addSelectedItem = useCallback((item: string) => {
...
   }, [selectedItems])
```

Cette fois, les valeurs sont bien mises à jour, mais on revient au problème initial : si vous regarder la console JS, on rend à nouveau `Child`, et ce n'est pas souhaitable comme expliqué précédemment.

Il faudrait donc trouver un moyen de :
- ne pas rendre `Child` de manière superflue : idéalement, utiliser `useCallback` avec un tableau vide de dépendances.
- le composant `App`, et plus spécifiquement la fonction de callback `addSelectedItem` doit avoir connaissance de la dernière valeur de `selectedItems`.

En modifiant la fonction `addSelectedItem`, et la façon dont on met à jour les `selectedItems`, on peut parvenir à cette fin. Voyons comment faire.

### Modifions setState()

Afin de pallier au problème précédent, nous allons revoir la fonction `addSelectedItem`. Plus spécifiquement, nous allons mettre le test de l'existence directement dans `setSelectedItems`! En effet, pour rappel, le state React peut se mettre à jour :
- directement avec une valeur (comme on l'a fait avec `setSelectedItems(selectedItems.concat(item));`)
- ou alors via une fonction, qui aura pour paramètre la valeur *précédente* du state! Ainsi, on pourra utiliser `useCallback` avec le tableau vide, et on aura la bonne valeur du state pour `selectedItems`! Mais alors, comment on fait?

```javascript
  const addSelectedItem = useCallback((item: string) => {
       setSelectedItems((selectedItems) => {
        const exist = selectedItems.findIndex(
          (selectedItem) => selectedItem === item
        );
        if (exist === -1) {
          return selectedItems.concat(item);
        }
       return selectedItems;
      })
   }, [])
```

Notez que nous avons bien remis le `useCallback` avec un tableau vide de dépendances, afin de ne pas rendre le composant `Child`! De plus, nous avons mis toute le code dans un fonction callback de `setSelectedItems`, et non plus par valeur directement.

Testons à nouveau: Bingo! Tout marche parfaitement à présent! Tout le code est visible dans [ce codesandbox](https://codesandbox.io/p/sandbox/k533gq) (il y a une petite icone pour afficher la console JS en haut à droite). Je vous dis à bientôt pour de nouvelles aventures du développement Web!

Documentation:  
memo: https://fr.react.dev/reference/react/memo  
useCallback https://fr.react.dev/reference/react/useCallback
