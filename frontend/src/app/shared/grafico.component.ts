import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
@Component({
  selector: 'app-grafico',
  template:
    '<div class="chart-container"><canvas #canvas role="img" [attr.aria-label]="titulo"></canvas></div>',
})
export class GraficoComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() etiquetas: string[] = [];
  @Input() valores: number[] = [];
  @Input() titulo = 'Cantidad de turnos';
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  ngAfterViewInit() {
    this.dibujar();
  }
  ngOnChanges() {
    if (this.canvas) this.dibujar();
  }
  ngOnDestroy() {
    this.chart?.destroy();
  }
  dibujar() {
    this.chart?.destroy();
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.etiquetas,
        datasets: [
          {
            label: this.titulo,
            data: this.valores,
            backgroundColor: ['#198d89', '#77b9a1', '#4d91aa', '#abc9c5'],
            borderRadius: 6,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#edf1f2' } },
          x: { grid: { display: false } },
        },
      },
    });
  }
}
