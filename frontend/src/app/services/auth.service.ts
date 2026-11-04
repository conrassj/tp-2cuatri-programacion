import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Usuario } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  usuario = signal<Usuario | null>(null);
  private restaurando: Promise<void> | null = null;
  get token() {
    return localStorage.getItem('clinica.token');
  }
  async ingresar(dni: string, password: string) {
    const datos = await this.api.enviar<{ token: string; usuario: Usuario }>(
      'POST',
      '/auth/login',
      { dni, password },
    );
    localStorage.setItem('clinica.token', datos.token);
    this.usuario.set(datos.usuario);
  }
  // Al recargar no confiamos en un rol guardado: pedimos el perfil a la API.
  async restaurar() {
    if (this.usuario() || !this.token) return;
    this.restaurando ??= this.api
      .get<Usuario>('/auth/perfil')
      .then((u) => {
        this.usuario.set(u);
      })
      .finally(() => {
        this.restaurando = null;
      });
    await this.restaurando;
  }
  async actualizar() {
    this.usuario.set(await this.api.get<Usuario>('/auth/perfil'));
  }
  salir(vencida = false) {
    localStorage.removeItem('clinica.token');
    this.usuario.set(null);
    void this.router.navigate([vencida ? '/login' : '/'], {
      queryParams: vencida ? { sesion: 'vencida' } : {},
    });
  }
}
