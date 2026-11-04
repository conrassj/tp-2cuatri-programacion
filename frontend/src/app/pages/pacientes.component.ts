import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../shared/material';
import { BuscarPacienteComponent, Paciente } from '../shared/buscar-paciente.component';
import { FormularioComponent, Campo } from '../shared/formulario.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Opcion, hoy } from '../models/modelos';
export function camposPaciente(): Campo[] {
  return [
    { clave: 'nombre', etiqueta: 'Nombre', requerido: true, max: 30 },
    { clave: 'apellido', etiqueta: 'Apellido', requerido: true, max: 30 },
    { clave: 'dni', etiqueta: 'DNI', requerido: true, max: 8, patron: '^[0-9]{7,8}$' },
    { clave: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, max: 30 },
    { clave: 'telefono', etiqueta: 'Teléfono', requerido: true, max: 10, patron: '^[0-9]{1,10}$' },
    { clave: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', requerido: true },
    { clave: 'password', etiqueta: 'Contraseña', tipo: 'password', requerido: true, max: 72 },
  ];
}
@Component({
  selector: 'app-pacientes',
  imports: [...MATERIAL, BuscarPacienteComponent],
  templateUrl: './pacientes.component.html',
})
export class PacientesComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);
  medico = this.auth.usuario()!.rol === 'medico';
  paciente = signal<Paciente | null>(null);
  historial = signal<any[]>([]);
  error = signal('');
  cargando = signal(false);
  private solicitud = 0;
  async seleccionar(p: Paciente) {
    const n = ++this.solicitud;
    this.paciente.set(p);
    this.historial.set([]);
    this.error.set('');
    if (!this.medico) return;
    this.cargando.set(true);
    try {
      const h = await this.api.get<any[]>('/historial/paciente/' + p.id);
      if (n === this.solicitud) this.historial.set(h);
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  async registrar() {
    try {
      const c = await this.api.get<Opcion[]>('/coberturas/disponibles');
      const campos = [
        ...camposPaciente(),
        {
          clave: 'repetir',
          etiqueta: 'Repetir contraseña',
          tipo: 'password',
          requerido: true,
          max: 72,
        },
        {
          clave: 'id_cobertura',
          etiqueta: 'Cobertura',
          requerido: true,
          opciones: c.map((x) => ({ id: x.id, nombre: x.nombre! })),
        },
      ];
      this.dialog.open(FormularioComponent, {
        width: '700px',
        data: {
          titulo: 'Registrar paciente',
          campos,
          validar: (d: Record<string, any>) =>
            d['password'] !== d['repetir']
              ? 'Las contraseñas no coinciden.'
              : d['password'].length < 6
                ? 'La contraseña debe tener al menos 6 caracteres.'
                : d['fecha_nacimiento'] > hoy()
                  ? 'La fecha de nacimiento no puede ser futura.'
                  : '',
          guardar: async (d: Record<string, any>) => {
            const { repetir, ...datos } = d;
            await this.api.enviar('POST', '/pacientes', datos);
            this.snack.open('Paciente registrado. Ya podés buscarlo por DNI.', 'Cerrar', {
              duration: 5000,
            });
          },
        },
      });
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
