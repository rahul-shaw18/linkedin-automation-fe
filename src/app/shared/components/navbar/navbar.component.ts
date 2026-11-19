import { Component, inject, signal } from '@angular/core';
import {
  RdxAvatarRootDirective,
  RdxAvatarFallbackDirective,
} from '@radix-ng/primitives/avatar';
import {
  RdxMenuRoot,
  RdxMenuTrigger,
  RdxMenuPortal,
  RdxMenuPositioner,
  RdxMenuPopup,
  RdxMenuItem,
  RdxMenuSeparator,
} from '@radix-ng/primitives/menu';
import {
  RdxAlertDialogRoot,
  RdxAlertDialogPortal,
  RdxAlertDialogBackdrop,
  RdxAlertDialogPopup,
  RdxAlertDialogTitle,
  RdxAlertDialogDescription,
} from '@radix-ng/primitives/alert-dialog';
import { SchedulerService } from '../../../features/scheduler/services/scheduler.service';
import { ButtonComponent } from '../ui/button/button.component';
import { IconComponent } from '../ui/icon/icon.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RdxAvatarRootDirective,
    RdxAvatarFallbackDirective,
    RdxMenuRoot,
    RdxMenuTrigger,
    RdxMenuPortal,
    RdxMenuPositioner,
    RdxMenuPopup,
    RdxMenuItem,
    RdxMenuSeparator,
    RdxAlertDialogRoot,
    RdxAlertDialogPortal,
    RdxAlertDialogBackdrop,
    RdxAlertDialogPopup,
    RdxAlertDialogTitle,
    RdxAlertDialogDescription,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly state = inject(SchedulerService);
  readonly disconnectDialogOpen = signal<boolean>(false);

  onConnectLinkedIn(): void {
    this.state.connectLinkedIn();
  }

  confirmDisconnect(): void {
    const account = this.state.activeAccount();
    if (account) {
      this.state.disconnectAccount(account.id);
    }
    this.disconnectDialogOpen.set(false);
  }
}
