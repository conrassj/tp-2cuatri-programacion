import { Component, inject, signal } from '@angular/core';
import { MATERIAL } from '../shared/material';
import { ApiService } from '../services/api.service';
@Component({
  selector: 'app-auditoria',
  imports: [...MATERIAL],
  templateUrl: './auditoria.component.html',
})
export class AuditoriaComponent {
  api = inject(ApiService);
  items = signal<any[]>([]);
  error = signal('');
  cargando = signal(true);
  usuario = '';
  entidad = '';
  desde = '';
  hasta = '';
  pagina = 0;
  columnas = ['fecha', 'usuario', 'accion', 'entidad', 'detalle'];
  entidades = ['usuario', 'sede', 'especialidad', 'cobertura', 'agenda', 'turno'];
  private solicitud = 0;
  constructor() {
    void this.cargar();
  }
  paginaActual() {
    return this.items().slice(this.pagina * 10, this.pagina * 10 + 10);
  }
  async cargar() {
    if (this.desde && this.hasta && this.desde > this.hasta) {
      this.error.set('La fecha desde no puede ser posterior a hasta.');
      return;
    }
    const n = ++this.solicitud;
    this.cargando.set(true);
    try {
      const d = await this.api.get<any[]>('/auditoria', {
        id_usuario: this.usuario,
        entidad: this.entidad,
        desde: this.desde,
        hasta: this.hasta,
      });
      if (n === this.solicitud) {
        this.items.set(d);
        this.pagina = 0;
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
}
