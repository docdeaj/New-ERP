import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class TopbarComponent {
  openSearch = output<void>();
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.title || 'Aurora ERP';
      }),
      startWith('Dashboard')
    )
  );

  onOpenSearch() {
    this.openSearch.emit();
  }
}