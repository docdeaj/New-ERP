
import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
// FIX: Imported missing report query types.
import { ReportQuery, SortDefinition } from '../../models/types';
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
  sortBy = signal<SortDefinition[]>([]);
  isSortMenuOpen = signal(false);

  constructor() {
    effect(() => {
      const q = this.query();
      this.dimensions.set(q.dimensions);
      this.metrics.set(q.metrics);
      this.sortBy.set(q.sortBy);
    });
  }
  
  availableSortFields = computed(() => {
      const currentSortFields = new Set(this.sortBy().map(s => s.field));
      const dims = this.dimensions().filter(d => !currentSortFields.has(d));
      const mets = this.metrics().filter(m => !currentSortFields.has(m));
      return [...dims, ...mets];
  });

  private emitChange() {
    this.queryChange.emit({
      ...this.query(),
      dimensions: this.dimensions(),
      metrics: this.metrics(),
      sortBy: this.sortBy(),
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      const data = [...event.container.data];
      moveItemInArray(data, event.previousIndex, event.currentIndex);
      if (event.container.id === 'dimensionsList') {
        this.dimensions.set(data);
      } else {
        this.metrics.set(data);
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
  
  // --- Sorting Methods ---

  dropSort(event: CdkDragDrop<SortDefinition[]>) {
    if (event.previousContainer === event.container) {
      const newSortBy = [...this.sortBy()];
      moveItemInArray(newSortBy, event.previousIndex, event.currentIndex);
      this.sortBy.set(newSortBy);
      this.emitChange();
    }
  }
  
  addSort(field: string) {
      this.sortBy.update(current => [...current, { field, direction: 'asc' }]);
      this.isSortMenuOpen.set(false);
      this.emitChange();
  }

  removeSort(index: number) {
    this.sortBy.update(sorts => {
      const newSorts = [...sorts];
      newSorts.splice(index, 1);
      return newSorts;
    });
    this.emitChange();
  }

  toggleSortDirection(index: number) {
    this.sortBy.update(sorts => {
      const newSorts = [...sorts];
      const current = newSorts[index];
      newSorts[index] = { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      return newSorts;
    });
    this.emitChange();
  }

  // Helper to format field keys for display
  formatField(key: string): string {
    return key.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }
}
