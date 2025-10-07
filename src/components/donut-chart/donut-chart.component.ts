import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  percentage: number;
  offset: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './donut-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent {
  data = input.required<{ label: string; value: number }[]>();
  
  // Base colors for segments
  colors = ['#4f46e5', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899'];

  total = computed(() => this.data().reduce((sum, item) => sum + item.value, 0));

  segments = computed<DonutSegment[]>(() => {
    const data = this.data();
    const total = this.total();
    if (total === 0) return [];
    
    let cumulativeOffset = 0;
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const segment = {
        ...item,
        color: this.colors[index % this.colors.length],
        percentage,
        offset: cumulativeOffset,
      };
      cumulativeOffset += percentage;
      return segment;
    });
  });
}
