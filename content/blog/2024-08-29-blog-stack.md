---
title: 'La stack technique du blog'
author: sylvain
type: post
date: 2024-08-29T14:51:26+00:00
categories:
  - blog

---
## Introduction

Nous allons découvrir dans ce POST la stack technique utilisée pour publier mes posts sur le blog que vous êtes en train de visiter. Pour résumer:
- Framework: Gatsby
- Hosting: GitHub Pages / Github Actions
- Gestion de comentaires: Disqus
- Monitoring: Google Analytics

## Framework: Gatsby 

Voici les critères sur lesquels je me suis basé pour sélectionner ce framework :
- Un site "statique", génére par un SSG (consultez [ce très bon article](https://www.robinwieruch.de/web-applications/) qui explique l'historique de développement WEB, et les termes *SPA - Single Page Application*, *SSR - Server Side Rendering*, ou *SSG - Static Site Generator*), afin d'avoir un site rapide, et facile à deployer (par exemple dans *github pages* ou *gitlab pages*)
- Ayant de l'expérience avec REACT, j'ai voulu utiliser ce framework afin d'êtrer rapidement opérationnel
- Je souhaite que le framework soit performant pour afficher les pages très rapidement (avec un SSG justement, c'est normalement le cas :));
- Pouvoir écrire mes posts en markdown (syntaxe très répandue) : il faut donc un mécanisme qui transforme le markdown en HTML;
- Enfin un bon éco système de plugins, et une bonne documentation, car je souhaite ajouter des plugins dans le futur (Analyse de l'utilisation, Système commentaires, etc.)
- Le framework doit aussi proposer un joli template de blog

Un framework en particulier s'est dégagé et remplit tous ces critères (bien que d'autres auraient été possibles, j'en conviens) : Gatsby JS ! [Le template proposé](https://www.gatsbyjs.com/starters/gatsbyjs/gatsby-starter-blog) et prêt à l'emploi, me plait tout particulièrement: sobre, efficace. De plus il inclut tous les plugins nécessaires pour la gestion du markdown, référencés [ici](https://www.gatsbyjs.com/docs/how-to/routing/adding-markdown-pages/).

 En plus Gatsby utilise graphQL et je voulais monter en compétences sur cette techno!

## Hosting : GitHub Pages / Github Actions

### Github pages

Je souhaite un système de hosting simple, gratuit, et ci-possible qui fonctionne la plupart du temps! De plus, je souhaite publier ce site sur un nom de domaine spécifique, *effectivecoding.fr*.

Pour cela, je trouve que *Github pages* est parfait. De plus il est très largement utilisé, et on ne présente plus Github qui est le site de gestion de code le plus utilisé.

Pour configurer un nom de domaine spécifique c'est très bien documenté [ici](https://docs.github.com/fr/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) par exemple, et en francais. Il faudra vous connecter chez votre hébergeur chez qui vous avez souscrit votre nom de domaine, afin de configurer la redirection *votre nom de domaine* -> *Github pages*. Perso, je suis chez OVH, et la configuration se fait très simplement depuis le menu DNS (ajouter des enregistrements *A* et *CNAME* pour activer *www*, cf. documentation ci-dessus)

### Github Actions

Pour publier le contenu du blog dans les *Github pages* il faut d'abord le "builder" via la commande *gatsby build*. Gatsby génera dans un répertoire *public* un fichier *index.html*, ainsi que tous les fichiers du blog (CSS, JS, Images etc.), et ce de manière minifiée.  
C'est ce répertoire *public* qui doit être publiée, et non pas la racine de votre repository, qui contient les sources.
Il faut donc recourir au *GitHub Actions*.

Au moment d'activer les *Github pages* (dans les *settings* de votre repository), il faut donc indiquer dans me menu *Build And Deployment* l'option *Github action*. Il faudra utiliser un workflow spécifique (c'est à dire le code de la l'*Action*), proposé par Github nommé *Deploy Gatsby to Pages* , et que je vous mets ci-dessous. 

Un fichier *gatsby.yml* sera crée par github dans le répertoire des actions (*.github/workflow*) : un simple *git pull* vous permettra de le récupérer.

Je n'ai absolument pas eu besoin de le modifier, il fonctionne parfaitement! Mais il faudra peut-être creuser pour faire des choses spécifiques.

> *Warning*  
> Le résultat de la commande *gatsby build* par les github Actions sera publié dans une branche *master*. C'est celle ci-qui sera publiée et appelée par vos utilisateurs. A ne pas confondre avec la branche *main*, le code source de votre blog non transpilé / minifié par Gatsby.

Ainsi, à chaque push sur *main*, la *github action* se lance, et la branche *master* est mise à jour! Le site est mis à jour directement.
```yaml
# Sample workflow for building and deploying a Gatsby site to GitHub Pages
#
# To get started with Gatsby see: https://www.gatsbyjs.com/docs/quick-start/
#
name: Deploy Gatsby site to Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ["main"]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

# Default to bash
defaults:
  run:
    shell: bash

jobs:
  # Build job
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Detect package manager
        id: detect-package-manager
        run: |
          if [ -f "${{ github.workspace }}/yarn.lock" ]; then
            echo "manager=yarn" >> $GITHUB_OUTPUT
            echo "command=install" >> $GITHUB_OUTPUT
            exit 0
          elif [ -f "${{ github.workspace }}/package.json" ]; then
            echo "manager=npm" >> $GITHUB_OUTPUT
            echo "command=ci" >> $GITHUB_OUTPUT
            exit 0
          else
            echo "Unable to determine package manager"
            exit 1
          fi
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: ${{ steps.detect-package-manager.outputs.manager }}
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
        with:
          # Automatically inject pathPrefix in your Gatsby configuration file.
          #
          # You may remove this line if you want to manage the configuration yourself.
          static_site_generator: gatsby
      - name: Restore cache
        uses: actions/cache@v4
        with:
          path: |
            public
            .cache
          key: ${{ runner.os }}-gatsby-build-${{ hashFiles('public') }}
          restore-keys: |
            ${{ runner.os }}-gatsby-build-
      - name: Install dependencies
        run: ${{ steps.detect-package-manager.outputs.manager }} ${{ steps.detect-package-manager.outputs.command }}
      - name: Build with Gatsby
        env:
          PREFIX_PATHS: 'true'
        run: ${{ steps.detect-package-manager.outputs.manager }} run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  # Deployment job
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Gestion de commentaires

Afin d'avoir un blog plus intércatif, je souhaite que chacun puisse écrire des commentaires sur chaque post, ce système étant idéalement gratuit.
Ici, le choix est plus simple car il n'y a pas tant de systèmes simples, avec possibilité de validation de messages (modération), et facilement intégré avec Gatsby : j'ai retenu [Disqus](https://disqus.com/). 
[Un plugin Gatsby](https://www.gatsbyjs.com/plugins/gatsby-plugin-disqus/) est disponible, et c'est donc très facile d'intégrer Disqus à un blog.

## Monitoring

Je souhaite également monitorer mon blog, savoir qui visite, quand, d'où, etc. Ici, j'ai opté pour le très connu Google Analytics. Comme pour la gestion de commentaires,  un plugin Gastby existe [ici](https://www.gatsbyjs.com/plugins/gatsby-plugin-google-gtag/), et facilite grandement la mise en place : il suffit d'indiquer le *trackingID* de votre compte Google Analytics! A noter que pour obtenir au cas où vous l'avez oublié, il faut aller dans le menu "Flux de données" de Google Analytics.


Voilà, c'est tout pour ce POST, n'hésitez pas à me laisser vos remarques grâce à Disqus, ci-dessous :) D'ici là portez-vous bien et à la prochaine!