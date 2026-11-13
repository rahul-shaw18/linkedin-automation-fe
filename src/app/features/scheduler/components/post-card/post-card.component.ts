import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  RdxMenuRoot,
  RdxMenuTrigger,
  RdxMenuPortal,
  RdxMenuPositioner,
  RdxMenuItem,
  RdxMenuSeparator,
} from '@radix-ng/primitives/menu';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { ScheduledPost } from '../../../../core/models/linkedin.model';
import { SchedulerService } from '../../services/scheduler.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { PostStatusBadgeComponent } from '../../../../shared/components/ui/post-status-badge/post-status-badge.component';

@Component({
  selector: 'app-post-card',
  imports: [
    DatePipe,
    RdxMenuRoot,
    RdxMenuTrigger,
    RdxMenuPortal,
    RdxMenuPositioner,
    RdxMenuItem,
    RdxMenuSeparator,
    ButtonComponent,
    ConfirmDialogComponent,
    IconComponent,
    PostStatusBadgeComponent,
  ],
  templateUrl: './post-card.component.html',
})
export class PostCardComponent {
  readonly post = input.required<ScheduledPost>();
  readonly state = inject(SchedulerService);
  private readonly toast = inject(RdxToastManager);

  onCancel(): void {
    this.state.cancelPost(this.post().id);
  }

  onRetry(): void {
    this.state.retryPost(this.post().id);
  }

  async copyToClipboard(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.toast.add({
        type: 'success',
        title: 'Copied to Clipboard',
        description: `${label} copied to clipboard`,
        timeout: 2500,
      });
    } catch {
      this.toast.add({
        type: 'error',
        title: 'Copy Failed',
        description: `Could not copy ${label.toLowerCase()} to clipboard`,
        timeout: 3000,
      });
    }
  }
}
