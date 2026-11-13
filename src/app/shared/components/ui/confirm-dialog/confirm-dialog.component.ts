import { Component, input, output } from '@angular/core';
import {
  RdxAlertDialogRoot,
  RdxAlertDialogTrigger,
  RdxAlertDialogPortal,
  RdxAlertDialogBackdrop,
  RdxAlertDialogPopup,
  RdxAlertDialogTitle,
  RdxAlertDialogDescription,
  RdxAlertDialogClose,
} from '@radix-ng/primitives/alert-dialog';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  imports: [
    RdxAlertDialogRoot,
    RdxAlertDialogTrigger,
    RdxAlertDialogPortal,
    RdxAlertDialogBackdrop,
    RdxAlertDialogPopup,
    RdxAlertDialogTitle,
    RdxAlertDialogDescription,
    RdxAlertDialogClose,
    ButtonComponent,
  ],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly confirmVariant = input<'destructive' | 'primary'>('destructive');

  readonly confirmed = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }
}
