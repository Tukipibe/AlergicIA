import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, createOutline, logOutOutline } from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { ShellComponent } from '../core/shell.component';
import { SesionService } from '../core/sesion.service';

@Component({
  standalone: true,
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  imports: [RouterLink, IonButton, IonIcon, ShellComponent],
})
export class PerfilPage {
  sesion = inject(SesionService);

  constructor() {
    addIcons({ personCircleOutline, createOutline, logOutOutline });
  }
}
