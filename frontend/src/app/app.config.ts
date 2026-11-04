import { MatPaginatorIntl } from '@angular/material/paginator';
import { paginadorEspanol } from './shared/paginador';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es-AR';
import { routes } from './app.routes';
import { apiInterceptor } from './services/http.interceptor';
registerLocaleData(es);
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: MatPaginatorIntl, useFactory: paginadorEspanol },
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
};
