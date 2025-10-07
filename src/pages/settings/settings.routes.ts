import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'organization', pathMatch: 'full' },
      { 
        path: 'organization', 
        loadComponent: () => import('./organization-settings.component').then(m => m.OrganizationSettingsComponent),
        title: 'Organization Settings'
      },
      { 
        path: 'security', 
        loadComponent: () => import('./security-settings.component').then(m => m.SecuritySettingsComponent),
        title: 'Security Settings'
      },
      { 
        path: 'pos', 
        loadComponent: () => import('./pos-settings.component').then(m => m.PosSettingsComponent),
        title: 'POS Settings'
      },
      { 
        path: 'sales', 
        loadComponent: () => import('./sales-settings.component').then(m => m.SalesSettingsComponent),
        title: 'Sales & Invoices Settings'
      },
      { 
        path: 'inventory', 
        loadComponent: () => import('./inventory-settings.component').then(m => m.InventorySettingsComponent),
        title: 'Inventory Settings'
      },
      { 
        path: 'appearance', 
        loadComponent: () => import('./appearance-settings.component').then(m => m.AppearanceSettingsComponent),
        title: 'Appearance Settings'
      }
    ]
  }
];
