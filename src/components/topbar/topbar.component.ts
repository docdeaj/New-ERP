import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../services/notification.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class TopbarComponent {
  openSearch = output<void>();
  private router: Router = inject(Router);
  private activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private uiStateService = inject(UiStateService);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => {
        let route: ActivatedRoute = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.title || 'Aurora ERP';
      }),
      startWith('Dashboard')
    )
  );
  
  unreadCount = this.notificationService.unreadCount;

  onOpenSearch() {
    this.openSearch.emit();
  }
  
  toggleNotifications() {
    this.uiStateService.isNotificationsOpen.update(v => !v);
  }
}