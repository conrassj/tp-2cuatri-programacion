import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../shared/material';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Opcion, hoy } from '../models/modelos';

@Component({
  selector: 'app-auth',
  imports: [...MATERIAL, RouterLink],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  registro = this.route.snapshot.data['registro'] === true;
  vencida = this.route.snapshot.queryParamMap.has('sesion');
  hoy = hoy();
  error = signal('');
  ocupado = signal(false);
  coberturas = signal<Opcion[]>([]);
  campos = this.registro
    ? [
        { clave: 'nombre', nombre: 'Nombre', tipo: 'text', max: 30 },
        { clave: 'apellido', nombre: 'Apellido', tipo: 'text', max: 30 },
        { clave: 'dni', nombre: 'DNI', tipo: 'text', max: 8 },
        { clave: 'email', nombre: 'Email', tipo: 'email', max: 30 },
        { clave: 'telefono', nombre: 'Teléfono', tipo: 'tel', max: 10 },
        { clave: 'fecha_nacimiento', nombre: 'Fecha de nacimiento', tipo: 'date', max: 10 },
        { clave: 'password', nombre: 'Contraseña', tipo: 'password', max: 72 },
        { clave: 'repetir', nombre: 'Repetir contraseña', tipo: 'password', max: 72 },
      ]
    : [
        { clave: 'dni', nombre: 'DNI', tipo: 'text', max: 8 },
        { clave: 'password', nombre: 'Contraseña', tipo: 'password', max: 72 },
      ];
  form = new FormGroup<Record<string, FormControl>>({});
  constructor() {
    for (const c of this.campos) {
      const v = [Validators.required, Validators.maxLength(c.max)];
      if (c.clave === 'dni') v.push(Validators.pattern('^[0-9]{7,8}$'));
      if (c.clave === 'email') v.push(Validators.email);
      if (c.clave === 'telefono') v.push(Validators.pattern('^[0-9]{1,10}$'));
      if (this.registro && c.clave === 'password') v.push(Validators.minLength(6));
      this.form.addControl(c.clave, new FormControl('', v));
    }
    if (this.registro) {
      this.form.addControl('id_cobertura', new FormControl('', Validators.required));
      void this.cargarCoberturas();
    }
  }
  errorCampo(k: string) {
    const e = this.form.controls[k].errors;
    return e?.['required']
      ? 'Completá este campo.'
      : e?.['email']
        ? 'Ingresá un email válido.'
        : e?.['minlength']
          ? 'Usá al menos 6 caracteres.'
          : e?.['pattern']
            ? k === 'dni'
              ? 'El DNI lleva 7 u 8 números.'
              : 'Ingresá solo números, hasta 10 dígitos.'
            : 'Revisá la longitud del dato.';
  }
  async cargarCoberturas() {
    try {
      this.coberturas.set(await this.api.get<Opcion[]>('/coberturas/disponibles'));
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  async enviar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const d = this.form.getRawValue();
    this.error.set('');
    if (this.registro) {
      if (d['password'] !== d['repetir']) {
        this.error.set('Las contraseñas no coinciden.');
        return;
      }
      if (d['fecha_nacimiento'] > this.hoy) {
        this.error.set('La fecha de nacimiento no puede ser futura.');
        return;
      }
      if (new TextEncoder().encode(d['password']).length > 72) {
        this.error.set('La contraseña es demasiado larga.');
        return;
      }
    }
    this.ocupado.set(true);
    try {
      if (this.registro) {
        const { repetir, ...datos } = d;
        await this.api.enviar('POST', '/auth/registro', datos);
        this.snack.open('Cuenta creada. Ya podés iniciar sesión.', 'Cerrar', { duration: 5000 });
        await this.router.navigate(['/login']);
      } else {
        await this.auth.ingresar(d['dni'], d['password']);
        await this.router.navigate(['/']);
      }
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
}
