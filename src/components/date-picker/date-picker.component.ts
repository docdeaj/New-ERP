import { Component, ChangeDetectionStrategy, forwardRef, inject, input, signal, computed, ElementRef, viewChild, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateString: string;
}

type PickerValue = string | { start: string | null; end: string | null } | null;

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './date-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class DatePickerComponent implements ControlValueAccessor {
  private el = inject(ElementRef);

  // --- Inputs ---
  mode = input<'single' | 'range'>('single');
  label = input<string>('');
  placeholder = input('Select date');
  
  // --- Internal State ---
  isOpen = signal(false);
  viewDate = signal(new Date()); 
  
  // --- CVA State ---
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  
  onChange: (value: PickerValue) => void = () => {};
  onTouched: () => void = () => {};

  // --- Computed State ---
  displayValue = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const pipe = new DatePipe('en-US');
    const format = 'MMM d, y';

    if (this.mode() === 'single' && start) {
      return pipe.transform(start, format);
    }
    if (this.mode() === 'range') {
      if (start && end) {
        return `${pipe.transform(start, format)} - ${pipe.transform(end, format)}`;
      }
      if (start) {
        return pipe.transform(start, format);
      }
    }
    return this.placeholder();
  });

  monthDisplay = computed(() => this.viewDate().toLocaleString('default', { month: 'long', year: 'numeric' }));
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarGrid = computed<CalendarDay[]>(() => {
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const grid: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      grid.push({
        date: day,
        dayOfMonth: day.getDate(),
        isCurrentMonth: day.getMonth() === month,
        isToday: day.getTime() === today.getTime(),
        dateString: this.formatDate(day)
      });
    }
    return grid;
  });
  
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  // --- CVA Methods ---
  writeValue(value: PickerValue): void {
    if (this.mode() === 'single' && typeof value === 'string') {
      this.startDate.set(this.parseDate(value));
      this.endDate.set(null);
    } else if (this.mode() === 'range' && value && typeof value === 'object') {
      this.startDate.set(this.parseDate(value.start));
      this.endDate.set(this.parseDate(value.end));
    } else {
      this.startDate.set(null);
      this.endDate.set(null);
    }
    // Set view to the selected date if available
    if(this.startDate()) {
      this.viewDate.set(this.startDate()!);
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  // --- Component Methods ---
  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  changeMonth(delta: number) {
    this.viewDate.update(d => {
      const newDate = new Date(d);
      newDate.setDate(1); // Avoids issues with end of month
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  }

  selectDay(day: CalendarDay) {
    if (this.mode() === 'single') {
      this.startDate.set(day.date);
      this.endDate.set(null);
      this.onChange(day.dateString);
      this.isOpen.set(false);
    } else { // 'range' mode
      const start = this.startDate();
      const end = this.endDate();
      
      if (!start || end) { // No start date, or range is complete, so start a new range
        this.startDate.set(day.date);
        this.endDate.set(null);
      } else { // Start date is set, but no end date
        if (day.date < start) {
          this.startDate.set(day.date);
        } else {
          this.endDate.set(day.date);
          this.onChange({ start: this.formatDate(this.startDate()), end: this.formatDate(this.endDate()) });
          this.isOpen.set(false);
        }
      }
    }
    this.onTouched();
  }
  
  clear() {
    this.startDate.set(null);
    this.endDate.set(null);
    this.onChange(this.mode() === 'single' ? null : { start: null, end: null });
    this.onTouched();
  }

  setToday() {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (this.mode() === 'single') {
      this.startDate.set(today);
      this.endDate.set(null);
      this.onChange(this.formatDate(today));
      this.isOpen.set(false);
    } else {
      // For range, setting today just moves the view
      this.viewDate.set(today);
    }
     this.onTouched();
  }
  
  // --- Helpers for Styling ---
  isDaySelected(day: CalendarDay): boolean {
    const start = this.startDate();
    const end = this.endDate();
    if (!start) return false;
    if (this.mode() === 'single') {
      return day.date.getTime() === start.getTime();
    }
    // For range, 'selected' means it's the start or end point
    const isStart = day.date.getTime() === start.getTime();
    const isEnd = end && day.date.getTime() === end.getTime();
    return isStart || !!isEnd;
  }
  
  isDayInRange(day: CalendarDay): boolean {
    if (this.mode() !== 'range') return false;
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return false;
    return day.date > start && day.date < end;
  }

  isRangeStart(day: CalendarDay): boolean {
    if (this.mode() !== 'range' || !this.startDate()) return false;
    return day.date.getTime() === this.startDate()!.getTime();
  }
  
  isRangeEnd(day: CalendarDay): boolean {
    if (this.mode() !== 'range' || !this.endDate()) return false;
    return day.date.getTime() === this.endDate()!.getTime();
  }
  
  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  }

  private parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // Adjust for timezone offset by creating date from UTC parts
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
}
