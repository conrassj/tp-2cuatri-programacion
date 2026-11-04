import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MATERIAL } from '../shared/material';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-inicio',
  imports: [...MATERIAL, RouterLink],
  templateUrl: './inicio.component.html',
})
export class InicioComponent {
  auth = inject(AuthService);
  fecha = new Date();
  principal() {
    const r = this.auth.usuario()?.rol;
    return r === 'paciente'
      ? '/paciente/nuevo-turno'
      : r === 'admin'
        ? '/admin/reportes'
        : `/${r}/agenda`;
  }
  accesos() {
    const r = this.auth.usuario()?.rol;
    return r === 'paciente'
      ? [
          {
            ruta: '/paciente/turnos',
            icono: 'event',
            titulo: 'Mis turnos',
            texto: 'Consultá tus reservas y el resultado de cada atención.',
          },
          {
            ruta: '/paciente/datos',
            icono: 'person',
            titulo: 'Mis datos',
            texto: 'Mantené tu contacto y cobertura actualizados.',
          },
        ]
      : r === 'admin'
        ? [
            {
              ruta: '/admin/usuarios',
              icono: 'group',
              titulo: 'Usuarios',
              texto: 'Administrá las personas y sus permisos.',
            },
            {
              ruta: '/admin/sedes',
              icono: 'location_on',
              titulo: 'Sedes',
              texto: 'Organizá los espacios de atención.',
            },
            {
              ruta: '/admin/auditoria',
              icono: 'history',
              titulo: 'Auditoría',
              texto: 'Consultá los cambios registrados.',
            },
          ]
        : [
            {
              ruta: `/${r}/turnos`,
              icono: 'event',
              titulo: 'Turnos',
              texto: 'Consultá las citas y su estado.',
            },
            {
              ruta: r === 'medico' ? '/medico/historial' : '/operador/pacientes',
              icono: 'folder_shared',
              titulo: r === 'medico' ? 'Historial clínico' : 'Pacientes',
              texto: 'Buscá a la persona que necesitás atender.',
            },
          ];
  }
}
