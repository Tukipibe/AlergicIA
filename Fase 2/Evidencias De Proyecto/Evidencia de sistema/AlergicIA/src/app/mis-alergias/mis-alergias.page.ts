import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonInput, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import { ShellComponent } from '../core/shell.component';
import { Nivel, SesionService, normalizar } from '../core/sesion.service';

const COMUNES = ['Maní', 'Leche', 'Huevo', 'Gluten', 'Mariscos', 'Pescado', 'Soya', 'Frutos secos', 'Sésamo'];

@Component({
  standalone: true,
  selector: 'app-mis-alergias',
  templateUrl: 'mis-alergias.page.html',
  styleUrls: ['mis-alergias.page.scss'],
  imports: [FormsModule, IonButton, IonIcon, IonInput, IonSegment, IonSegmentButton, IonLabel, ShellComponent],
})
export class MisAlergiasPage {
  sesion = inject(SesionService);

  nombre = '';
  nivel: Nivel = 'Moderada';
  niveles: Nivel[] = ['Leve', 'Moderada', 'Grave'];
  mensaje = '';

  constructor() {
    addIcons({ addOutline, closeOutline });
  }

  /** Sugerencias que el usuario aún no tiene registradas. */
  get sugeridas(): string[] {
    const tiene = this.sesion.alergias.map((a) => normalizar(a.nombre));
    return COMUNES.filter((c) => !tiene.includes(normalizar(c)));
  }

  agregar(nombre = this.nombre) {
    this.mensaje = '';
    if (!nombre.trim()) return;
    if (this.sesion.agregarAlergia(nombre, this.nivel)) this.nombre = '';
    else this.mensaje = 'Esa alergia ya está en tu lista.';
  }

  quitar(nombre: string) {
    this.sesion.quitarAlergia(nombre);
  }
}
