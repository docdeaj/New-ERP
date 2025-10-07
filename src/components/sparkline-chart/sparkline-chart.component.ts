import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sparkline-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sparkline-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineChartComponent {
  data = input.required<number[]>();
  color = input<string>('text-primary'); // e.g., 'text-green-500'

  viewBox = '0 0 100 25';

  path = computed(() => {
    const data = this.data();
    if (!data || data.length < 2) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 25 - ((d - min) / range) * 20 - 2.5; // Scale y-values within the 25 height, with padding
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  });
}
