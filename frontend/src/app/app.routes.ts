import { Routes } from '@angular/router';
import { rolGuard } from './services/rol.guard';
const protegida = (roles: string[]) => ({ canActivate: [rolGuard], data: { roles } });
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'registro',
    data: { registro: true },
    loadComponent: () => import('./pages/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'perfil',
    ...protegida(['admin', 'medico', 'operador', 'paciente']),
    loadComponent: () => import('./pages/perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: 'paciente/datos',
    canActivate: [rolGuard],
    data: { roles: ['paciente'], editable: true },
    loadComponent: () => import('./pages/perfil.component').then((m) => m.PerfilComponent),
  },
  ...(['paciente', 'operador'] as const).map((rol) => ({
    path: rol + '/nuevo-turno',
    ...protegida([rol]),
    loadComponent: () => import('./pages/nuevo-turno.component').then((m) => m.NuevoTurnoComponent),
  })),
  ...(['paciente', 'medico', 'operador'] as const).map((rol) => ({
    path: rol + '/turnos',
    ...protegida([rol]),
    loadComponent: () => import('./pages/turnos.component').then((m) => m.TurnosComponent),
  })),
  ...(['medico', 'operador'] as const).map((rol) => ({
    path: rol + '/agenda',
    ...protegida([rol]),
    loadComponent: () => import('./pages/agenda.component').then((m) => m.AgendaComponent),
  })),
  {
    path: 'medico/historial',
    ...protegida(['medico']),
    loadComponent: () => import('./pages/pacientes.component').then((m) => m.PacientesComponent),
  },
  {
    path: 'operador/pacientes',
    ...protegida(['operador']),
    loadComponent: () => import('./pages/pacientes.component').then((m) => m.PacientesComponent),
  },
  ...[
    { entidad: 'sedes', titulo: 'Sedes', singular: 'sede' },
    { entidad: 'especialidades', titulo: 'Especialidades', singular: 'especialidad' },
    { entidad: 'coberturas', titulo: 'Coberturas', singular: 'cobertura' },
  ].map((d) => ({
    path: 'admin/' + d.entidad,
    canActivate: [rolGuard],
    data: { roles: ['admin'], ...d },
    loadComponent: () => import('./pages/entidades.component').then((m) => m.EntidadesComponent),
  })),
  {
    path: 'admin/usuarios',
    ...protegida(['admin']),
    loadComponent: () => import('./pages/usuarios.component').then((m) => m.UsuariosComponent),
  },
  {
    path: 'admin/auditoria',
    ...protegida(['admin']),
    loadComponent: () => import('./pages/auditoria.component').then((m) => m.AuditoriaComponent),
  },
  {
    path: 'admin/reportes',
    ...protegida(['admin']),
    loadComponent: () => import('./pages/reportes.component').then((m) => m.ReportesComponent),
  },
  {
    path: 'acceso-denegado',
    data: { denegado: true },
    loadComponent: () => import('./pages/estado.component').then((m) => m.EstadoComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/estado.component').then((m) => m.EstadoComponent),
  },
];
