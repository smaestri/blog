---
title: Création d'une bibiliothèque de composants React communs, avec NPM, VITE, LERNA, et STORYBOOK - Partie 2
author: sylvain
type: post
date: 2025-03-12T14:51:26+00:00
categories:
  - react
  - lerna

---

C'est la suite de l'arrticle sur la mise en place d'une bibilothèque de composants React réutilisables. Merci de consulter [la première partie](http://effectivecoding.fr/2025-03-09-Bibliotheque-React-part1/) si ce n'est pas déjà fait.

 ## Mise en place de Lerna
 [Lerna](https://lerna.js.org/) est un outil permettant de gérer de multiples sous-projets au sein d'un même repository.

 En effet, nous souhaiton publier nos composants individuellement, et non pas dans une seule et unique librairie : chaque composant aura sa propre librairie, et donc son `package.json`, ses fichiers de configuration, etc.

 ### Intialisation de Lerna et la notion de workspaces
 Si on esaye d'installer Lerna directement via `npx lerna init`, on aura un message intéressant, indiquant d'utiliser les workspaces NPM.

 Les [workspaces NPM](https://docs.npmjs.com/cli/v7/using-npm/workspaces) permettent de gérer justement les cas où on a un projet "root" avec des sous-projets; ici, tous nos sous projets seront les composants React à publier, et le projet "root", ce sera notre storybook qui permettra de montrer tous nos composants React dans une UI attractive.

 La première choise à faire est donc de définir notre workspace. Dans le `package.json`, indiquez :

```json
   "workspaces": [
    "packages/*"
  ]
```

 Comme vous voyez, nous allons mettre nos composants dans un nouveau répertoire `packages`. Dans ce répertorie, on aura tous nos composants React à publier (un sous-répertoire par composant). Nous n'en avons qu'un pour l'instant, `Button`. On va donc créer un sous-répertoire `Button` dans `packages`. On aura le composant React dans `packages/src`, et la story associée dans `packages/src/<fichier story>`.

Egalement, l'intialisation de Lerna a crée un fichier `lerna.json` qui est le fichier de configuration global de Lerna, nous y reviendrons.
 
 ### Configuration de notre composant
 Vu que nous publions le comopsant via Lerna à présent, le fichier d'export dans `lib/index.tsx` peut etre supprimé.

 On va également ajouter un fichier `package.json` dans `packages/Button` afin de déclarer un projet à part entière pour notre composant `Button`. Pour cela, allez dans `packages/Button` et lancer `npm init`, validez les questions avec la touche `Entrée`.

 Il va falloir configurer le scripts `build` pour builder notre composant React et optionnellement `eslint` pour analyser notre code.

 Voici à quoi ressemblera notre fichier `package.json `pour le composant `Button`

```json
 {
  "name": "button",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc && vite build",
    "lint": "eslint",
  },
  "author": "",
  "license": "ISC",
  "description": "",
}
```
Pour chaque composant React, il faudra indiquer à Vite comment builder le composant, c'est à dire lui spécifie un point d'entré (`entry`), un nom de composant (`name`), un nom de fichier à générer (`filename`); dans les `rollUptions`, il faudra exclure `react` et `react-dom` comme expliqué dans la partie 1/. Le fichier `vite.config.ts` du composant `Button` ressemblera donc à :

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      name: "Button",
      fileName: "button"
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        }
      }
    }
  }
})
```

### Configuration du projet root
#### Configuration du build avec Vite

Le `vite.config.ts` du projet `root` est tres simple, car on exclut toute la partie `build`. En effet, on ne builde que les sous-projet, pas le projet `root`. Le plugin react est néanoins nécessaire pour démarrer storyBook à la racine, qui permettra d'exposer tous nos composants.

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
});
```

#### Configuration du package.json
Le `package.json `du `root` est grandement simplifié car on n'utilise plus le process de publication NPM et de build, mais Lerna à la place, qui se charge de tout ça. En fait, Lerna appellera la commande voulue dans tous les sous-projets (nos composants React); Ainsi `lerna run build` lancera tous les scripts `build` de chaque sous-projet. Enfin, nous indiquons le script `lerna publish minor`, ce qui va permettre de publier une version mineure de notre lib dans le registre NPM (vous pouvez paramétrer tout cela bien entrendu, je vous laisse vous référez à la documentation Lerna). Lerna va également nous incrémenter la version dans les `package.json` suite à une publication en succès, pensez à faire un `git pull`!.

Voici la section `build` du fichier `package.json` du `root`:

```json
  "scripts": {
    "dev": "vite",
    "build": "lerna run build",
    "publish": "lerna publish minor",
    "lint": "eslint .",
    "preview": "vite preview",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
  ```

#### Mise à jour de storybook

Tous vos fichier stories sont maitenant dans un répertorie `packages`. Or par défaut, Storybook configure le répertoire `src` poru aller chercher les stories, il faut donc modifier cela. Dans le fichier `.storybook/main`, indiquez :

```json
  "stories": [
    "../packages/**/*.mdx",
    "../packages/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
```

Vous pouvez lancer Storybook via `npm run storybook` afin de vérifier que tout est OK, et que voyez bien le composant `Button` dans le menu de gauche.

## Publier dans NPM
- Comme dans la première partie, il faut créer un utilisateur NPM et se connecter via `npm adduser`.
- lancer `npm publish`, ce qui va lancer `lerna publish minor`
- Attention! Si vous recevez une erreur 403, cela peut vouloir dire que le nom de votre package déclaré dans la propiété `name` du `package.json` (celui de `Button`, pas celui du `root` qui est `private` pour rappel, on ne le publie pas) est déjà utilisé! Dans ce cas, changez de nom et prenez un qui n'existe pas, et relancez `npm publish`

Installez la librairie dans votre client via `npm install <votre package>` comme expliqué dans la première partie, vous devriez voir votre composant! De plus, pas besoin de fichier additionnel `.d.ts`, cela fonctionnera directement : les `props` de votre composant React vous seront directement proposées dans votre IDE!

## Conclusion

Et voilà, on a crée une bibilothèque de composants React communs, publié dans un registre NPM. Bien entendu pous pouvez vous référer à mon Github poru avoir tout le code :
- Le projet "bibilothèque" : https://github.com/smaestri/my-lerna-react-components, il est également déployé via une Github action dans Github pages [ici](https://smaestri.github.io/my-lerna-react-components/)
- Les packages NPM sont publiés dans le registre public, visibles sur mon profile, à [cette URL](https://www.npmjs.com/settings/smaestri/packages).`my-shared-react-components` correspond au package global de la première partie, et `my-lerna-button` le package du `Button` publié avec Lerna, de la deuxième partie.
- Le projet "client" : https://github.com/smaestri/client-react-components. Vous pouvez voir dans le fichier `App.tsx` que j'ai importé les deux `Boutons` avec les deux différents packages. Bien entendu, si vous utilisez l'import sans Lerna, il faudra utiliser le fichier additonnel `module.d.ts` pour ne pas avoir d'erreur de type.