import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rolGuard } from './services/rol.guard';
import { AuthService } from './services/auth.service';

describe('Permisos de las rutas', () => {
  let usuario: any;
  const restaurar = vi.fn(async () => {});
  beforeEach(() => {
    usuario = null;
    restaurar.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { restaurar, usuario: () => usuario } },
        { provide: Router, useValue: { createUrlTree: (ruta: string[]) => ruta.join('') } },
      ],
    });
  });
  async function entrar(roles: string[]) {
    return await TestBed.runInInjectionContext(() =>
      rolGuard({ data: { roles } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }
  it('sin sesión lleva al login', async () => {
    expect(await entrar(['admin'])).toBe('/login');
  });
  it('rechaza al paciente que escribe una URL de administrador', async () => {
    usuario = { rol: 'paciente' };
    expect(await entrar(['admin'])).toBe('/acceso-denegado');
  });
  it('deja entrar al médico en su sección', async () => {
    usuario = { rol: 'medico' };
    expect(await entrar(['medico'])).toBe(true);
  });
  it('restaura el perfil antes de decidir', async () => {
    usuario = { rol: 'operador' };
    await entrar(['operador']);
    expect(restaurar).toHaveBeenCalledOnce();
  });
});
