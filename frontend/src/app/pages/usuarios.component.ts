import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MATERIAL } from '../shared/material';
import { FormularioComponent, Campo } from '../shared/formulario.component';
import { camposPaciente } from './pacientes.component';
import { ApiService } from '../services/api.service';
import { Usuario, Opcion, Pagina, nombresRol, hoy } from '../models/modelos';
@Component({
  selector: 'app-usuarios',
  imports: [...MATERIAL],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  api = inject(ApiService);
  dialog = inject(MatDialog);
  items = signal<Usuario[]>([]);
  total = signal(0);
  sedes = signal<Opcion[]>([]);
  especialidades = signal<Opcion[]>([]);
  coberturas = signal<Opcion[]>([]);
  error = signal('');
  cargando = signal(true);
  roles = nombresRol;
  tipos = ['admin', 'medico', 'operador', 'paciente'] as const;
  columnas = ['nombre', 'dni', 'rol', 'sede', 'acciones'];
  nombre = '';
  apellido = '';
  rol = '';
  sede: number | '' = '';
  pagina = 0;
  private solicitud = 0;
  constructor() {
    void this.iniciar();
  }
  nombreRol(r: keyof typeof nombresRol) {
    return this.roles[r];
  }
  nombreSede(id: number) {
    return this.sedes().find((s) => s.id === id)?.nombre || '—';
  }
  async iniciar() {
    try {
      const [s, e, c] = await Promise.all([
        this.api.get<Opcion[]>('/sedes'),
        this.api.get<Opcion[]>('/especialidades'),
        this.api.get<Opcion[]>('/coberturas/disponibles'),
      ]);
      this.sedes.set(s);
      this.especialidades.set(e);
      this.coberturas.set(c);
      await this.cargar();
    } catch (e) {
      this.error.set((e as Error).message);
      this.cargando.set(false);
    }
  }
  async cargar() {
    const n = ++this.solicitud;
    this.cargando.set(true);
    try {
      const d = await this.api.get<Pagina<Usuario>>('/usuarios', {
        nombre: this.nombre,
        apellido: this.apellido,
        rol: this.rol,
        id_sede: this.sede,
        pagina: this.pagina + 1,
      });
      if (n === this.solicitud) {
        this.items.set(d.items);
        this.total.set(d.total);
        this.error.set('');
      }
    } catch (e) {
      if (n === this.solicitud) this.error.set((e as Error).message);
    } finally {
      if (n === this.solicitud) this.cargando.set(false);
    }
  }
  elegirRol() {
    this.dialog.open(FormularioComponent, {
      width: '460px',
      data: {
        titulo: 'Tipo de usuario',
        campos: [
          {
            clave: 'rol',
            etiqueta: 'Tipo',
            requerido: true,
            opciones: ['operador', 'medico', 'admin'].map((r) => ({
              id: r,
              nombre: this.nombreRol(r as keyof typeof nombresRol),
            })),
          },
        ],
        guardar: async (d: Record<string, any>) => {
          setTimeout(() => this.editar(d['rol']), 0);
        },
      },
    });
  }
  editar(rol: string, u?: Usuario) {
    const campos: Campo[] = camposPaciente().map((c) => ({
      ...c,
      valor: u ? (u as unknown as Record<string, unknown>)[c.clave] : undefined,
      ...(c.clave === 'password'
        ? { requerido: !u, etiqueta: u ? 'Nueva contraseña (opcional)' : 'Contraseña' }
        : {}),
    }));
    if (['operador', 'medico'].includes(rol))
      campos.push({
        clave: 'id_sede',
        etiqueta: 'Sede',
        requerido: true,
        valor: u?.id_sede,
        opciones: this.sedes().map((s) => ({ id: s.id, nombre: s.nombre! })),
      });
    if (rol === 'medico')
      campos.push({
        clave: 'especialidades',
        etiqueta: 'Especialidades',
        multiple: true,
        requerido: true,
        valor: u?.especialidades || [],
        opciones: this.especialidades().map((e) => ({ id: e.id, nombre: e.descripcion! })),
      });
    if (rol === 'paciente')
      campos.push({
        clave: 'id_cobertura',
        etiqueta: 'Cobertura',
        requerido: true,
        valor: u?.id_cobertura,
        opciones: this.coberturas().map((c) => ({ id: c.id, nombre: c.nombre! })),
      });
    this.dialog.open(FormularioComponent, {
      width: '720px',
      data: {
        titulo: `${u ? 'Editar' : 'Agregar'} ${this.nombreRol(rol as keyof typeof nombresRol).toLowerCase()}`,
        campos,
        validar: (d: Record<string, any>) =>
          d['fecha_nacimiento'] > hoy()
            ? 'La fecha de nacimiento no puede ser futura.'
            : d['password'] && d['password'].length < 6
              ? 'La contraseña debe tener al menos 6 caracteres.'
              : '',
        guardar: async (d: Record<string, any>) => {
          await this.api.enviar(u ? 'PUT' : 'POST', '/usuarios' + (u ? '/' + u.id : ''), {
            ...d,
            rol,
          });
          await this.cargar();
        },
      },
    });
  }
}
