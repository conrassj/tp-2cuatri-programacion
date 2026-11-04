import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiInterceptor } from './http.interceptor';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

describe('Peticiones y sesión', () => {
  let http: HttpClient;
  let control: HttpTestingController;
  let pendientes = signal(0);
  const salir = vi.fn();
  beforeEach(() => {
    pendientes = signal(0);
    salir.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: 'token-de-prueba', salir } },
        { provide: ApiService, useValue: { pendientes } },
      ],
    });
    http = TestBed.inject(HttpClient);
    control = TestBed.inject(HttpTestingController);
  });
  afterEach(() => control.verify());
  it('adjunta el token solo a la API propia', () => {
    http.get(environment.apiUrl + '/auth/perfil').subscribe();
    const r = control.expectOne(environment.apiUrl + '/auth/perfil');
    expect(r.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(pendientes()).toBe(1);
    r.flush({});
    expect(pendientes()).toBe(0);
    http.get('https://otro.example/datos').subscribe();
    const externo = control.expectOne('https://otro.example/datos');
    expect(externo.request.headers.has('Authorization')).toBe(false);
    externo.flush({});
  });
  it('un 401 protegido cierra la sesión y libera el indicador de carga', () => {
    http.get(environment.apiUrl + '/auth/perfil').subscribe({ error: () => {} });
    control
      .expectOne(environment.apiUrl + '/auth/perfil')
      .flush({ estado: 'Token vencido' }, { status: 401, statusText: 'Unauthorized' });
    expect(salir).toHaveBeenCalledWith(true);
    expect(pendientes()).toBe(0);
  });
  it('credenciales incorrectas muestran el mensaje sin redirigir otra vez', () => {
    let mensaje = '';
    http
      .post(environment.apiUrl + '/auth/login', {})
      .subscribe({ error: (e) => (mensaje = e.message) });
    control
      .expectOne(environment.apiUrl + '/auth/login')
      .flush(
        { estado: 'DNI o contraseña incorrectos' },
        { status: 401, statusText: 'Unauthorized' },
      );
    expect(mensaje).toBe('DNI o contraseña incorrectos');
    expect(salir).not.toHaveBeenCalled();
  });
});
