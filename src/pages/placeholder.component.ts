import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  template: `
    <div class="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
      <div class="text-center">
        <i class="fa-solid fa-person-digging text-6xl text-indigo-400 mb-6"></i>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {{ pageTitle }}
        </h2>
        <p class="text-lg text-gray-500 dark:text-gray-400">This page is under construction.</p>
        <p class="mt-4 text-sm text-gray-400 dark:text-gray-500">Coming soon to Aurora ERP+POS!</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class PlaceholderComponent {
  route = inject(ActivatedRoute);
  pageTitle = this.route.snapshot.title || 'Page';
}