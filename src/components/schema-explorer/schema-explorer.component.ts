
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// FIX: Imported missing report schema types.
import { ReportSchema, SchemaField } from '../../models/types';
import { HighlightPipe } from '../../pipes/highlight.pipe';

interface SchemaGroup {
  group: string;
  fields: SchemaField[];
}

@Component({
  selector: 'app-schema-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, HighlightPipe],
  templateUrl: './schema-explorer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaExplorerComponent {
  schema = input.required<ReportSchema>();
  fieldAdded = output<SchemaField>();

  searchQuery = signal('');
  activeTab = signal<'dimensions' | 'metrics'>('dimensions');

  private groupSchema(fields: SchemaField[], query: string): SchemaGroup[] {
    const q = query.toLowerCase();
    const filteredFields = q
      ? fields.filter(f => f.label.toLowerCase().includes(q) || f.group.toLowerCase().includes(q))
      : fields;

    const groups = new Map<string, SchemaField[]>();
    for (const field of filteredFields) {
      if (!groups.has(field.group)) {
        groups.set(field.group, []);
      }
      groups.get(field.group)!.push(field);
    }
    return Array.from(groups.entries()).map(([group, fields]) => ({ group, fields }));
  }

  groupedDimensions = computed(() => this.groupSchema(this.schema().dimensions, this.searchQuery()));
  groupedMetrics = computed(() => this.groupSchema(this.schema().metrics, this.searchQuery()));

  onAddField(field: SchemaField) {
    this.fieldAdded.emit(field);
  }
}
