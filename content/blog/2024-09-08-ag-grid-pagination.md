---
title: 'Pagination côté serveur avec ag-grid'
author: sylvain
type: post
date: 2024-09-20T14:51:26+00:00
categories:
  - blog

---
## Introduction

*Ag-Grid* est une librairie très utilisée et au nombre de fonctionnalités impressionnant, permettant d'afficher des tableaux (type "Excel") dans le navigateur. Il est également possible de faire tout un tas de manipulations sur les données. Je vous renvoie à [l'excellente documentation](https://www.ag-grid.com/javascript-data-grid/getting-started/) pour plus de détails.  
Il existe également un composant [React Ag-Grid](https://www.ag-grid.com/react-data-grid/) qui permet une intégration optimale si vous utilisez React; Ca tombe bien, c'est notre cas!  
Parmi les features intéressantes, il y a la gestion de la pagination côté serveur. Nous allons voir dans un premier temps ce qu'est une API paginée, et comment *ag-grid* s'intégre parfaitement avec une telle API.

## Une API paginée, c'est quoi ?


### Concepts d'une API paginée
Quand une API renvoit un grand nombre de données, celle-ci ne va pas renvoyer TOUTES les données, cela serait trop coûteux et risquerait de simplement planter le navigateur! Au lieu de cela, l'API va renvoyer un ensemble restreint d'éléments, ou "pages" qui seront basées sur un élément de départ, ou l'`offset` et le nombre d'éléments à retourner, ou `limit`.

Par exemple, prenons [l'API Pokemon](https://pokeapi.co/docs/v2#berries-section), librement accessible.  Prenons une ressource exposée par l'API : les *Berries*. Si nous appeleons le endpoint *https://pokeapi.co/api/v2/berry/* sans aucun paramètre, alors on aura un résultat de type :

```json
{
  "count":541,
  "next":"https://pokeapi.co/api/v2/berry?offset=20&limit=20",
  "previous":null,
  "results": [...]
}
```
`count` indique le nombre total d'éléments, mais seulement un nombre par défaut (ici 20) sera renvoyé par l'API, dans la variable `results`. On a aussi des liens  `next` et `previous`, qui suivent la norme [HATEOAS](https://fr.wikipedia.org/wiki/HATEOAS#:~:text=HATEOAS%2C%20abr%C3%A9viation%20d'Hypermedia%20As,autres%20architectures%20d'applications%20r%C3%A9seau.), mais nous ne rentrerons pas dans le détail de ce concept dans ce POST.  

### Impacts sur l'interface utilisateur


Si on souhaite afficher le résultat d'une API paginée dans un joli tableau, avec des boutons "précédent" et "suivant" pour parcourir la liste des Berries par exemple, les choses peuvent vite devenir compliquées si on fait tout à la main:  
- Appel manuel à l'API via `fetch` ou une lib tipe `Axios` sur un nombre d'éléments;
- Parcourir les résultats et afficher les lignes du tableau
- Création de bouton de navigation "Précédent" et "suivant", ainsi que "première page" et "dernière page"
- et j'en passe!

 Bref ça fait du boulot!


Et bien Ag-grid va faire tour ce boulot pour vous! En étudiant précisément [la documentation](https://www.ag-grid.com/react-data-grid/server-side-model-pagination/), on va pouvoir indiquer à *ag-grid* comment appeler notre API paginée, et la lib est capable de nous générer tout les boutons automatiquement, et même des *spinner* de chargement (*Loading...*) pendant le chargement des résultats!  

Alors comment on fait?
1. On va tout d'abord installer la librairie *ag-grid* via `npm install ag-grid-enterprise`(attention il faut bioen utiliser la version *enterprise* et non la version *community*. Heureusement si vous ne mettez pas en production votre projet, c'est OK pour tester gratuitement). Suivez également les instructions du Getting started [à cette adresse](https://www.ag-grid.com/javascript-data-grid/getting-started/);
2. Installer le wrapper `AgGrid` pour React via `npm install` `ag-grid-react`
3. Déclarer notre composant *AgGrid* avec les paramètres requis pour faire de la pagination côté serveur, je vous laisse vous référer à la [documentation Ag-Grid](https://www.ag-grid.com/react-data-grid/server-side-model-pagination/) pour avoir l'explication détaillée des paramètres :

```javascript
import { AgGridReact } from 'ag-grid-react'

[...]

<AgGridReact
    rowModelType='serverSide'
    columnDefs={columnDefs}
    pagination={true}
    paginationPageSize={PAGE_SIZE}
    cacheBlockSize={PAGE_SIZE}
    serverSideDatasource={getServerSideDataSource()}
/>

```
4.Implémenter la fonction `getServerSideDataSource()` : c'est le coeur du fonctionnement, cette fonction va permettre d'appeler l'API *Pokemon* avec les bons paramètres :

```javascript
const getServerSideDataSource = () => {
        return {
            getRows: (params: any) => {
                const blockSize = params.request.endRow - params.request.startRow;
                let url = `https://pokeapi.co/api/v2/berry?offset=${params.request.startRow}&limit=${blockSize}`
                axios.get(url)
                    .then((response: any) => {
                        params.success({
                            rowData: response.data.results,
                            rowCount: response.data.count
                        })
                    })
                    .catch((error) => {
                        alert('error')
                    })
              }
        }
    }
```

On peut tester tout ça ! Démarrer votre application et regarder l'onglet *Network* de vos *DevTools*, pour voir les requetes executées sur l'API Pokemon.
Vous verrez : `https://pokeapi.co/api/v2/berry?offset=0&limit=20`. Bingo!

Si vous cliquer sur le signe ">" pour "page suivante", alors les résultats sont automatiqument mis à jour, et on se rend compte que l'appel à l'API est correct: `https://pokeapi.co/api/v2/berry?offset=20&limit=20`! Youpi!

Comme d'habitude, le code source complet peut etre téléchargé [sur mon Github](https://github.com/smaestri/blog-ag-grid-pagination); à cette adresse! J'ai même ajouté un appel à 2 API paginées distinctes, avec 2 boutons (`Berry` et `Location`).  

J'espère que cet article vous a été utile, je suis preneur de tous vos commentaires ci-dessous!


