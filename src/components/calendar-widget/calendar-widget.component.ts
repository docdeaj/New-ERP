import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class CalendarWidgetComponent {
  
  currentDate = signal(new Date());
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthDisplay = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  calendarGrid = computed<CalendarDay[]>(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
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
      });
    }
    return grid;
  });

  changeMonth(delta: number) {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  }
}