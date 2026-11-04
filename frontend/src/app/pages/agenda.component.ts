import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { MATERIAL } from '../shared/material';
import { FormularioComponent, Campo } from '../shared/formulario.component';
import { ConfirmarComponent } from '../shared/confirmar.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Agenda, Medico, Opcion, hoy } from '../models/modelos';
@Component({
  selector: 'app-agenda',
  imports: [...MATERIAL],
  templateUrl: './agenda.component.html',
})
export class AgendaComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  dialog = inject(MatDialog);
  router = inject(Router);
  medico = this.auth.usuario()?.rol === 'medico';
  fecha = hoy();
  sede: number | '' = this.medico ? '' : this.auth.usuario()!.id_sede!;
  items = signal<Agenda[]>([]);
  sedes = signal<Opcion[]>([]);
  medicos = signal<Medico[]>([]);
  error = signal('');
  cargando = signal(true);
  columnas = ['medico', 'especialidad', 'horario', 'acciones'];
  private solicitud = 0;
  constructor() {
    void this.iniciar();
  }
  async iniciar() {
    try {
      const [s, m] = await Promise.all([
        this.api.get<Opcion[]>('/sedes'),
        this.api.get<Medico[]>('/medicos'),
      ]);
      this.sedes.set(s);
      this.medicos.set(m);
      await this.cargar();
    } catch (e) {
      this.error.set((e as Error).message);
      this.cargando.set(false);
    }
  }
  puedeEditar(a?: Agenda) {
    return this.medico || (a ? a.id_sede : this.sede) === this.auth.usuario()?.id_sede;
  }
  async cargar() {
    const n = ++this.solicitud;
    this.cargando.set(true);
    try {
      const a = await this.api.get<Agenda[]>('/agendas', { fecha: this.fecha, id_sede: this.sede });
      if (n === this.solicitud) {
        this.items.set(a);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  elegirMedico() {
    if (this.medico) {
      this.editar(this.auth.usuario()!.id);
      return;
    }
    this.dialog.open(FormularioComponent, {
      width: '460px',
      data: {
        titulo: 'Elegir médico',
        campos: [
          {
            clave: 'medico',
            etiqueta: 'Médico',
            requerido: true,
            opciones: this.medicos().map((m) => ({
              id: m.id,
              nombre: m.apellido + ', ' + m.nombre,
            })),
          },
        ],
        guardar: async (d: Record<string, any>) => {
          setTimeout(() => this.editar(d['medico']), 0);
        },
      },
    });
  }
  editar(id: number, a?: Agenda) {
    const m = this.medicos().find((x) => x.id === id);
    if (!m) return;
    const campos: Campo[] = [
      {
        clave: 'fecha',
        etiqueta: 'Fecha',
        tipo: 'date',
        requerido: true,
        valor: a?.fecha || this.fecha,
      },
      {
        clave: 'id_especialidad',
        etiqueta: 'Especialidad',
        requerido: true,
        valor: a?.id_especialidad,
        opciones: m.especialidades.map((e) => ({ id: e.id, nombre: e.descripcion! })),
      },
      {
        clave: 'hora_entrada',
        etiqueta: 'Hora de entrada',
        tipo: 'time',
        requerido: true,
        valor: a?.hora_entrada || '08:00',
      },
      {
        clave: 'hora_salida',
        etiqueta: 'Hora de salida',
        tipo: 'time',
        requerido: true,
        valor: a?.hora_salida || '12:00',
      },
    ];
    if (this.medico)
      campos.push({
        clave: 'id_sede',
        etiqueta: 'Sede',
        requerido: true,
        valor: a?.id_sede || this.auth.usuario()?.id_sede,
        opciones: this.sedes().map((s) => ({ id: s.id, nombre: s.nombre! })),
      });
    this.dialog.open(FormularioComponent, {
      width: '650px',
      data: {
        titulo: `${a ? 'Editar' : 'Nueva'} agenda · ${m.apellido}`,
        campos,
        validar: (d: Record<string, any>) =>
          d['hora_salida'] <= d['hora_entrada'] ? 'La salida debe ser posterior a la entrada.' : '',
        guardar: async (d: Record<string, any>) => {
          await this.api.enviar(a ? 'PUT' : 'POST', '/agendas' + (a ? '/' + a.id : ''), {
            ...d,
            id_medico: id,
            id_sede: this.medico ? d['id_sede'] : this.auth.usuario()!.id_sede,
          });
          await this.cargar();
        },
      },
    });
  }
  async eliminar(a: Agenda) {
    if (
      !(await firstValueFrom(
        this.dialog
          .open(ConfirmarComponent, {
            data: `¿Está seguro de eliminar el horario de ${a.medico}, de ${a.hora_entrada} a ${a.hora_salida}?`,
          })
          .afterClosed(),
      ))
    )
      return;
    try {
      await this.api.enviar('DELETE', '/agendas/' + a.id);
      await this.cargar();
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  verTurnos(a: Agenda) {
    void this.router.navigate([`/${this.auth.usuario()!.rol}/turnos`], {
      queryParams: { fecha: this.fecha, id_medico: a.id_medico, id_sede: a.id_sede },
    });
  }
}
