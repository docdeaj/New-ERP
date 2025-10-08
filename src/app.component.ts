
import { Component, ChangeDetectionStrategy, signal, effect, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { UniversalSearchComponent } from './components/universal-search/universal-search.component';
import { UniversalAddDrawerComponent } from './components/universal-add-drawer/universal-add-drawer.component';
import { UiStateService, DrawerContext } from './services/ui-state.service';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { DocumentPreviewModalComponent } from './components/document-preview-modal/document-preview-modal.component';
import { Invoice, Quotation, PurchaseOrder, Receipt } from './models/types';
import { NotificationsDropdownComponent } from './components/notifications-dropdown/notifications-dropdown.component';

type PrintableDocument = Invoice | Quotation | PurchaseOrder | Receipt;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    UniversalSearchComponent,
    UniversalAddDrawerComponent,
    ConfirmationModalComponent,
    DocumentPreviewModalComponent,
    NotificationsDropdownComponent,
  ],
  host: {
    '(window:keydown)': 'handleKeyboardEvent($event)',
  }
})
export class AppComponent {
  uiStateService = inject(UiStateService);
  isSidebarCollapsed = this.uiStateService.isSidebarCollapsed;
  isSearchOpen = this.uiStateService.isSearchOpen;
  isNotificationsOpen = this.uiStateService.isNotificationsOpen;
  isDrawerOpen = this.uiStateService.isDrawerOpen;
  drawerContext = this.uiStateService.drawerContext;
  confirmationState = this.uiStateService.confirmationState;
  documentPreviewState = this.uiStateService.documentPreviewState;
  progressState = this.uiStateService.progressState;
  
  mainContentMargin = computed(() => this.isSidebarCollapsed() ? 'ml-[calc(5rem+20px)] mr-2.5' : 'ml-[calc(16rem+20px)] mr-2.5');

  constructor() {
    effect(() => {
      if (this.isSearchOpen() || this.isDrawerOpen() || this.confirmationState() || this.documentPreviewState() || this.isNotificationsOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  closeSearch() {
    this.isSearchOpen.set(false);
  }
  
  closeDrawer() {
    this.uiStateService.closeDrawer();
  }

  onConfirm() {
    const state = this.confirmationState();
    if (state) {
      state.onConfirm();
      this.uiStateService.hideConfirmation();
    }
  }

  onCancel() {
    this.uiStateService.hideConfirmation();
  }
  
  onCloseDocumentPreview() {
    this.uiStateService.hideDocumentPreview();
  }
  
  onEditDocument(doc: PrintableDocument) {
    this.uiStateService.hideDocumentPreview();
    let context: DrawerContext | null = null;

    if ('invoiceNumber' in doc && 'dueDate' in doc) {
      context = 'new-invoice';
    } else if ('quotationNumber' in doc) {
      context = 'new-quotation';
    } else if ('poNumber' in doc) {
      context = 'new-po';
    } else if ('receiptNumber' in doc) {
      // Per spec, receipts are not editable.
      console.log('Editing receipts is not supported.');
      return; 
    }
    
    if (context) {
      this.uiStateService.openDrawer(context, doc);
    }
  }

  handleKeyboardEvent(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isTypingInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    if (event.key === 'Escape') {
      if (this.progressState()?.cancellable) {
        this.uiStateService.cancelProgress();
        return;
      }
      if (this.documentPreviewState()) {
        this.onCloseDocumentPreview();
        return;
      }
      if (this.confirmationState()) {
        this.onCancel();
        return;
      }
      if (this.isNotificationsOpen()) {
        this.isNotificationsOpen.set(false);
        return;
      }
      if (this.isDrawerOpen()) {
        this.closeDrawer();
        return;
      }
       if (this.isSearchOpen()) {
        this.closeSearch();
        return;
      }
    }
    
    // Universal Search Hotkeys
    if (((event.metaKey || event.ctrlKey) && event.key === 'k') || (event.key === '/' && !isTypingInInput)) {
       if (!this.isDrawerOpen()) {
         event.preventDefault();
         this.isSearchOpen.set(true);
       }
    }

    // Data Table "Search on keypress"
    if (!isTypingInInput && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
       if (!this.isSearchOpen() && !this.isDrawerOpen()) {
         this.uiStateService.dataTableSearchTrigger.set(event.key);
       }
    }
  }
}
