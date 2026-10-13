import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonSplitPane, IonMenu, IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenuToggle, IonRouterOutlet,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, alertCircleOutline, scanOutline, personOutline, logOutOutline,
} from 'ionicons/icons';
import { SesionService } from './sesion.service';

/** Envuelve únicamente las pantallas internas con el menú lateral. */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, IonSplitPane, IonMenu, IonContent,
    IonList, IonItem, IonLabel, IonIcon, IonMenuToggle, IonRouterOutlet,
  ],
  templateUrl: 'layout.component.html',
  styleUrls: ['layout.component.scss'],
})
export class LayoutComponent {
  sesion = inject(SesionService);

  constructor() {
    addIcons({ homeOutline, alertCircleOutline, scanOutline, personOutline, logOutOutline });
  }
}
