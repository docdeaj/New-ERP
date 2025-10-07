import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogViewerComponent {
  data = input.required<any>();
  isRoot = input<boolean>(true);

  keys = computed(() => {
    const data = this.data();
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return [];
    }
    return Object.keys(data);
  });

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }
  
  isUrl(value: any): boolean {
    return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
  }

  getValueType(value: any): 'string' | 'number' | 'boolean' | 'null' | 'object' {
    if (value === null) return 'null';
    const type = typeof value;
    if (['string', 'number', 'boolean'].includes(type)) {
      return type as 'string' | 'number' | 'boolean';
    }
    return 'object';
  }
}
