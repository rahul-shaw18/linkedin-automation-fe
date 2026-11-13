import { Component, inject } from '@angular/core';
import {
  RdxToastPortal,
  RdxToastViewport,
  RdxToastRoot,
  RdxToastContent,
  RdxToastTitle,
  RdxToastDescription,
  RdxToastAction,
  RdxToastClose,
  RdxToastManager,
  RdxToastObject,
} from '@radix-ng/primitives/toast';
import { IconComponent } from '../ui/icon/icon.component';

@Component({
  selector: 'app-toast',
  imports: [
    RdxToastPortal,
    RdxToastViewport,
    RdxToastRoot,
    RdxToastContent,
    RdxToastTitle,
    RdxToastDescription,
    RdxToastAction,
    RdxToastClose,
    IconComponent,
  ],
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  readonly toastManager = inject(RdxToastManager);

  runAction(toast: RdxToastObject, event: MouseEvent): void {
    toast.actionProps?.onClick?.(event);
    this.toastManager.close(toast.id);
  }
}
