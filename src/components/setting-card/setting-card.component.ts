
import { Component, ChangeDetectionStrategy, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { SettingDefinition } from '../../data/settings.registry';
import { SettingsService } from '../../services/settings.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-setting-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setting-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingCardComponent implements OnInit {
  setting = input.required<SettingDefinition>();
  private settingsService = inject(SettingsService);
  
  control = new FormControl();

  ngOnInit() {
    // Set initial value from service
    const initialValue = this.settingsService.get(this.setting().key)();
    this.control.setValue(initialValue, { emitEvent: false });

    // Listen for changes and autosave
    this.control.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      // For number inputs, ensure we save a number
      const valueToSave = this.setting().type === 'number' ? Number(value) : value;
      this.settingsService.set(this.setting().key, valueToSave);
      // Here you could add a "saved" indicator animation
    });
  }

  resetToDefault() {
    const defaultValue = this.setting().default;
    this.control.setValue(defaultValue);
  }
}
