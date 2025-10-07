import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingCardComponent } from '../../components/setting-card/setting-card.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [CommonModule, SettingCardComponent],
  template: `
    <div class="space-y-10 animate-slide-in-spring">
      @if (organizationSettings().length > 0) {
        <section>
          <h3 class="text-2xl font-bold text-brand-text mb-1">Organization</h3>
          <p class="text-charcoal-400 mb-6">Manage general settings for your business.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (setting of organizationSettings(); track setting.key) {
              <app-setting-card [id]="'setting-' + setting.key" [setting]="setting"></app-setting-card>
            }
          </div>
        </section>
      }
      @if (taxSettings().length > 0) {
        <section>
          <h3 class="text-2xl font-bold text-brand-text mb-1">Regional & Tax</h3>
          <p class="text-charcoal-400 mb-6">Configure tax rates and regional defaults.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (setting of taxSettings(); track setting.key) {
              <app-setting-card [id]="'setting-' + setting.key" [setting]="setting"></app-setting-card>
            }
          </div>
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSettingsComponent {
  private settingsService = inject(SettingsService);

  private allSettings = this.settingsService.registry;

  organizationSettings = computed(() => 
    this.allSettings.filter(s => s.section === 'Organization')
  );
  
  taxSettings = computed(() => 
    this.allSettings.filter(s => s.section === 'Regional & Tax')
  );
}
