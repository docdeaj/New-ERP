import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChartDataset {
  label: string;
  data: number[];
}

@Component({
  selector: 'app-simple-bar-chart',
  templateUrl: './simple-bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class SimpleBarChartComponent {
  labels = input.required<string[]>();
  datasets = input.required<ChartDataset[]>();

  colors = ['bg-indigo-500', 'bg-sky-500', 'bg-teal-500'];

  // Find the overall maximum value across all datasets to scale the bars correctly
  maxValue = computed(() => {
    const allData = this.datasets().flatMap(ds => ds.data);
    if (allData.length === 0) return 100;
    const max = Math.max(...allData);
    // Add a little padding to the top of the chart
    return Math.ceil(max * 1.1 / 10) * 10;
  });

  getBarHeight(value: number): number {
    const max = this.maxValue();
    if (max === 0) return 0;
    return (value / max) * 100;
  }
}