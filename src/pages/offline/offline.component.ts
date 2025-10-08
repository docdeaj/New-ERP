import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent implements OnInit, OnDestroy {
  private intervalId: number | null = null;
  private readonly RETRY_INTERVAL = 5000; // 5 seconds
  countdown = signal(this.RETRY_INTERVAL / 1000);

  ngOnInit() {
    this.startAutoRetry();
  }

  ngOnDestroy() {
    this.stopAutoRetry();
  }

  private startAutoRetry() {
    this.stopAutoRetry(); // Ensure no multiple intervals are running
    this.intervalId = window.setInterval(() => {
      this.countdown.update(c => (c <= 1 ? this.RETRY_INTERVAL / 1000 : c - 1));
      if (navigator.onLine) {
        this.retryConnection();
      }
    }, 1000);
  }

  private stopAutoRetry() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  retryConnection() {
    this.stopAutoRetry();
    window.location.reload();
  }
}
