import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from './material';
export interface Campo {
  clave: string;
  etiqueta: string;
  tipo?: string;
  requerido?: boolean;
  max?: number;
  opciones?: { id: unknown; nombre: string }[];
  multiple?: boolean;
  valor?: unknown;
  patron?: string;
}
export interface FormularioDatos {
  titulo: string;
  campos: Campo[];
  guardar: (datos: Record<string, any>) => Promise<void>;
  validar?: (datos: Record<string, any>) => string;
}
@Component({
  selector: 'app-formulario',
  imports: [...MATERIAL],
  templateUrl: './formulario.component.html',
})
export class FormularioComponent {
  datos = inject<FormularioDatos>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<FormularioComponent>);
  error = signal('');
  ocupado = signal(false);
  form = new FormGroup<Record<string, FormControl>>({});
  constructor() {
    for (const c of this.datos.campos) {
      const v = [];
      if (c.requerido) v.push(Validators.required);
      if (c.max) v.push(Validators.maxLength(c.max));
      if (c.tipo === 'email') v.push(Validators.email);
      if (c.patron) v.push(Validators.pattern(c.patron));
      this.form.addControl(c.clave, new FormControl(c.valor ?? (c.multiple ? [] : ''), v));
    }
  }
  mensaje(c: Campo) {
    const e = this.form.controls[c.clave].errors;
    return e?.['required']
      ? 'Completá este campo.'
      : e?.['email']
        ? 'Ingresá un email válido.'
        : e?.['pattern']
          ? 'Revisá el formato de este dato.'
          : `Máximo ${c.max} caracteres.`;
  }
  async guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const d = this.form.getRawValue();
    const error = this.datos.validar?.(d);
    if (error) {
      this.error.set(error);
      return;
    }
    this.ocupado.set(true);
    this.ref.disableClose = true;
    try {
      await this.datos.guardar(d);
      this.ref.close(true);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.ocupado.set(false);
      this.ref.disableClose = false;
    }
  }
}
