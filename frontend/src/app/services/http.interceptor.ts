import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, finalize, throwError, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl + '/')) return next(req);
  const auth = inject(AuthService),
    api = inject(ApiService);
  const protegida = !['/auth/login', '/auth/registro', '/coberturas/disponibles'].some((r) =>
    req.url.endsWith(r),
  );
  if (auth.token && protegida)
    req = req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } });
  api.pendientes.update((n) => n + 1);
  return next(req).pipe(
    timeout(15000),
    catchError((error) => {
      if (error.status === 401 && protegida) auth.salir(true);
      return throwError(
        () =>
          new Error(
            error.error?.estado ||
              (error.status === 0 || error.name === 'TimeoutError'
                ? 'No pudimos conectar con el servidor. Revisá que el backend esté encendido e intentá de nuevo.'
                : 'No se pudo completar la operación. Intentá nuevamente.'),
          ),
      );
    }),
    finalize(() => api.pendientes.update((n) => n - 1)),
  );
};
