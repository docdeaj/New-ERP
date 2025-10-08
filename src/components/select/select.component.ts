import { Component, ChangeDetectionStrategy, forwardRef, input, signal, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class SelectComponent implements ControlValueAccessor {
  private el = inject(ElementRef);
  
  options = input.required<{ value: string; label: string }[]>();
  placeholder = input('Select an option');
  
  isOpen = signal(false);
  selectedValue: string | null = null;
  
  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  get selectedLabel(): string {
    const selected = this.options().find(opt => opt.value === this.selectedValue);
    return selected ? selected.label : this.placeholder();
  }
  
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  writeValue(value: string): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  selectOption(value: string) {
    this.selectedValue = value;
    this.onChange(value);
    this.onTouched();
    this.isOpen.set(false);
  }
}