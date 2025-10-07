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

  points = computed(() => {
    const data = this.data();
    if (!data || data.length < 2) return [];

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 25 - ((d - min) / range) * 20 - 2.5; // Scale y-values within the 25 height, with padding
      return {x, y};
    });
  });

  path = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';

    const smoothing = 0.2;
    const line = (pointA: {x: number, y: number}, pointB: {x: number, y: number}) => {
      const lengthX = pointB.x - pointA.x;
      const lengthY = pointB.y - pointA.y;
      return {
        length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
        angle: Math.atan2(lengthY, lengthX)
      };
    };

    const controlPoint = (current: {x: number, y: number}, previous: {x: number, y: number}, next: {x: number, y: number}, reverse?: boolean) => {
      const p = previous || current;
      const n = next || current;
      const l = line(p, n);
      const angle = l.angle + (reverse ? Math.PI : 0);
      const length = l.length * smoothing;
      const x = current.x + Math.cos(angle) * length;
      const y = current.y + Math.sin(angle) * length;
      return [x, y];
    };

    const pathData = pts.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
      const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
      return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point.x},${point.y}`;
    }, '');

    return pathData;
  });
  
  lastPoint = computed(() => {
    const pts = this.points();
    return pts.length > 0 ? pts[pts.length - 1] : null;
  });
}