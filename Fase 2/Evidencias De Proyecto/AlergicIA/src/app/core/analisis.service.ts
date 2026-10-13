import { Injectable } from '@angular/core';
import { Alergia } from './sesion.service';

export interface Coincidencia {
  alergia: string;
  tipo: 'alimento' | 'ingrediente' | 'posible';
  motivo: string;
}

export interface Analisis {
  alimento: string;
  ingredientes: string[];
  coincidencias: Coincidencia[];
  resumen: string;
}

/** Pregunta al servidor (server/server.js), que consulta a la IA, si un alimento es seguro para este usuario. */
@Injectable({ providedIn: 'root' })
export class AnalisisService {
  async analizar(alimento: string, alergias: Alergia[]): Promise<Analisis> {
    let respuesta: Response;
    try {
      respuesta = await fetch('/api/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alimento, alergias }),
      });
    } catch {
      throw new Error('No se pudo conectar con el servidor de análisis. ¿Está corriendo "npm run api"?');
    }
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) throw new Error(datos?.error ?? 'El análisis falló. Inténtalo de nuevo.');
    return datos as Analisis;
  }
}
