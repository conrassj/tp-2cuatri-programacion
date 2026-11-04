import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../shared/material';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Usuario, Opcion, nombresRol } from '../models/modelos';
@Component({
  selector: 'app-perfil',
  imports: [...MATERIAL],
  templateUrl: './perfil.component.html',
})
export class PerfilComponent {
  auth = inject(AuthService);
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  snack = inject(MatSnackBar);
  editable = !!this.route.snapshot.data['editable'];
  usuario = signal<Usuario | null>(null);
  coberturas = signal<Opcion[]>([]);
  sedes = signal<Opcion[]>([]);
  error = signal('');
  ocupado = signal(false);
  roles = nombresRol;
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(30)]),
    telefono: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{1,10}$')]),
    id_cobertura: new FormControl<number | null>(null, Validators.required),
    password: new FormControl('', [Validators.minLength(6), Validators.maxLength(72)]),
    repetir: new FormControl(''),
  });
  constructor() {
    void this.cargar();
  }
  async cargar() {
    try {
      const [u, c, s] = await Promise.all([
        this.api.get<Usuario>('/auth/perfil'),
        this.api.get<Opcion[]>('/coberturas/disponibles'),
        this.api.get<Opcion[]>('/sedes'),
      ]);
      this.usuario.set(u);
      this.coberturas.set(c);
      this.sedes.set(s);
      this.form.patchValue({ ...u, password: '', repetir: '' });
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  sede() {
    return this.sedes().find((s) => s.id === this.usuario()?.id_sede)?.nombre;
  }
  cobertura() {
    return this.coberturas().find((c) => c.id === this.usuario()?.id_cobertura)?.nombre;
  }
  async guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const d = this.form.getRawValue();
    if (d.password !== d.repetir) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    if (new TextEncoder().encode(d.password || '').length > 72) {
      this.error.set('La contraseña supera los 72 bytes permitidos.');
      return;
    }
    this.ocupado.set(true);
    try {
      await this.api.enviar('PUT', '/pacientes/perfil', {
        email: d.email,
        telefono: d.telefono,
        id_cobertura: d.id_cobertura,
        ...(d.password ? { password: d.password } : {}),
      });
      await this.auth.actualizar();
      await this.cargar();
      this.snack.open('Tus datos se guardaron', 'Cerrar', { duration: 4000 });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
}
