import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const rolGuard: CanActivateFn = async (ruta) => {
  const auth = inject(AuthService),
    router = inject(Router);
  try {
    await auth.restaurar();
  } catch {
    return router.createUrlTree(['/login']);
  }
  const u = auth.usuario();
  if (!u) return router.createUrlTree(['/login']);
  return (
    !ruta.data['roles'] ||
    ruta.data['roles'].includes(u.rol) ||
    router.createUrlTree(['/acceso-denegado'])
  );
};
