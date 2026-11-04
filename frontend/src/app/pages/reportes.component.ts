import { Component, inject, signal } from '@angular/core';
import { MATERIAL } from '../shared/material';
import { GraficoComponent } from '../shared/grafico.component';
import { ApiService } from '../services/api.service';
interface Conteo {
  id: number;
  nombre: string;
  cantidad: number;
}
@Component({
  selector: 'app-reportes',
  imports: [...MATERIAL, GraficoComponent],
  templateUrl: './reportes.component.html',
})
export class ReportesComponent {
  api = inject(ApiService);
  desde = '';
  hasta = '';
  error = signal('');
  cargando = signal(true);
  especialidades = signal<Conteo[]>([]);
  sedes = signal<Conteo[]>([]);
  ranking = signal<{ id_medico: number; medico: string; atendidos: number }[]>([]);
  tasa = signal({ total: 0, cancelados: 0, tasa: 0 });
  private solicitud = 0;
  constructor() {
    void this.cargar();
  }
  nombres(a: Conteo[]) {
    return a.map((x) => x.nombre);
  }
  cantidades(a: Conteo[]) {
    return a.map((x) => Number(x.cantidad));
  }
  async cargar() {
    if (this.desde && this.hasta && this.desde > this.hasta) {
      this.error.set('La fecha desde no puede ser posterior a hasta.');
      return;
    }
    const n = ++this.solicitud;
    this.cargando.set(true);
    try {
      const q = { desde: this.desde, hasta: this.hasta };
      const [e, s, r, t] = await Promise.all([
        this.api.get<Conteo[]>('/reportes/turnos-por-especialidad', q),
        this.api.get<Conteo[]>('/reportes/turnos-por-sede', q),
        this.api.get<{ id_medico: number; medico: string; atendidos: number }[]>(
          '/reportes/ranking-medicos',
          q,
        ),
        this.api.get<{ total: number; cancelados: number; tasa: number }>(
          '/reportes/tasa-cancelacion',
          q,
        ),
      ]);
      if (n === this.solicitud) {
        this.especialidades.set(e);
        this.sedes.set(s);
        this.ranking.set(r);
        this.tasa.set(t);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
}
