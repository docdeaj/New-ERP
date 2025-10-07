import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportQuery } from '../../models/types';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag],
  templateUrl: './query-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderComponent {
  query = input.required<ReportQuery>();
  queryChange = output<ReportQuery>();

  dimensions = signal<string[]>([]);
  metrics = signal<string[]>([]);

  constructor() {
    effect(() => {
      const q = this.query();
      this.dimensions.set(q.dimensions);
      this.metrics.set(q.metrics);
    });
  }

  private emitChange() {
    this.queryChange.emit({
      ...this.query(),
      dimensions: this.dimensions(),
      metrics: this.metrics(),
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      if (event.container.id === 'dimensionsList') {
        this.dimensions.set([...event.container.data]);
      } else {
        this.metrics.set([...event.container.data]);
      }
      this.emitChange();
    }
  }

  removeDimension(index: number) {
    this.dimensions.update(dims => {
      const newDims = [...dims];
      newDims.splice(index, 1);
      return newDims;
    });
    this.emitChange();
  }

  removeMetric(index: number) {
    this.metrics.update(mets => {
      const newMets = [...mets];
      newMets.splice(index, 1);
      return newMets;
    });
    this.emitChange();
  }
  
  // Helper to format field keys for display
  formatField(key: string): string {
    return key.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }
}