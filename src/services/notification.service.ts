
import { Injectable, signal, computed } from '@angular/core';
import { Notification, NotificationType } from '../models/types';

// FIX: Changed id to string and createdAt to created_at to match Notification type.
let MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', tenant_id: '1', type: 'invoice', title: 'Invoice INV-2024-003 is overdue', body: 'Your payment for invoice INV-2024-003 of LKR 250,000.00 was due 2 days ago.', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), read: false, link: '/invoices?q=INV-2024-003', priority: 'high' },
  { id: '2', tenant_id: '1', type: 'stock', title: 'Low Stock Alert for 4K Webcam', body: 'Stock for 4K Webcam (WC-401) is critically low across all locations.', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), read: false, link: '/inventory?q=WC-401', priority: 'medium' },
  { id: '3', tenant_id: '1', type: 'system', title: 'System Update Scheduled', body: 'A system update is scheduled for August 5th, 2024 at 2:00 AM. Expect brief downtime.', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), read: true, priority: 'low' },
  { id: '4', tenant_id: '1', type: 'purchase_order', title: 'PO-2024-001 has been shipped', body: 'Your purchase order from Global Tech Suppliers is now in transit.', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), read: true, link: '/purchase-orders?q=PO-2024-001', priority: 'medium' },
  { id: '5', tenant_id: '1', type: 'mention', title: 'You were mentioned in an invoice note', body: '@Admin User mentioned you in a note on INV-2024-004: "Can you please follow up on this payment?"', created_at: new Date().toISOString(), read: false, link: '/invoices?q=INV-2024-004', priority: 'high' },
  { id: '6', tenant_id: '1', type: 'cheque', title: 'Cheque 654321 is pending deposit', body: 'A cheque for LKR 100,000.00 is ready for deposit.', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), read: true, link: '/cheques', priority: 'medium' },
  { id: '7', tenant_id: '1', type: 'quotation', title: 'Quotation QUO-2024-001 accepted', body: 'Pixel Perfect Designs has accepted your quotation.', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), read: true, link: '/quotations', priority: 'low' },
  { id: '8', tenant_id: '1', type: 'billing', title: 'Monthly Subscription Renewed', body: 'Your Aurora ERP+POS subscription has been renewed successfully for LKR 5,000.00.', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), read: true, priority: 'low' },
];


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>(MOCK_NOTIFICATIONS.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  // FIX: Changed notificationId to be a string.
  markAsRead(notificationId: string) {
    this.notifications.update(notifications => 
      notifications.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }

  markAllAsRead() {
    this.notifications.update(notifications => 
      notifications.map(n => ({ ...n, read: true }))
    );
  }
}
