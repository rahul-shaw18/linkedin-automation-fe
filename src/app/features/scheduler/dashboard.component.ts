import { Component, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { SchedulerService } from './services/scheduler.service';
import { PostFormComponent } from './components/post-form/post-form.component';
import { PostListComponent } from './components/post-list/post-list.component';
import { IconComponent } from '../../shared/components/ui/icon/icon.component';
import { StatCardComponent } from '../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    StatCardComponent,
    IconComponent,
    PostFormComponent,
    PostListComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly state = inject(SchedulerService);
  private readonly toastManager = inject(RdxToastManager);
  private readonly router = inject(Router);

  readonly connected = input<string>();
  readonly userIdParam = input<string>(undefined, { alias: 'userId' });
  readonly error = input<string>();

  ngOnInit(): void {
    if (this.connected() === 'true') {
      const uid =
        this.userIdParam() ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('la_user_id') || localStorage.getItem('la_pending_user_id')
          : null);

      if (uid) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('la_user_id', uid);
            localStorage.removeItem('la_pending_user_id');
          } catch {}
        }
        this.state.currentUserId.set(uid);
        this.state.accounts.reload();
        this.state.posts.reload();
      }

      this.toastManager.add({
        type: 'success',
        title: 'Success',
        description: 'LinkedIn account successfully connected',
        priority: 'low',
      });
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    } else if (this.error()) {
      this.toastManager.add({
        type: 'error',
        title: 'Error',
        description: `LinkedIn connection failed: ${this.error()}`,
        priority: 'high',
        timeout: 5000,
      });
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    }
  }
}
