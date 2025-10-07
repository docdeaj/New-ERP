
import { Component, ChangeDetectionStrategy, input, output, signal, computed, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingDefinition } from '../../data/settings.registry';
import { HighlightPipe } from '../../pipes/highlight.pipe';

interface SearchResult {
  section: string;
  items: SettingDefinition[];
}

@Component({
  selector: 'app-settings-search',
  standalone: true,
  imports: [CommonModule, HighlightPipe],
  templateUrl: './settings-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class SettingsSearchComponent {
  settings = input.required<SettingDefinition[]>();
  jumpTo = output<string>();

  container = viewChild<ElementRef<HTMLDivElement>>('container');
  query = signal('');
  isFocused = signal(false);
  activeIndex = signal(0);

  results = computed<SearchResult[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];

    const operators: { key: string, value: string }[] = [];
    const searchTerms: string[] = [];

    q.split(' ').forEach(term => {
      if (term.includes(':')) {
        const [key, value] = term.split(':', 2);
        if (key && value) operators.push({ key, value });
      } else {
        searchTerms.push(term);
      }
    });

    let filtered = this.settings();

    // Apply operators
    for (const op of operators) {
      switch (op.key) {
        case 'section':
          filtered = filtered.filter(s => s.section.toLowerCase().includes(op.value));
          break;
        case 'type':
          filtered = filtered.filter(s => s.type.toLowerCase().includes(op.value));
          break;
        case 'scope':
          filtered = filtered.filter(s => s.scope.toLowerCase().includes(op.value));
          break;
      }
    }

    // Apply search terms
    const searchTerm = searchTerms.join(' ');
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.label.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm) ||
        s.key.toLowerCase().includes(searchTerm)
      );
    }
    
    // Group by section
    const groups = new Map<string, SettingDefinition[]>();
    for (const setting of filtered) {
      if (!groups.has(setting.section)) groups.set(setting.section, []);
      groups.get(setting.section)!.push(setting);
    }
    return Array.from(groups.entries()).map(([section, items]) => ({ section, items }));
  });
  
  flattenedResults = computed(() => this.results().flatMap(r => r.items));
  activeResult = computed(() => this.flattenedResults()[this.activeIndex()]);

  onDocumentClick(event: MouseEvent) {
    if (!this.container()?.nativeElement.contains(event.target as Node)) {
      this.isFocused.set(false);
    }
  }

  onInput(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  onFocus() {
    this.isFocused.set(true);
  }

  onKeyDown(event: KeyboardEvent) {
    const total = this.flattenedResults().length;
    if (total === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => (i + 1) % total);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => (i - 1 + total) % total);
        break;
      case 'Enter':
        event.preventDefault();
        const active = this.activeResult();
        if (active) this.selectItem(active);
        break;
      case 'Escape':
        this.isFocused.set(false);
        break;
    }
  }

  selectItem(item: SettingDefinition) {
    this.jumpTo.emit(item.key);
    this.query.set('');
    this.isFocused.set(false);
  }
}
