import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
import { RdxLabelDirective } from '@radix-ng/primitives/label';
import { SchedulerService } from '../../services/scheduler.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { ProgressComponent } from '../../../../shared/components/ui/progress/progress.component';
import { SchedulePickerComponent } from '../schedule-picker/schedule-picker.component';

@Component({
  selector: 'app-post-form',
  imports: [
    FormField,
    FormRoot,
    RdxLabelDirective,
    ButtonComponent,
    ProgressComponent,
    IconComponent,
    SchedulePickerComponent,
  ],
  templateUrl: './post-form.component.html',
})
export class PostFormComponent {
  readonly state = inject(SchedulerService);
  readonly schedulePicker = viewChild(SchedulePickerComponent);

  readonly targetTime = signal<Date>(new Date(Date.now() - 60 * 1000));
  readonly suggestedTags = ['#tech', '#ai', '#software', '#career', '#linkedin', '#fullstack'];

  onConnectLinkedIn(): void {
    this.state.connectLinkedIn();
  }

  protected readonly postModel = signal({
    content: '',
  });

  protected readonly postForm = form(
    this.postModel,
    (schemaPath) => {
      required(schemaPath.content, { message: 'Post commentary is required' });
      maxLength(schemaPath.content, 3000, { message: 'Post commentary cannot exceed 3000 characters' });
    },
    {
      submission: {
        action: async () => {
          const content = this.postModel().content.trim();
          if (!content) return;

          const scheduledIso = this.targetTime().toISOString();
          this.state.schedulePost(content, scheduledIso, () => {
            this.postModel.set({ content: '' });
            this.postForm().reset();
            this.schedulePicker()?.reset();
          });
        },
      },
    },
  );

  readonly characterCount = computed(() => this.postModel().content.length);

  appendTag(tag: string): void {
    const current = this.postModel().content;
    const separator = current.length > 0 && !current.endsWith(' ') ? ' ' : '';
    this.postModel.update((model) => ({
      ...model,
      content: current + separator + tag,
    }));
  }
}
