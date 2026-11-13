import { Component, inject } from '@angular/core';
import {
  RdxTabsRoot,
  RdxTabsList,
  RdxTabsTab,
  RdxTabsPanel,
  RdxTabsValue,
} from '@radix-ng/primitives/tabs';
import { SchedulerService } from '../../services/scheduler.service';
import { PostStatus } from '../../../../core/models/linkedin.model';
import { PostCardComponent } from '../post-card/post-card.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-post-list',
  imports: [
    RdxTabsRoot,
    RdxTabsList,
    RdxTabsTab,
    RdxTabsPanel,
    PostCardComponent,
    EmptyStateComponent,
    IconComponent,
    ButtonComponent,
  ],
  templateUrl: './post-list.component.html',
})
export class PostListComponent {
  readonly state = inject(SchedulerService);

  onTabChange(tab: RdxTabsValue | undefined): void {
    if (tab && typeof tab === 'string') {
      this.state.setFilter(tab as 'ALL' | PostStatus);
    }
  }
}
