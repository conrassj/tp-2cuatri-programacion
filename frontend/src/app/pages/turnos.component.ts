import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { MATERIAL } from '../shared/material';
import { FormularioComponent } from '../shared/formulario.component';
import { ConfirmarComponent } from '../shared/confirmar.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { NotificacionesService } from '../services/notificaciones.service';
import { Turno, Opcion, hoy, edad } from '../models/modelos';
@Component({
  selector: 'app-turnos',
  imports: [...MATERIAL, RouterLink],
  templateUrl: './turnos.component.html',
})
export class TurnosComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  dialog = inject(MatDialog);
  avisos = inject(NotificacionesService);
  route = inject(ActivatedRoute);
  rol = this.auth.usuario()!.rol;
  fecha = this.route.snapshot.queryParamMap.get('fecha') || hoy();
  sede: number | '' = Number(this.route.snapshot.queryParamMap.get('id_sede')) || '';
  idMedico = Number(this.route.snapshot.queryParamMap.get('id_medico'));
  estado = '';
  edad = edad;
  items = signal<Turno[]>([]);
  sedes = signal<Opcion[]>([]);
  error = signal('');
  cargando = signal(true);
  ocupado = signal(false);
  private solicitud = 0;
  seleccionado = 0;
  columnas = ['hora', 'paciente', 'edad', 'sede', 'estado', 'detalle'];
  detalles() {
    return this.rol === 'paciente'
      ? this.filtrados()
      : this.filtrados().filter((t) => t.id === this.seleccionado);
  }
  constructor() {
    void this.iniciar();
  }
  async iniciar() {
    if (this.rol === 'medico')
      try {
        this.sedes.set(await this.api.get<Opcion[]>('/sedes'));
      } catch (e) {
        this.error.set((e as Error).message);
      }
    await this.cargar();
  }
  filtrados() {
    return this.items().filter(
      (t) =>
        (!this.sede || t.id_sede === this.sede) &&
        (!this.idMedico || t.id_medico === this.idMedico) &&
        (!this.estado || t.estado === this.estado),
    );
  }
  async cargar() {
    const n = ++this.solicitud;
    this.cargando.set(true);
    try {
      const t = await this.api.get<Turno[]>(
        '/turnos/' + (this.rol === 'paciente' ? 'mios' : this.rol === 'medico' ? 'medico' : 'sede'),
        this.rol === 'paciente' ? {} : { fecha: this.fecha },
      );
      if (n === this.solicitud) {
        this.items.set(t);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  async cancelar(t: Turno) {
    if (
      !(await firstValueFrom(
        this.dialog
          .open(ConfirmarComponent, {
            data: `¿Está seguro de cancelar el turno del ${t.fecha.split('-').reverse().join('/')} a las ${t.hora}?`,
          })
          .afterClosed(),
      ))
    )
      return;
    this.ocupado.set(true);
    try {
      await this.api.enviar('PATCH', `/turnos/${t.id}/cancelar`);
      await Promise.all([this.cargar(), this.avisos.cargar()]);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
  atender(t: Turno, soloHistorial = false) {
    this.dialog.open(FormularioComponent, {
      width: '640px',
      data: {
        titulo: 'Atención de ' + t.paciente,
        campos: [
          {
            clave: 'diagnostico',
            etiqueta: 'Diagnóstico',
            tipo: 'textarea',
            requerido: true,
            max: 255,
          },
          { clave: 'tratamiento', etiqueta: 'Tratamiento', tipo: 'textarea', max: 255 },
          { clave: 'observaciones', etiqueta: 'Observaciones', tipo: 'textarea', max: 255 },
        ],
        guardar: async (d: unknown) => {
          await this.api.enviar(
            soloHistorial ? 'POST' : 'PATCH',
            soloHistorial ? '/historial/' + t.id : `/turnos/${t.id}/atender`,
            d,
          );
          await Promise.all([this.cargar(), this.avisos.cargar()]);
        },
      },
    });
  }
}
