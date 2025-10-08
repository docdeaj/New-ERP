import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { UiStateService } from '../../services/ui-state.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class TopbarComponent {
  openSearch = output<void>();
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private uiStateService = inject(UiStateService);
  private authService = inject(AuthService);

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
    this.authService.logout();
  }
  
  onHelp() {
    this.uiStateService.toggleShortcuts(true);
  }
}