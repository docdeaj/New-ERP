
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SettingsSearchComponent } from '../../components/settings-search/settings-search.component';
import { SettingsService } from '../../services/settings.service';
import { SettingDefinition } from '../../data/settings.registry';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SettingsSearchComponent],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  allSettings = signal<SettingDefinition[]>(this.settingsService.registry);

  navLinks = computed<NavLink[]>(() => {
    const sectionToIcon: Record<string, string> = {
        'Organization': 'fa-solid fa-building',
        'Auth & Security': 'fa-solid fa-shield-halved',
        'Regional & Tax': 'fa-solid fa-landmark',
        'POS': 'fa-solid fa-cash-register',
        'Sales & Invoices': 'fa-solid fa-file-invoice-dollar',
        'Inventory & Purchasing': 'fa-solid fa-boxes-stacked',
        'Appearance': 'fa-solid fa-palette'
    };

// FIX: Explicitly type the sort function parameters as string to resolve `unknown` type error.
    const sections = [...new Set(this.allSettings().map(s => s.section))].sort((a: string, b: string) => a.localeCompare(b));
    
    const links: NavLink[] = [];
    if (sections.includes('Organization') || sections.includes('Regional & Tax')) {
        links.push({ path: 'organization', label: 'Organization', icon: sectionToIcon['Organization'] });
    }
    if (sections.includes('Auth & Security')) {
        links.push({ path: 'security', label: 'Security', icon: sectionToIcon['Auth & Security'] });
    }
    if (sections.includes('POS')) {
        links.push({ path: 'pos', label: 'POS', icon: sectionToIcon['POS'] });
    }
    if (sections.includes('Sales & Invoices')) {
        links.push({ path: 'sales', label: 'Sales', icon: sectionToIcon['Sales & Invoices'] });
    }
    if (sections.includes('Inventory & Purchasing')) {
        links.push({ path: 'inventory', label: 'Inventory', icon: sectionToIcon['Inventory & Purchasing'] });
    }
    if (sections.includes('Appearance')) {
        links.push({ path: 'appearance', label: 'Appearance', icon: sectionToIcon['Appearance'] });
    }
    
    return links;
  });

  handleJumpToSetting(key: string) {
    const setting = this.allSettings().find(s => s.key === key);
    if (!setting) return;
    
    const sectionPathMap: Record<string, string> = {
      'Organization': 'organization',
      'Regional & Tax': 'organization',
      'Auth & Security': 'security',
      'POS': 'pos',
      'Sales & Invoices': 'sales',
      'Inventory & Purchasing': 'inventory',
      'Appearance': 'appearance'
    };

    const path = sectionPathMap[setting.section];
    if (path) {
      this.router.navigate(['/settings', path]).then(() => {
        // Add a temporary highlight to the card
        setTimeout(() => {
          const element = document.getElementById(`setting-${setting.key}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('setting-highlight');
            setTimeout(() => element.classList.remove('setting-highlight'), 2500);
          }
        }, 100); // wait for navigation and rendering
      });
    }
  }
}