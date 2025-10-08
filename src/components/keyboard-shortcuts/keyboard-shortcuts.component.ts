import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';

interface Shortcut {
  keys: string[];
  description: string;
}

@Component({
  selector: 'app-keyboard-shortcuts',
  standalone: true,
  imports: [CommonModule, CdkTrapFocus],
  templateUrl: './keyboard-shortcuts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardShortcutsComponent {
  close = output<void>();

  globalShortcuts: Shortcut[] = [
    { keys: ['?', 'Shift+/'], description: 'Open this shortcuts menu' },
    { keys: ['esc'], description: 'Close any open modal, drawer, or dropdown' },
  ];
  
  navigationShortcuts: Shortcut[] = [
    { keys: ['Cmd/Ctrl', 'K'], description: 'Open Universal Search' },
    { keys: ['/'], description: 'Open Universal Search (when not typing)' },
  ];

  onClose() {
    this.close.emit();
  }
}