import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MATERIAL } from '../shared/material';
@Component({
  selector: 'app-estado',
  imports: [...MATERIAL, RouterLink],
  templateUrl: './estado.component.html',
})
export class EstadoComponent {
  denegado = inject(ActivatedRoute).snapshot.data['denegado'];
}
