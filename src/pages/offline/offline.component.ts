import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {
  retryConnection() {
    window.location.reload();
  }
}