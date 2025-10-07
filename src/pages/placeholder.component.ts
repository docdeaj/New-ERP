import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  template: `
    <div class="flex flex-col items-center justify-center h-96 bg-surface rounded-2xl shadow-lg">
      <div class="text-center">
        <i class="fa-solid fa-person-digging text-6xl text-primary-400 mb-6"></i>
        <h2 class="text-3xl font-bold text-brand-text mb-2">
          {{ pageTitle }}
        </h2>
        <p class="text-lg text-charcoal-400">This page is under construction.</p>
        <p class="mt-4 text-sm text-charcoal-500">Coming soon to Aurora ERP+POS!</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class PlaceholderComponent {
  // FIX: Explicitly type injected service to resolve type inference issues.
  route: ActivatedRoute = inject(ActivatedRoute);
  pageTitle = this.route.snapshot.title || 'Page';
}
