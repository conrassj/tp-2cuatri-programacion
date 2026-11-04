import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MATERIAL } from './shared/material';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { NotificacionesService } from './services/notificaciones.service';
import { nombresRol } from './models/modelos';
@Component({
  selector: 'app-root',
  imports: [
    ...MATERIAL,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatProgressBarModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  auth = inject(AuthService);
  api = inject(ApiService);
  notificaciones = inject(NotificacionesService);
  roles = nombresRol;
  error = signal('');
  constructor() {
    effect(() => {
      if (this.auth.usuario()) void this.notificaciones.cargar();
      else this.notificaciones.items.set([]);
    });
    void this.auth.restaurar().catch((e) => this.error.set(e.message));
  }
  menu() {
    const r = this.auth.usuario()?.rol;
    const comun = [{ ruta: '/', texto: 'Inicio', icono: 'space_dashboard' }];
    const items =
      r === 'admin'
        ? [
            ['reportes', 'Reportes', 'bar_chart'],
            ['usuarios', 'Usuarios', 'group'],
            ['sedes', 'Sedes', 'location_on'],
            ['especialidades', 'Especialidades', 'medical_services'],
            ['coberturas', 'Coberturas', 'verified_user'],
            ['auditoria', 'Auditoría', 'history'],
          ]
        : r === 'paciente'
          ? [
              ['nuevo-turno', 'Nuevo turno', 'add_circle_outline'],
              ['turnos', 'Mis turnos', 'event'],
              ['datos', 'Mis datos', 'person_outline'],
            ]
          : r === 'medico'
            ? [
                ['agenda', 'Mi agenda', 'calendar_month'],
                ['turnos', 'Turnos programados', 'event'],
                ['historial', 'Historial clínico', 'folder_shared'],
              ]
            : [
                ['agenda', 'Agenda médica', 'calendar_month'],
                ['turnos', 'Turnos de la sede', 'event'],
                ['pacientes', 'Pacientes', 'group'],
                ['nuevo-turno', 'Asignar turno', 'add_circle_outline'],
              ];
    return [
      ...comun,
      ...items.map(([ruta, texto, icono]) => ({ ruta: `/${r}/${ruta}`, texto, icono })),
      { ruta: '/perfil', texto: 'Mi perfil', icono: 'account_circle' },
    ];
  }
  async leer(id: number) {
    try {
      await this.notificaciones.leer(id);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
