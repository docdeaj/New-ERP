import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/types';
import { Router } from '@angular/router';

type NotificationFilter = 'all' | 'unread';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);
  router = inject(Router);

  activeFilter = signal<NotificationFilter>('all');

  filteredNotifications = computed(() => {
    const notifications = this.notificationService.notifications();
    const filter = this.activeFilter();
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
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
      default: return 'fa-solid fa-bell';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  }

  handleNotificationClick(notification: Notification) {
    this.notificationService.markAsRead(notification.id);
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }
  
  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }
}