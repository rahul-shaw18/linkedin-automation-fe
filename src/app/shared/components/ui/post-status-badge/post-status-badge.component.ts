import { Component, input } from '@angular/core';
import { PostStatus } from '../../../../core/models/linkedin.model';
import { BadgeComponent } from '../badge/badge.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-post-status-badge',
  imports: [BadgeComponent, IconComponent],
  templateUrl: './post-status-badge.component.html',
})
export class PostStatusBadgeComponent {
  readonly status = input.required<PostStatus>();
}

