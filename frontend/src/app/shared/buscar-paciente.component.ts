import { Component, inject, output, signal } from '@angular/core';
import { MATERIAL } from './material';
import { ApiService } from '../services/api.service';
export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  id_cobertura: number;
  cobertura: string;
  fecha_nacimiento: string;
}
@Component({
  selector: 'app-buscar-paciente',
  imports: [...MATERIAL],
  templateUrl: './buscar-paciente.component.html',
})
export class BuscarPacienteComponent {
  private api = inject(ApiService);
  elegido = output<Paciente>();
  q = '';
  items = signal<Paciente[]>([]);
  error = signal('');
  cargando = signal(false);
  buscado = signal(false);
  async buscar() {
    if (this.q.trim().length < 2) return;
    this.cargando.set(true);
    this.buscado.set(true);
    try {
      this.items.set(await this.api.get<Paciente[]>('/pacientes', { q: this.q.trim() }));
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }
}
