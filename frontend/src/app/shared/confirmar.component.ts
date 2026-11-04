import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATERIAL } from './material';
@Component({
  selector: 'app-confirmar',
  imports: [...MATERIAL],
  templateUrl: './confirmar.component.html',
})
export class ConfirmarComponent {
  texto = inject<string>(MAT_DIALOG_DATA);
}
