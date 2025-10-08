import { Injectable, signal } from '@angular/core';
import { PrintableDocument } from '../models/types';

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
  | 'new-cheque'
  | 'new-recurring-expense';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  isSidebarCollapsed = signal(false);
  isSearchOpen = signal(false);
  isNotificationsOpen = signal(false);
  isShortcutsOpen = signal(false);
  
  // Drawer State
  isDrawerOpen = signal(false);
  drawerContext = signal<DrawerContext | null>(null);
  drawerData = signal<any | null>(null); // To pass data to the drawer
  
  // Signal to trigger data table search from anywhere
  dataTableSearchTrigger = signal<string | null>(null);

  // Confirmation Modal State
  confirmationState = signal<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Document Preview Modal State
  documentPreviewState = signal<{ document: PrintableDocument } | null>(null);

  // Progress Indicator State
  progressState = signal<{
    title: string;
    progress: number;
    total: number;
    cancellable: boolean;
    isCancelled: boolean;
  } | null>(null);


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

  showConfirmation(title: string, message: string, onConfirm: () => void) {
    this.confirmationState.set({ title, message, onConfirm });
  }

  hideConfirmation() {
    this.confirmationState.set(null);
  }

  showDocumentPreview(document: PrintableDocument) {
    this.documentPreviewState.set({ document });
  }

  hideDocumentPreview() {
    this.documentPreviewState.set(null);
  }

  showProgress(title: string, total: number, cancellable: boolean = false) {
    this.progressState.set({ title, progress: 0, total, cancellable, isCancelled: false });
  }

  updateProgress(progress: number) {
    this.progressState.update(state => state ? { ...state, progress } : null);
  }
  
  hideProgress() {
    this.progressState.set(null);
  }
  
  cancelProgress() {
    this.progressState.update(state => state ? { ...state, isCancelled: true } : null);
  }

  toggleShortcuts(force?: boolean) {
    if (typeof force === 'boolean') {
      this.isShortcutsOpen.set(force);
    } else {
      this.isShortcutsOpen.update(v => !v);
    }
  }
}