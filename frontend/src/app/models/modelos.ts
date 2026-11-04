export type Rol = 'admin' | 'medico' | 'operador' | 'paciente';
export interface Respuesta<T> {
  codigo: number;
  estado: string;
  datos: T;
}
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  rol: Rol;
  id_sede: number | null;
  id_cobertura: number | null;
  especialidades?: number[];
}
export interface Opcion {
  id: number;
  nombre?: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
}
export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: Opcion[];
}
export interface Agenda {
  id: number;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  medico: string;
  especialidad: string;
  sede: string;
  turnos_confirmados: number;
}
export interface Turno {
  id: number;
  fecha: string;
  hora: string;
  nota: string;
  estado: string;
  id_medico: number;
  id_sede: number;
  id_paciente: number;
  medico: string;
  paciente: string;
  fecha_nacimiento: string;
  especialidad: string;
  sede: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
}
export interface Notificacion {
  id: number;
  mensaje: string;
  fecha: string;
  leida: number;
}
export interface Pagina<T> {
  items: T[];
  total: number;
}
export const nombresRol: Record<Rol, string> = {
  admin: 'Administración',
  medico: 'Médico',
  operador: 'Recepción',
  paciente: 'Paciente',
};
// Usamos la fecha local: toISOString puede cambiar de día cerca de medianoche.
export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function edad(nacimiento: string): number {
  const d = new Date(nacimiento + 'T12:00:00'),
    ahora = new Date();
  let n = ahora.getFullYear() - d.getFullYear();
  if (
    ahora.getMonth() < d.getMonth() ||
    (ahora.getMonth() === d.getMonth() && ahora.getDate() < d.getDate())
  )
    n--;
  return n;
}
