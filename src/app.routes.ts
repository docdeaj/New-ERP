import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { PosComponent } from './pages/pos/pos.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { MediaLibraryComponent } from './pages/media-library/media-library.component';
import { QuotationsComponent } from './pages/quotations/quotations.component';
import { ReceiptsComponent } from './pages/receipts/receipts.component';
import { ChequesComponent } from './pages/cheques/cheques.component';
import { PurchaseOrdersComponent } from './pages/purchase-orders/purchase-orders.component';
import { ContactsComponent } from './pages/contacts/contacts.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { PlaceholderComponent } from './pages/placeholder.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { PaymentWorkspaceComponent } from './pages/payment-workspace/payment-workspace.component';
import { RecurringExpensesComponent } from './pages/recurring-expenses/recurring-expenses.component';


export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard' },
  { path: 'pos', component: PosComponent, title: 'Point of Sale' },
  { path: 'expenses', component: ExpensesComponent, title: 'Expenses' },
  { path: 'invoices', component: InvoicesComponent, title: 'Invoices' },
  { path: 'payment-workspace/:invoiceId', component: PaymentWorkspaceComponent, title: 'Payment Workspace' },
  { path: 'quotations', component: QuotationsComponent, title: 'Quotations' },
  { path: 'receipts', component: ReceiptsComponent, title: 'Receipts' },
  { path: 'cheques', component: ChequesComponent, title: 'Cheques' },
  { path: 'purchase-orders', component: PurchaseOrdersComponent, title: 'Purchase Orders' },
  { path: 'inventory', component: InventoryComponent, title: 'Inventory' },
  { path: 'contacts', component: ContactsComponent, title: 'Contacts' },
  { path: 'media', component: MediaLibraryComponent, title: 'Media Library' },
  { path: 'reports', component: ReportsComponent, title: 'Reports' },
  { path: 'settings', component: PlaceholderComponent, title: 'Settings' },
  { path: 'recurring', component: RecurringExpensesComponent, title: 'Recurring Expenses' },
  { path: '**', redirectTo: 'dashboard' } 
];