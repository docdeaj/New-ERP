import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class SidebarComponent {
  isCollapsed = input.required<boolean>();
  toggleCollapse = output<void>();

  navItems: NavItem[] = [
    { path: '/dashboard', icon: 'fa-solid fa-chart-pie', label: 'Dashboard' },
    { path: '/pos', icon: 'fa-solid fa-cash-register', label: 'POS' },
    { path: '/invoices', icon: 'fa-solid fa-file-invoice-dollar', label: 'Invoices' },
    { path: '/expenses', icon: 'fa-solid fa-money-bill-wave', label: 'Expenses' },
    { path: '/recurring', icon: 'fa-solid fa-sync', label: 'Recurring' },
    { path: '/purchase-orders', icon: 'fa-solid fa-cart-shopping', label: 'Purchasing' },
    { path: '/inventory', icon: 'fa-solid fa-boxes-stacked', label: 'Inventory' },
    { path: '/contacts', icon: 'fa-solid fa-address-book', label: 'Contacts' },
    { path: '/reports', icon: 'fa-solid fa-chart-simple', label: 'Reports' },
    { path: '/media', icon: 'fa-solid fa-photo-film', label: 'Media' },
    { path: '/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
  ];

  onToggleCollapse() {
    this.toggleCollapse.emit();
  }
}