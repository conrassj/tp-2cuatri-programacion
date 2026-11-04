import { MatPaginatorIntl } from '@angular/material/paginator';
export function paginadorEspanol() {
  const p = new MatPaginatorIntl();
  p.itemsPerPageLabel = 'Registros por página';
  p.nextPageLabel = 'Página siguiente';
  p.previousPageLabel = 'Página anterior';
  p.firstPageLabel = 'Primera página';
  p.lastPageLabel = 'Última página';
  p.getRangeLabel = (pagina, tamano, total) =>
    total === 0
      ? '0 de 0'
      : `${pagina * tamano + 1} – ${Math.min((pagina + 1) * tamano, total)} de ${total}`;
  return p;
}
