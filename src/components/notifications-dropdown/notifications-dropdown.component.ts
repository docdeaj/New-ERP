import { Component, ChangeDetectionStrategy, inject, output, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../models/types';
import { UiStateService } from '../../services/ui-state.service';

type NotificationTab = 'All' | 'System' | 'Billing';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './notifications-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsDropdownComponent {
  close = output<void>();
  
  notificationService = inject(NotificationService);
  uiStateService = inject(UiStateService);
  router = inject(Router);

  activeTab = signal<NotificationTab>('All');
  
  billingTypes: NotificationType[] = ['invoice', 'quotation', 'cheque', 'billing'];

  filteredNotifications = computed(() => {
    const notifications = this.notificationService.notifications();
    const tab = this.activeTab();
    
    if (tab === 'System') {
      return notifications.filter(n => n.type === 'system');
    }
    if (tab === 'Billing') {
      return notifications.filter(n => this.billingTypes.includes(n.type));
    }
    return notifications; // 'All'
  });

  getIconForType(type: string): string {
    switch (type) {
      case 'invoice': return 'fa-solid fa-file-invoice-dollar';
      case 'stock': return 'fa-solid fa-box-open';
      case 'system': return 'fa-solid fa-cogs';
      case 'purchase_order': return 'fa-solid fa-cart-shopping';
      case 'mention': return 'fa-solid fa-at';
      case 'cheque': return 'fa-solid fa-money-check-dollar';
      case 'quotation': return 'fa-solid fa-file-lines';
      case 'billing': return 'fa-solid fa-credit-card';
      default: return 'fa-solid fa-bell';
    }
  }

  handleNotificationClick(notification: Notification) {
    this.notificationService.markAsRead(notification.id);
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
    this.close.emit();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  viewAll() {
    this.router.navigate(['/notifications']);
    this.close.emit();
  }
}
