import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingCardComponent } from '../../components/setting-card/setting-card.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-inventory-settings',
  standalone: true,
  imports: [CommonModule, SettingCardComponent],
  template: `
    <section class="animate-slide-in-spring">
      <h3 class="text-2xl font-bold text-brand-text mb-1">Inventory & Purchasing</h3>
      <p class="text-charcoal-400 mb-6">Configure inventory tracking and purchasing workflows.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (setting of settings(); track setting.key) {
          <app-setting-card [id]="'setting-' + setting.key" [setting]="setting"></app-setting-card>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySettingsComponent {
  private settingsService = inject(SettingsService);
  private allSettings = this.settingsService.registry;
  settings = computed(() => 
    this.allSettings.filter(s => s.section === 'Inventory & Purchasing')
  );
}
