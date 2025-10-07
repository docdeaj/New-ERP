import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  private notificationService = inject(NotificationService);
  private uiStateService = inject(UiStateService);

  unreadCount = this.notificationService.unreadCount;

  onOpenSearch() {
    this.openSearch.emit();
  }
  
  toggleNotifications() {
    this.uiStateService.isNotificationsOpen.update(v => !v);
  }

  onSettings() {
    this.router.navigate(['/settings']);
  }

  onLogout() {
    this.uiStateService.showConfirmation(
      'Logout',
      'Are you sure you want to log out?',
      () => {
        console.log('User logged out.');
        // In a real app, you would call an authentication service here.
      }
    );
  }
}
