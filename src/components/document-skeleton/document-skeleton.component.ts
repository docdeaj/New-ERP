import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-skeleton.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentSkeletonComponent {}
