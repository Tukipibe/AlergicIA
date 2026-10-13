import { Injectable, signal } from '@angular/core';

export type Nivel = 'Leve' | 'Moderada' | 'Grave';
export interface Alergia { nombre: string; nivel: Nivel; }
export interface Revision { alimento: string; fecha: number; peligro: boolean; detalle: string; }

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  clave: string; // hash SHA-256, nunca la contraseña en claro
  alergias: Alergia[];
  historial: Revision[]; // la más reciente primero
}

const K_USUARIOS = 'alergicia.usuarios';
const K_SESION = 'alergicia.sesion';

/** Quita tildes y mayúsculas para comparar textos ("Maní" == "mani"). */
export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

async function hashClave(email: string, clave: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Este navegador no permite crear cuentas aquí (se necesita localhost o https).');
  const buf = await subtle.digest('SHA-256', new TextEncoder().encode(`${email}:${clave}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cuentas y perfiles guardados en el navegador (localStorage).
 * Es un almacenamiento provisional
 * basta con reemplazar los métodos de este servicio.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly _usuario = signal<Usuario | null>(this.cargarSesion());
  readonly usuario = this._usuario.asReadonly();

  get alergias(): Alergia[] { return this._usuario()?.alergias ?? []; }
  get historial(): Revision[] { return this._usuario()?.historial ?? []; }

  async registrar(nombre: string, email: string, clave: string): Promise<void> {
    nombre = nombre.trim();
    email = email.trim().toLowerCase();
    if (!nombre) throw new Error('Escribe tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('El correo no es válido.');
    if (clave.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

    const usuarios = this.leerUsuarios();
    if (usuarios.some((u) => u.email === email)) throw new Error('Ya existe una cuenta con ese correo.');

    const usuario: Usuario = {
      id: crypto.randomUUID(), nombre, email,
      clave: await hashClave(email, clave), alergias: [], historial: [],
    };
    this.guardarUsuarios([...usuarios, usuario]);
    this.iniciar(usuario);
  }

  async entrar(email: string, clave: string): Promise<void> {
    email = email.trim().toLowerCase();
    const usuario = this.leerUsuarios().find((u) => u.email === email);
    if (!usuario || usuario.clave !== (await hashClave(email, clave))) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    this.iniciar(usuario);
  }

  salir(): void {
    localStorage.removeItem(K_SESION);
    this._usuario.set(null);
  }

  /** Devuelve false si esa alergia ya estaba registrada. */
  agregarAlergia(nombre: string, nivel: Nivel): boolean {
    nombre = nombre.trim();
    if (!nombre) return false;
    if (this.alergias.some((a) => normalizar(a.nombre) === normalizar(nombre))) return false;
    this.actualizar((u) => ({ ...u, alergias: [...u.alergias, { nombre, nivel }] }));
    return true;
  }

  quitarAlergia(nombre: string): void {
    this.actualizar((u) => ({ ...u, alergias: u.alergias.filter((a) => a.nombre !== nombre) }));
  }

  registrarRevision(revision: Revision): void {
    this.actualizar((u) => ({ ...u, historial: [revision, ...u.historial] }));
  }

  // ---- almacenamiento ----
  private iniciar(usuario: Usuario) {
    localStorage.setItem(K_SESION, usuario.id);
    this._usuario.set(usuario);
  }

  private actualizar(cambio: (u: Usuario) => Usuario) {
    const actual = this._usuario();
    if (!actual) return;
    const nuevo = cambio(actual);
    this.guardarUsuarios(this.leerUsuarios().map((u) => (u.id === nuevo.id ? nuevo : u)));
    this._usuario.set(nuevo);
  }

  private cargarSesion(): Usuario | null {
    const id = localStorage.getItem(K_SESION);
    return this.leerUsuarios().find((u) => u.id === id) ?? null;
  }

  private leerUsuarios(): Usuario[] {
    try { return JSON.parse(localStorage.getItem(K_USUARIOS) ?? '[]'); } catch { return []; }
  }

  private guardarUsuarios(usuarios: Usuario[]) {
    localStorage.setItem(K_USUARIOS, JSON.stringify(usuarios));
  }
}
