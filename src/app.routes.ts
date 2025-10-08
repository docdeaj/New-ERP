

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
import { ReportBuilderComponent } from './pages/reports/report-builder.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { LogsComponent } from './pages/logs/logs.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { SignupComponent } from './pages/signup/signup.component';


export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'signup', component: SignupComponent, title: 'Sign Up' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard', canActivate: [authGuard] },
  { path: 'pos', component: PosComponent, title: 'Point of Sale', canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesComponent, title: 'Expenses', canActivate: [authGuard] },
  { path: 'invoices', component: InvoicesComponent, title: 'Invoices', canActivate: [authGuard] },
  { path: 'payment-workspace/:invoiceId', component: PaymentWorkspaceComponent, title: 'Payment Workspace', canActivate: [authGuard] },
  { path: 'quotations', component: QuotationsComponent, title: 'Quotations', canActivate: [authGuard] },
  { path: 'receipts', component: ReceiptsComponent, title: 'Receipts', canActivate: [authGuard] },
  { path: 'cheques', component: ChequesComponent, title: 'Cheques', canActivate: [authGuard] },
  { path: 'purchase-orders', component: PurchaseOrdersComponent, title: 'Purchase Orders', canActivate: [authGuard] },
  { path: 'inventory', component: InventoryComponent, title: 'Inventory', canActivate: [authGuard] },
  { path: 'contacts', component: ContactsComponent, title: 'Contacts', canActivate: [authGuard] },
  { path: 'media', component: MediaLibraryComponent, title: 'Media Library', canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, title: 'Reports', canActivate: [authGuard] },
  { path: 'reports/builder', component: ReportBuilderComponent, title: 'Report Builder', canActivate: [authGuard] },
  { path: 'reports/builder/:id', component: ReportBuilderComponent, title: 'Report Builder', canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, title: 'Notifications', canActivate: [authGuard] },
  { path: 'logs', component: LogsComponent, title: 'Logs', canActivate: [authGuard] },
  { 
    path: 'settings', 
    title: 'Settings',
    loadChildren: () => import('./pages/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
    canActivate: [authGuard] 
  },
  { path: 'recurring', component: RecurringExpensesComponent, title: 'Recurring Expenses', canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' } 
];