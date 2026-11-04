import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MATERIAL } from '../shared/material';
import { BuscarPacienteComponent, Paciente } from '../shared/buscar-paciente.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { NotificacionesService } from '../services/notificaciones.service';
import { Medico, Opcion } from '../models/modelos';
interface Disponibilidad {
  fechas: string[];
  horarios: { fecha: string; hora: string; id_agenda: number }[];
  duracion: number;
}
@Component({
  selector: 'app-nuevo-turno',
  imports: [...MATERIAL, MatStepperModule, BuscarPacienteComponent],
  templateUrl: './nuevo-turno.component.html',
})
export class NuevoTurnoComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private avisos = inject(NotificacionesService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  operador = this.auth.usuario()!.rol === 'operador';
  paciente = signal<Paciente | null>(null);
  especialidades = signal<Opcion[]>([]);
  sedes = signal<Opcion[]>([]);
  medicos = signal<Medico[]>([]);
  coberturas = signal<Opcion[]>([]);
  fechas = signal<string[]>([]);
  horarios = signal<Disponibilidad['horarios']>([]);
  error = signal('');
  cargando = signal(false);
  guardando = signal(false);
  especialidad = 0;
  sede = this.operador ? this.auth.usuario()!.id_sede! : 0;
  medico = 0;
  fecha = '';
  hora = '';
  nota = '';
  private solicitud = 0;
  constructor() {
    void this.iniciar();
  }
  async iniciar() {
    this.cargando.set(true);
    try {
      const [e, s, c] = await Promise.all([
        this.api.get<Opcion[]>('/especialidades'),
        this.api.get<Opcion[]>('/sedes'),
        this.api.get<Opcion[]>('/coberturas/disponibles'),
      ]);
      this.especialidades.set(e);
      this.sedes.set(s);
      this.coberturas.set(c);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }
  nombreEspecialidad() {
    return this.especialidades().find((e) => e.id === this.especialidad)?.descripcion;
  }
  nombreSede() {
    return this.sedes().find((e) => e.id === this.sede)?.nombre;
  }
  nombreMedico() {
    const m = this.medicos().find((m) => m.id === this.medico);
    return m ? m.apellido + ', ' + m.nombre : '';
  }
  cobertura() {
    return this.operador
      ? this.paciente()?.cobertura
      : this.coberturas().find((c) => c.id === this.auth.usuario()?.id_cobertura)?.nombre;
  }
  cambiarEspecialidad() {
    if (!this.operador) this.sede = 0;
    void this.cargarMedicos();
  }
  async cargarMedicos() {
    const n = ++this.solicitud;
    this.medico = 0;
    this.fecha = '';
    this.hora = '';
    this.medicos.set([]);
    this.fechas.set([]);
    this.horarios.set([]);
    if (!this.sede) return;
    this.cargando.set(true);
    try {
      const m = await this.api.get<Medico[]>('/medicos', {
        id_especialidad: this.especialidad,
        id_sede: this.sede,
      });
      if (n === this.solicitud) {
        this.medicos.set(m);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  filtros() {
    return { id_medico: this.medico, id_especialidad: this.especialidad, id_sede: this.sede };
  }
  async cargarFechas() {
    const n = ++this.solicitud;
    this.fecha = '';
    this.hora = '';
    this.fechas.set([]);
    this.horarios.set([]);
    this.cargando.set(true);
    try {
      const d = await this.api.get<Disponibilidad>('/disponibilidad', this.filtros());
      if (n === this.solicitud) {
        this.fechas.set(d.fechas);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  async cargarHorarios() {
    const n = ++this.solicitud;
    this.hora = '';
    this.horarios.set([]);
    this.cargando.set(true);
    try {
      const d = await this.api.get<Disponibilidad>('/disponibilidad', {
        ...this.filtros(),
        fecha: this.fecha,
      });
      if (n === this.solicitud) {
        this.horarios.set(d.horarios);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  async confirmar(pasos: { selectedIndex: number }) {
    if (!this.hora || !this.nota.trim()) return;
    this.guardando.set(true);
    try {
      await this.api.enviar('POST', '/turnos', {
        ...this.filtros(),
        fecha: this.fecha,
        hora: this.hora,
        nota: this.nota.trim(),
        ...(this.operador ? { id_paciente: this.paciente()!.id } : {}),
      });
      await this.avisos.cargar();
      this.snack.open('Turno confirmado correctamente', 'Cerrar', { duration: 5000 });
      await this.router.navigate([this.operador ? '/operador/turnos' : '/paciente/turnos'], {
        queryParams: this.operador ? { fecha: this.fecha } : {},
      });
    } catch (e) {
      const mensaje = (e as Error).message;
      await this.cargarHorarios();
      this.error.set(mensaje);
      pasos.selectedIndex = 4;
    } finally {
      this.guardando.set(false);
    }
  }
}
