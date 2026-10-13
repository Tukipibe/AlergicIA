import { Component, Input } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
} from '@ionic/angular/standalone';

/** Cabecera + contenido reutilizados por cada pantalla interna. El menú y el split-pane viven en app.component. */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent],
  template: `
    <div class="ion-page">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="contenido">
        <ng-content></ng-content>
      </main>
    </ion-content>
    </div>
  `,
  styleUrls: ['shell.component.scss'],
})
export class ShellComponent {
  @Input() titulo = '';
}
