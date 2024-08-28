---
title: 'Brancher Sonar à Jest pour afficher la couverture de code du frontend'
author: sylvain
type: post
date: 2020-12-10T14:51:26+00:00
categories:
  - sonar, jest

---
[Sonar](https://docs.sonarqube.org/latest/) est un outil de test de la qualité de code. Il se base sur un ensemble de règles qui ont une sévérité : _code smell_, _bug_, _vulnerability_, _security hotspot_.
Sonar permet aussi d'afficher les résultats de la couverture de code, c'est à dire le pourcentage de lignes de code qui est testée dans l'application. Il ne se charge cependant pas du calcul à proprement parler.

Par exemple, pour un projet _JAVA_ basé sur _Maven_, c'est en général le plugin Maven _Jacoco_ qui se charge du calcul de la couverture. Il suffit de déclarer ce plug-in et le tour est joué.
Pour l'analyse de code du frontend (basé bien souvent sur le langage _Javascript_, ou _Typescript_), il va falloir effectuer une conversion des rapports de couverture de code depuis [_Jest_](https://jestjs.io/en/) (l'outil de test frontend) vers Sonar. Nous allons voir comment.


## Générer nos rapports de tests _Jest_

### Flag coverage
Pour générer vos rapports de tests d'une application frontend via Jest, il faut ajouter le flag `coverage`. Cela va générer un répertoire coverage contenant tous les rapports de test au format Jest.
La commande pour executer les et les rapports associés est donc :

`npm run test --coverage`

### Flag watchAll
Nous ne voulons pas que nos tests s'executent en mode _watch_ (bien que cette fonctionnalié peut s'avérer intéressante dans d'autres circonstances). Nouus allons donc la désactiver via la cxommande `watchAll=false` :
Notre commande devient donc  :

`npm run test --coverage --watchAll=false`

### Conversion des rapports Jest vers Sonar
Nos rapports sont correctement générés dans le répertoire coverage, il faut donc les transformer en un format compréhensible par Sonar. C'est l'objet de la librairie [jest-sonar-reporter](https://github.com/3dmind/jest-sonar-reporter#readme).
Il suffit d'ajouter le flag `testResultsProcessor`. 

Notre commande devient donc:

 `npm run test --coverage --watchAll=false --testResultsProcessor=jest-sonar-reporter`

Il faut aussi mettre à jour ou mettre à jour la configuration Sonar pour appeler le bon rapport :
`sonar.testExecutionReportPaths=test-report.xml`
(Par défaut le fichier généré par _jest-sonar-reporter_ est _test-report.xml._)

Lancer l'analyse Sonar, et le tour est joué! Vous devriez avoir vos beaux rapports de couverture de code _Jest_ dans _Sonar_!