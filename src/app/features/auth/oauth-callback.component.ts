import { Component, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { ApiService } from '../../core/services/api.service';
import { SchedulerService } from '../scheduler/services/scheduler.service';
import { IconComponent } from '../../shared/components/ui/icon/icon.component';

@Component({
  selector: 'app-oauth-callback',
  imports: [IconComponent],
  templateUrl: './oauth-callback.component.html',
})
export class OAuthCallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toastManager = inject(RdxToastManager);
  private readonly state = inject(SchedulerService);

  readonly code = input<string>();
  readonly oauthState = input<string>(undefined, { alias: 'state' });

  ngOnInit(): void {
    const code = this.code();

    if (!code) {
      this.toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'OAuth callback missing authorization code.',
        priority: 'high',
      });
      this.router.navigate(['/']);
      return;
    }

    this.api.handleOAuthCallback(code).subscribe({
      next: (account) => {
        if (account) {
          this.state.currentUserId.set(account.userId);
          this.state.accounts.set([account]);
          this.state.posts.reload();
        }

        this.toastManager.add({
          type: 'success',
          title: 'Success',
          description: `Connected as ${account?.name || 'LinkedIn Member'}`,
          priority: 'low',
        });
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      },
    });
  }
}

