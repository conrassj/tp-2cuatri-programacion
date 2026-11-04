import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { MATERIAL } from '../shared/material';
import { FormularioComponent, Campo } from '../shared/formulario.component';
import { ConfirmarComponent } from '../shared/confirmar.component';
import { ApiService } from '../services/api.service';
import { Opcion } from '../models/modelos';
@Component({
  selector: 'app-entidades',
  imports: [...MATERIAL],
  templateUrl: './entidades.component.html',
})
export class EntidadesComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  entidad = this.route.snapshot.data['entidad'];
  titulo = this.route.snapshot.data['titulo'];
  singular = this.route.snapshot.data['singular'];
  esEspecialidad = this.entidad === 'especialidades';
  descripcion =
    this.entidad === 'sedes'
      ? 'Los lugares donde atendemos.'
      : this.esEspecialidad
        ? 'Las especialidades disponibles en la clínica.'
        : 'Las coberturas que pueden registrar los pacientes.';
  columnas =
    this.entidad === 'sedes'
      ? ['nombre', 'direccion', 'telefono', 'acciones']
      : ['nombre', 'acciones'];
  items = signal<Opcion[]>([]);
  error = signal('');
  cargando = signal(true);
  borrando = signal(false);
  filtro = '';
  constructor() {
    void this.cargar();
  }
  filtradas() {
    const q = this.filtro.toLowerCase().trim();
    return this.items().filter((x) =>
      [x.nombre, x.descripcion, x.direccion, x.telefono].some((v) => v?.toLowerCase().includes(q)),
    );
  }
  async cargar() {
    this.cargando.set(true);
    try {
      this.items.set(await this.api.get<Opcion[]>('/' + this.entidad));
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }
  editar(e?: Opcion) {
    const campos: Campo[] = [
      {
        clave: this.esEspecialidad ? 'descripcion' : 'nombre',
        etiqueta: this.esEspecialidad ? 'Descripción' : 'Nombre',
        requerido: true,
        max: this.entidad === 'sedes' ? 50 : 30,
        valor: e?.nombre || e?.descripcion,
      },
    ];
    if (this.entidad === 'sedes')
      campos.push(
        {
          clave: 'direccion',
          etiqueta: 'Dirección',
          requerido: true,
          max: 100,
          valor: e?.direccion,
        },
        { clave: 'telefono', etiqueta: 'Teléfono', requerido: true, max: 15, valor: e?.telefono },
      );
    this.dialog.open(FormularioComponent, {
      width: '560px',
      data: {
        titulo: `${e ? 'Editar' : 'Agregar'} ${this.singular}`,
        campos,
        guardar: async (d: unknown) => {
          await this.api.enviar(e ? 'PUT' : 'POST', '/' + this.entidad + (e ? '/' + e.id : ''), d);
          await this.cargar();
          this.snack.open('Cambios guardados', 'Cerrar', { duration: 3000 });
        },
      },
    });
  }
  async eliminar(e: Opcion) {
    if (
      !(await firstValueFrom(
        this.dialog
          .open(ConfirmarComponent, {
            data: `¿Está seguro de eliminar ${e.nombre || e.descripcion}?`,
          })
          .afterClosed(),
      ))
    )
      return;
    this.borrando.set(true);
    try {
      await this.api.enviar('DELETE', `/${this.entidad}/${e.id}`);
      await this.cargar();
      this.snack.open('Registro eliminado', 'Cerrar', { duration: 3000 });
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.borrando.set(false);
    }
  }
}
