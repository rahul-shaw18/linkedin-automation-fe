import { Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  form,
  FormField,
  required,
  maxLength,
  validate,
} from '@angular/forms/signals';
import {
  RdxDialogRoot,
  RdxDialogPortal,
  RdxDialogBackdrop,
  RdxDialogPopup,
  RdxDialogTitle,
  RdxDialogDescription,
  RdxDialogClose,
} from '@radix-ng/primitives/dialog';
import { ScheduledPost, UpdatePostRequest } from '../../../../core/models/linkedin.model';
import { SchedulerService } from '../../services/scheduler.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { ProgressComponent } from '../../../../shared/components/ui/progress/progress.component';
import { PostStatusBadgeComponent } from '../../../../shared/components/ui/post-status-badge/post-status-badge.component';

export interface EditPostFormModel {
  content: string;
  scheduledTime: string;
}

function toLocalDatetimeInput(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-edit-post-dialog',
  imports: [
    DatePipe,
    FormField,
    RdxDialogRoot,
    RdxDialogPortal,
    RdxDialogBackdrop,
    RdxDialogPopup,
    RdxDialogTitle,
    RdxDialogDescription,
    RdxDialogClose,
    ButtonComponent,
    IconComponent,
    ProgressComponent,
    PostStatusBadgeComponent,
  ],
  templateUrl: './edit-post-dialog.component.html',
})
export class EditPostDialogComponent {
  readonly post = input.required<ScheduledPost>();
  readonly open = model<boolean>(false);

  readonly state = inject(SchedulerService);

  // Synchronized form model using linkedSignal (avoids anti-pattern effects)
  protected readonly editModel = linkedSignal<
    { post: ScheduledPost; open: boolean },
    EditPostFormModel
  >({
    source: () => ({ post: this.post(), open: this.open() }),
    computation: ({ post }) => ({
      content: post.content ?? '',
      scheduledTime: toLocalDatetimeInput(post.scheduledTime),
    }),
  });

  // Angular 22 Signal Forms schema and validation
  protected readonly editForm = form(this.editModel, (s) => {
    required(s.content, { message: 'Post content is required.' });
    maxLength(s.content, 3000, { message: 'Post cannot exceed 3,000 characters.' });

    validate(s.content, ({ value }) => {
      if (value().trim().length === 0) {
        return { kind: 'empty', message: 'Post content cannot be empty.' };
      }
      return undefined;
    });

    validate(s.scheduledTime, ({ value }) => {
      if (this.post().status !== 'PUBLISHED') {
        const timeVal = value();
        if (!timeVal) {
          return { kind: 'requiredTime', message: 'Scheduled date and time is required.' };
        }
        const d = new Date(timeVal);
        if (isNaN(d.getTime())) {
          return { kind: 'invalidTime', message: 'Invalid scheduled date and time.' };
        }
      }
      return undefined;
    });
  });

  readonly charCount = computed(() => this.editModel().content.length);
  readonly isOverLimit = computed(() => this.charCount() > 3000);

  readonly isUnchanged = computed(() => {
    const p = this.post();
    const currentContent = this.editModel().content.trim();
    const originalContent = (p.content ?? '').trim();

    if (p.status === 'PUBLISHED') {
      return currentContent === originalContent;
    }

    const currentLocal = toLocalDatetimeInput(p.scheduledTime);
    return (
      currentContent === originalContent &&
      this.editModel().scheduledTime === currentLocal
    );
  });

  readonly canSave = computed(() => {
    return (
      this.editForm().valid() &&
      !this.isUnchanged() &&
      !this.state.isActionLoading()
    );
  });

  onSave(): void {
    if (!this.canSave()) return;

    const trimmedContent = this.editModel().content.trim();
    const p = this.post();

    const updates: UpdatePostRequest = {
      content: trimmedContent,
      ...(p.status !== 'PUBLISHED' && this.editModel().scheduledTime
        ? { scheduledTime: new Date(this.editModel().scheduledTime).toISOString() }
        : {}),
    };

    this.state.updatePost(p.id, updates);
    this.open.set(false);
  }
}
