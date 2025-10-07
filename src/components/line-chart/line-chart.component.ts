import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

interface ChartDataset {
  label: string;
  data: number[];
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './line-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  labels = input.required<string[]>();
  datasets = input.required<ChartDataset[]>();

  colors = ['#4f46e5', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899'];
  viewBox = '0 0 500 250';

  // Find the overall maximum value across all datasets to scale the chart correctly
  maxValue = computed(() => {
    const allData = this.datasets().flatMap(ds => ds.data);
    if (allData.length === 0) return 100;
    const max = Math.max(...allData, 0);
    // Add a little padding to the top of the chart and round up nicely
    return Math.ceil((max * 1.1) / 10) * 10;
  });

  yAxisLabels = computed(() => {
    const max = this.maxValue();
    return [max, max * 0.75, max * 0.5, max * 0.25, 0];
  });

  datasetPaths = computed(() => {
    const dataSets = this.datasets();
    const labels = this.labels();
    if (dataSets.length === 0 || labels.length === 0) return [];
    
    const max = this.maxValue();
    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    return dataSets.map((dataset, dIndex) => {
      const points = dataset.data.map((value, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (value / max) * chartHeight;
        return { x, y };
      });

      const path = points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        return `L ${p.x} ${p.y}`;
      }).join(' ');

      return {
        path,
        points,
        color: this.colors[dIndex % this.colors.length],
      };
    });
  });
}