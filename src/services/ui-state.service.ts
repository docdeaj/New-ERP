import { Injectable, signal } from '@angular/core';

export type DrawerContext = 
  | 'new-invoice' 
  | 'new-expense' 
  | 'new-po' 
  | 'new-contact' 
  | 'record-sale' 
  | 'record-payment'
  | 'new-quotation'
  | 'new-receipt'
  | 'new-product'
  | 'new-cheque';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  isSidebarCollapsed = signal(false);
  isSearchOpen = signal(false);
  
  // Drawer State
  isDrawerOpen = signal(false);
  drawerContext = signal<DrawerContext | null>(null);
  drawerData = signal<any | null>(null); // To pass data to the drawer
  
  // Signal to trigger data table search from anywhere
  dataTableSearchTrigger = signal<string | null>(null);

  openDrawer(context: DrawerContext, data: any = null) {
    this.drawerContext.set(context);
    this.drawerData.set(data);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    // Optional: delay clearing context for exit animations
    setTimeout(() => {
      this.drawerContext.set(null);
      this.drawerData.set(null);
    }, 300);
  }
}