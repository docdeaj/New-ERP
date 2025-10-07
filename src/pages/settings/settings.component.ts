
import { Component, ChangeDetectionStrategy, inject, signal, computed, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { SettingDefinition } from '../../data/settings.registry';
import { SettingsSearchComponent } from '../../components/settings-search/settings-search.component';
import { SettingCardComponent } from '../../components/setting-card/setting-card.component';

interface SettingsGroup {
  section: string;
  settings: SettingDefinition[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, SettingsSearchComponent, SettingCardComponent],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  contentArea = viewChild<ElementRef<HTMLDivElement>>('contentArea');

  allSettings = signal<SettingDefinition[]>(this.settingsService.registry);

  groupedSettings = computed<SettingsGroup[]>(() => {
    const registry = this.allSettings();
    const groups = new Map<string, SettingDefinition[]>();
    
    for (const setting of registry) {
      if (!groups.has(setting.section)) {
        groups.set(setting.section, []);
      }
      groups.get(setting.section)!.push(setting);
    }
    
    // Sort sections alphabetically for consistent order
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    return sortedGroups.map(([section, settings]) => ({ section, settings }));
  });

  sections = computed(() => this.groupedSettings().map(g => g.section));
  
  activeSection = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
        this.activeSection.set(this.sections()[0] ?? null);
    });
  }

  scrollToSection(sectionId: string, event?: MouseEvent) {
    event?.preventDefault();
    const element = document.getElementById(this.getSectionId(sectionId));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection.set(sectionId);
    }
  }

  handleJumpToSetting(key: string) {
    const setting = this.allSettings().find(s => s.key === key);
    if (!setting) return;
    
    this.scrollToSection(setting.section);

    // Add a temporary highlight to the card
    setTimeout(() => {
       const element = document.getElementById(this.getSettingId(key));
       if (element) {
         element.classList.add('setting-highlight');
         setTimeout(() => element.classList.remove('setting-highlight'), 2000);
       }
    }, 300); // wait for scroll to finish
  }

  // Helper to create safe IDs for DOM elements
  getSectionId(section: string): string {
    return `section-${section.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }
  getSettingId(key: string): string {
    return `setting-${key}`;
  }
}
