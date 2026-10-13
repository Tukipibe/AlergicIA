import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { SesionService } from '../core/sesion.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [FormsModule, IonContent, IonInput, IonButton],
})
export class LoginPage {
  private sesion = inject(SesionService);
  private router = inject(Router);

  modoRegistro = false;
  nombre = '';
  email = '';
  clave = '';
  error = '';
  cargando = false;

  cambiarModo() {
    this.modoRegistro = !this.modoRegistro;
    this.error = '';
  }

  async enviar() {
    this.error = '';
    this.cargando = true;
    try {
      if (this.modoRegistro) await this.sesion.registrar(this.nombre, this.email, this.clave);
      else await this.sesion.entrar(this.email, this.clave);
      this.clave = '';
      await this.router.navigateByUrl('/home');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo continuar.';
    } finally {
      this.cargando = false;
    }
  }
}
