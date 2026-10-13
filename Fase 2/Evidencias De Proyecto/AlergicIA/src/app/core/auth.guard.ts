import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

/** Solo deja entrar a las pantallas internas si hay una sesión iniciada. */
export const authGuard: CanActivateFn = () =>
  inject(SesionService).usuario() ? true : inject(Router).createUrlTree(['/login']);
