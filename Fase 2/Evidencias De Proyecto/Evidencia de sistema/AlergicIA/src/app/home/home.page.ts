import { Component, inject } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { ShellComponent } from '../core/shell.component';
import { SesionService } from '../core/sesion.service';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [RouterLink, IonButton, ShellComponent],
})
export class HomePage {
  sesion = inject(SesionService);

  get recientes() { return this.sesion.historial.slice(0, 5); }
}
