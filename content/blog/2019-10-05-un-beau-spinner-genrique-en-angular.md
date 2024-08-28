---
title: Un beau spinner générique en Angular
author: sylvain
type: post
date: 2019-10-05T07:58:04+00:00
url: /index.php/2019/10/05/un-beau-spinner-genrique-en-angular/
categories:
  - Frontend
tags:
  - angular
  - frontend
  - spinner

---
Dans une *Single Page Application* (*SPA*), on se repose sur de nombreux appels *REST* pour naviguer au sein de notre application. Ces appels REST peuvent prendre un certain temps, et donc il faut bien informer l'utilisateur que quelque chose se passe pendant l'appel serveur! C'est le rôle du *Spinner*, une barre de progression sans indicateur de fin, qui permet d'indiquer à l'utilisateur de patienter.  
Nous allons voir dans ce POST comment réaliser un spinner en Angular d'une manière totalement générique pour chaque appel REST, et ce même s'il y a des appels en parallèle! C'est beau, c'est du clean code, on adore. Feu!

## Réalisation du composant en Angular

On va tout d'abord réaliser notre composant Spinner en Angular. [Angular Material][1] propose justement un beau spinner pret à l'emploi que nous allons réutiliser. Pour cela, je vous laisse installer Angular Material tel qu'expliqué [ici][2].

Voici le template HTML :

```html
<div *ngIf="visible" class="background-spinner">
  <div class="spinner">
    <mat-progress-spinner class="spinner" mode="indeterminate"></mat-progress-spinner>
    <div>Please wait</div>
  </div>
</div>
```

Le CSS asocié pour bien centré le cercle, et ajouter un fond gris. On utilise la proprété `fixed` de CSS pour cela :

```css
.background-spinner {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
}

.spinner {
    margin-left: auto;
    margin-right: auto;
    width: 150px;
    color: rgba(0, 0, 0, 1);
    text-align: center;
    margin-top: 20%;
}
```

Pour gérer l'affichage ou le masquage du composant, celui-ci aura un seul paramètre d'entrée nommé `visible`:

```javascript
export class SpinnerComponent implements OnInit {

  @Input() visible: Boolean;

  constructor() { }

  ngOnInit() {
  }

}
```

## Mise en place du Service Spinner

Il est possible que plusieurs requêtes soient lancées en parallèle. Or nous devons attendre que l'ensemble des requêtes REST soient finies avant de masquer notre beau spinner. Pour cela, nous devons incrémenter un compteur à chaque début d'appel REST (via un [intercepteur][3] que nous verrons ensuite), et décrémentons le compteur à chaque fin d'appel REST (succès ou échec).

De plus, le service Spinner va exposer un booléan pour indiquer au reste de l'application si le spinner est visible ou non, via les [Subject][4] Angular de la bibliothèque [RxJS][5]. Ici nous utilisons cette librairie très simplement, mais il est possible de faire des choses très puissantes (c'est le mouvement de la [programmation réactive](https://www.reactivemanifesto.org/fr) en plein boom en ce moment. Voici le code associé au `serviceSpinner`:

```javascript
import { Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  countDisplay: number = 0;

  private subject = new Subject<boolean>();
  spinnerObs$ = this.subject.asObservable();

  displaySpinner() {
    this.countDisplay++;
    this.subject.next(true);
  }

  hideSpinner() {
    this.countDisplay--;
    if (this.countDisplay == 0) {
      this.subject.next(false);
    }
  }
}
```

## Mise en place de l'intercepteur Angular

Comme vu brièvement, afin de catcher chaque appel REST on passe par un intercepteur Angular. Celui-ci appellera notre service Spinner afin d'afficher / masquer le spinner. Le code ressemblera à ceci :

```javascript
@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {

    constructor(private spinnerService: SpinnerService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.spinnerService.displaySpinner();

        return next.handle(request).pipe(catchError(this.handleError.bind(this))).pipe(
            map((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    this.spinnerService.hideSpinner();
                }
                return event;
            }));
    }

    private handleError(error: Response | any) {
        this.spinnerService.hideSpinner();
        return throwError(error);
    }
}
```
## Appel du nouveau composant Spinner

Le composant qui va contenir le composant Spinner est le composant root de notre application, _app.component.html :_

```html
<app-spinner [visible]="spinnerVisible"></app-spinner>
```
Le TS associé à ce composant écoutera l'Observable que nous avons défini dans le Spinner Service, afin d'afficher ou non le Spinner.:

```javascript
export class AppComponent {
  title = 'sharebook-frontend';

  spinnerVisible: boolean;

  constructor(private spinnerService: SpinnerService) {
    this.spinnerService.spinnerObs$.subscribe(visible => {
      // prevent ExpressionChangedAfterItHasBeenCheckedError angular error
      setTimeout(() => {
        this.spinnerVisible = visible;
      })
    });
  }
}
```
Ainsi si nous résumons l’enchaînement des actions, on a :

Début Appel REST -> Intercepteur -> Service.display() -> Spinner -> Fin appel REST -> Intercepteur -> Service.hide() -> Spinner masqué

Comme d'habitude, l'ensemble du code peut être retrouvé dans une application fonctionnelle sur [mon Github][6]! A bientôt!

 [1]: https://material.angular.io/
 [2]: https://material.angular.io/guide/getting-started
 [3]: https://angular.io/api/common/http/HttpInterceptor
 [4]: https://blog.angularindepth.com/rxjs-understanding-subjects-5c585188c3e1
 [5]: https://angular.io/guide/rx-library
 [6]: https://github.com/smaestri/sharebook