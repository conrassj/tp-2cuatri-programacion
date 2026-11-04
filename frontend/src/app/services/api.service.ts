import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Respuesta } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  pendientes = signal(0);
  get<T>(ruta: string, filtros: Record<string, unknown> = {}): Promise<T> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros))
      if (valor !== '' && valor !== null && valor !== undefined)
        params = params.set(clave, String(valor));
    return firstValueFrom(
      this.http.get<Respuesta<T>>(environment.apiUrl + ruta, { params }).pipe(map((r) => r.datos)),
    );
  }
  enviar<T>(metodo: string, ruta: string, datos: unknown = {}): Promise<T> {
    return firstValueFrom(
      this.http
        .request<Respuesta<T>>(metodo, environment.apiUrl + ruta, { body: datos })
        .pipe(map((r) => r.datos)),
    );
  }
}
