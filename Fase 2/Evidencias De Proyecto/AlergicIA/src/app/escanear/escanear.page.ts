import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline } from 'ionicons/icons';
import { ShellComponent } from '../core/shell.component';
import { SesionService } from '../core/sesion.service';
import { Analisis, AnalisisService } from '../core/analisis.service';

@Component({
  standalone: true,
  selector: 'app-escanear',
  templateUrl: 'escanear.page.html',
  styleUrls: ['escanear.page.scss'],
  imports: [FormsModule, RouterLink, IonInput, IonButton, IonIcon, IonSpinner, ShellComponent],
})
export class EscanearPage {
  sesion = inject(SesionService);
  private analisis = inject(AnalisisService);

  alimento = '';
  cargando = false;
  error = '';
  resultado: Analisis | null = null;

  etiquetas = { alimento: 'es de ese grupo', ingrediente: 'ingrediente', posible: 'posible' };

  constructor() {
    addIcons({ searchOutline });
  }

  async revisar() {
    const alimento = this.alimento.trim();
    if (!alimento || this.cargando || this.sesion.alergias.length === 0) return;

    this.cargando = true;
    this.error = '';
    this.resultado = null;
    try {
      const r = await this.analisis.analizar(alimento, this.sesion.alergias);
      this.resultado = r;
      this.sesion.registrarRevision({
        alimento: r.alimento,
        fecha: Date.now(),
        peligro: r.coincidencias.length > 0,
        detalle: r.coincidencias.length
          ? 'Contiene ' + r.coincidencias.map((c) => c.alergia.toLowerCase()).join(', ')
          : 'Sin alérgenos detectados',
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo analizar el alimento.';
    } finally {
      this.cargando = false;
    }
  }
}
