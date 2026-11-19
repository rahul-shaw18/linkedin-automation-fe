import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
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
import { EditPostDialogComponent } from '../edit-post-dialog/edit-post-dialog.component';

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
    EditPostDialogComponent,
  ],
  templateUrl: './post-card.component.html',
})
export class PostCardComponent {
  readonly post = input.required<ScheduledPost>();
  readonly state = inject(SchedulerService);
  private readonly toast = inject(RdxToastManager);
  private readonly clipboard = inject(Clipboard);

  readonly isEditDialogOpen = signal<boolean>(false);
  readonly isDeleteDialogOpen = signal<boolean>(false);

  readonly deleteDialogTitle = computed(() => {
    if (this.post().status === 'PUBLISHED') {
      return 'Delete post from LinkedIn?';
    }
    if (this.post().status === 'PENDING') {
      return 'Delete scheduled post?';
    }
    return 'Delete failed post?';
  });

  readonly deleteDialogDescription = computed(() => {
    if (this.post().status === 'PUBLISHED') {
      return 'This post will be permanently deleted from LinkedIn and removed from your database. This action cannot be undone.';
    }
    if (this.post().status === 'PENDING') {
      return 'This post will be removed from your execution queue and will not be published to LinkedIn.';
    }
    return 'This post will be permanently removed from your history.';
  });

  readonly deleteConfirmText = computed(() => {
    if (this.post().status === 'PUBLISHED') {
      return 'Yes, Delete from LinkedIn';
    }
    return 'Yes, Delete Post';
  });

  openEdit(): void {
    this.isEditDialogOpen.set(true);
  }

  openDelete(): void {
    this.isDeleteDialogOpen.set(true);
  }

  onDeleteConfirmed(): void {
    const isPublished = this.post().status === 'PUBLISHED';
    this.state.deletePost(this.post().id, isPublished);
  }

  onRetry(): void {
    this.state.retryPost(this.post().id);
  }

  copyToClipboard(text: string, label: string): void {
    const isSuccess = this.clipboard.copy(text);
    if (isSuccess) {
      this.toast.add({
        type: 'success',
        title: 'Copied to Clipboard',
        description: `${label} copied to clipboard`,
        timeout: 2500,
      });
    } else {
      this.toast.add({
        type: 'error',
        title: 'Copy Failed',
        description: `Could not copy ${label.toLowerCase()} to clipboard`,
        timeout: 3000,
      });
    }
  }
}
