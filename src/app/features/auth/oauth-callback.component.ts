import { Component, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { ApiService } from '../../core/services/api.service';
import { SchedulerService } from '../scheduler/services/scheduler.service';
import { LinkedInAccount } from '../../core/models/linkedin.model';
import { IconComponent } from '../../shared/components/ui/icon/icon.component';

@Component({
  selector: 'app-oauth-callback',
  imports: [IconComponent],
  templateUrl: './oauth-callback.component.html',
})
export class OAuthCallbackComponent {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toastManager = inject(RdxToastManager);
  private readonly state = inject(SchedulerService);

  readonly code = input<string>();

  // Resource API for handling the OAuth callback reaction
  readonly oauthResource = httpResource<LinkedInAccount>(() => {
    const authCode = this.code();
    return authCode
      ? {
          url: `${this.api.baseUrl}/auth/linkedin/callback`,
          method: 'POST',
          body: { code: authCode },
        }
      : undefined;
  });

  constructor() {
    effect(() => {
      const authCode = this.code();
      if (!authCode && authCode !== undefined) {
        this.toastManager.add({
          type: 'error',
          title: 'Error',
          description: 'OAuth callback missing authorization code.',
          priority: 'high',
        });
        this.router.navigate(['/']);
        return;
      }

      if (this.oauthResource.status() === 'resolved') {
        const account = this.oauthResource.value();
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
      } else if (this.oauthResource.status() === 'error') {
        this.router.navigate(['/']);
      }
    });
  }
}
