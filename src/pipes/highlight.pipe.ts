import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  transform(value: string | null | undefined, query: string | null | undefined): string {
    if (!query || !value) {
      return value || '';
    }

    // Escape special characters in the query to use it in a regex.
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safeQuery, 'gi');
    
    // Wrap matches in a <mark> tag with Tailwind CSS classes for styling.
    return value.replace(re, (match) => `<mark class="bg-yellow-200/70 dark:bg-yellow-500/30 rounded">${match}</mark>`);
  }
}
