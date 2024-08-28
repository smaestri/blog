---
title: 'Intégrer un frontend React à Spring-Boot'
author: sylvain
type: post
date: 2021-03-14T14:51:26+00:00
categories:
  - azure

---
## Introduction

Vous avez développé votre application *Single Page Application* React avec *create-react-app*, et votre backend avec *Spring-Boot*. Excellent! Mais maintenant il faut intégrer tout ça. Ca tombe bien, *Spring-Boot*, via son paradigme _Convention over Configuration_ permet d'intégrer notre appli SPA, quasiment automatiquement! On va voir comment ça fonctionne dans ce POST.

## Transpiler l'appli frontend avec *create-react-app*

Première étape : on va transpiler et minifier l'application frontend qu'on a développé.
Pour info, notre application réside dans le répertoire *src/main/js* (mais au aurait pu choisir autre chose, par exemple *src/main/webapp*).
On suppose que vous avez crée votre application avec *create-react-app*. 
Ce dernier propose la commande *npm run build* qui va générer dans un répertoire *build* toute notre application prête à l'emploi, trasnpilée et minifiée.
Voici un exemple de contenu du répertoire build :

- index.html
- favicon.ico
- manifest.json
- static
  - css : tous CSS minifiés
  - js : tous JS minifiés
  - media : toutes images, fichiers divers


## Automatiser la transpilation via maven

Maven propose un plugin spécifique pour effectuer la transpilation du frontend automatiquement à chaque build, *frontend-maven-plugin*.
Il faut spécifier à ce plugin la version de Node/NPM qu'on souhaite installer, ainsi que les tâches (*goal*) à lancer. On indique donc :
- *install* pour effectuer un *npm install*, et installer les dépendance de notre SPA;
- *run build* pour lancer la transpilation/minification vers le répertoire *build*.
Voici donc ce qu'il faut ajouter dans le *pom.xml*, dans *build/plugins* :

```xml
    <plugin>
        <groupId>com.github.eirslett</groupId>
        <artifactId>frontend-maven-plugin</artifactId>
        <version>${frontend-plugin-plugin.version}</version>
        <configuration>
            <installDirectory>target</installDirectory>
            <workingDirectory>src/main/js</workingDirectory>
        </configuration>
        <executions>
            <execution>
                <id>install node and npm</id>
                <goals>
                    <goal>install-node-and-npm</goal>
                </goals>
                <configuration>
                    <nodeVersion>${node.version}</nodeVersion>
                    <npmVersion>${npm.version}</npmVersion>
                </configuration>
            </execution>
            <execution>
                <id>npm install</id>
                <goals>
                    <goal>npm</goal>
                </goals>
            </execution>
            <execution>
                <id>npm build</id>
                <goals>
                    <goal>npm</goal>
                </goals>
                <phase>prepare-package</phase>
                <configuration>
                    <arguments>run build</arguments>
                </configuration>
            </execution>
        </executions>
    </plugin>
```


## Le répertoire *static* de Spring-Boot

Spring-Boot fourni un répertoire spécifique pour toutes les ressources *frontend* (HTML, JS, CSS, etc.) : *src/main/ressources/static*.
Les fichiers placés dans ce répertoire seront directement copiés dans le JAR final, dans le répertoire *static* également, et exposés.
 Le contenu du JAR sera de la forme :

- application.properties
- fichiers classes compilés
- static

Le but est donc de copier dans ce répertoire *static*, notre appli front transpilée lors de la première étape. Ainsi, elle sera directement exposée via *Spring-Boot* sans aucune configuration particulière!

## Copie des fichiers avec plugin *copy* de Maven

Il faut donc copier l'application SPA transpilée depuis le répertoire *src/main/js/build* vers le répertoire *target/static* de spring-Boot, afin de générer le JAR qui contiendra toutes les ressources *frontend* requises. Pour cela, on utilise le plugion Maven *copy-ressources*:

```xml
	<plugin>
        <artifactId>maven-resources-plugin</artifactId>
        <version>3.0.1</version>
        <executions>
            <execution>
                <id>position-react-build</id>
                <goals>
                    <goal>copy-resources</goal>
                </goals>
                <phase>prepare-package</phase>
                <configuration>
                    <outputDirectory>${project.build.outputDirectory}/static</outputDirectory>
                    <resources>
                        <resource>
                            <directory>${frontend-src-dir}/build</directory>
                            <filtering>false</filtering>
                        </resource>
                    </resources>
                </configuration>
            </execution>
        </executions>
    </plugin>
```

Lancer votre JAR via un *java -jar votre-fichier-jar*, et vous devrez voir votre application React! En plus, fini les problèmes CORS car tout est dans un seul serveur!
Le tout est accessible dans mon github ici  https://github.com/smaestri/sharebook
