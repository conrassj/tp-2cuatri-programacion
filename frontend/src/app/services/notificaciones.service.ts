import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Notificacion } from '../models/modelos';
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private api = inject(ApiService);
  items = signal<Notificacion[]>([]);
  error = signal('');
  pendientes = computed(() => this.items().filter((n) => !n.leida).length);
  async cargar() {
    try {
      this.items.set(await this.api.get<Notificacion[]>('/notificaciones'));
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  async leer(id: number) {
    await this.api.enviar('PATCH', `/notificaciones/${id}/leida`);
    this.items.update((ns) => ns.map((n) => (n.id === id ? { ...n, leida: 1 } : n)));
  }
}
