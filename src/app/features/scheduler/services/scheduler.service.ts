import { computed, effect, inject, signal, Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { timeout } from 'rxjs';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { ApiService } from '../../../core/services/api.service';
import {
  LinkedInAccount,
  ScheduledPost,
  SchedulePostRequest,
  PostStatus,
  HealthResponse,
} from '../../../core/models/linkedin.model';

@Service()
export class SchedulerService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(RdxToastManager);

  readonly currentUserId = signal<string>('');
  readonly filter = signal<'ALL' | PostStatus>('ALL');
  readonly isActionLoading = signal<boolean>(false);
  readonly isSessionChecking = signal<boolean>(true);
  readonly sessionCheckFailed = signal<boolean>(false);

  readonly health = httpResource<HealthResponse>(() => `${this.api.baseUrl}/health`);

  readonly accounts = httpResource<LinkedInAccount[]>(
    () => {
      const uid = this.currentUserId();
      return uid ? `${this.api.baseUrl}/auth/linkedin/accounts/${encodeURIComponent(uid)}` : undefined;
    },
    { defaultValue: [] },
  );

  readonly posts = httpResource<ScheduledPost[]>(
    () => {
      const uid = this.currentUserId();
      return uid ? `${this.api.baseUrl}/posts/user/${encodeURIComponent(uid)}` : undefined;
    },
    { defaultValue: [] },
  );

  private eventSource: EventSource | null = null;

  constructor() {
    this.api
      .getMe()
      .pipe(timeout({ first: 4000 }))
      .subscribe({
        next: (session) => {
          if (session.authenticated && session.userId) {
            this.currentUserId.set(session.userId);
            if (session.account) {
              this.accounts.set([session.account]);
            }
          } else {
            this.currentUserId.set('');
            this.accounts.set([]);
            this.posts.set([]);
          }
          this.sessionCheckFailed.set(false);
          this.isSessionChecking.set(false);
        },
        error: () => {
          this.sessionCheckFailed.set(true);
          this.isSessionChecking.set(false);
        },
      });

    effect(() => {
      const uid = this.currentUserId();
      if (!uid) {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        return;
      }

      this.initSse(uid);
    });
  }

  private initSse(userId: string): void {
    if (typeof window === 'undefined' || !userId) return;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const sseUrl = `${this.api.baseUrl}/posts/events/${encodeURIComponent(userId)}`;
      this.eventSource = new EventSource(sseUrl, { withCredentials: true });

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'POST_PUBLISHED') {
            const destName = payload.post?.account?.name || 'LinkedIn';
            this.toast.add({
              type: 'success',
              title: 'Post Published Live',
              description: `Your post for "${destName}" has been published.`,
              priority: 'high',
              timeout: 6000,
            });
            this.posts.reload();
          } else if (payload.type === 'POST_FAILED') {
            const destName = payload.post?.account?.name || 'LinkedIn';
            const errorMsg =
              payload.post?.failureReason ||
              payload.reason ||
              `Post for "${destName}" encountered an error.`;
            this.toast.add({
              type: 'error',
              title: `${destName}: Publication Failed`,
              description: errorMsg,
              priority: 'high',
              timeout: 10000,
            });
            this.posts.reload();
          } else if (payload.type === 'POST_PROCESSING') {
            this.posts.reload();
          }
        } catch (e) {
          console.error('Failed to parse SSE payload', e);
        }
      };

      this.eventSource.onerror = () => {};
    } catch (e) {
      console.error('Failed to connect to SSE events stream', e);
    }
  }

  readonly backendHealth = computed<HealthResponse | null>(() => this.health.value() ?? null);

  readonly isAccountLoading = computed<boolean>(() => {
    if (this.sessionCheckFailed() || !!this.accounts.error()) {
      return false;
    }
    return this.isSessionChecking() || (!!this.currentUserId() && this.accounts.isLoading() && !this.activeAccount());
  });

  readonly activeAccount = computed<LinkedInAccount | undefined>(() => {
    const list = this.accounts.hasValue() ? this.accounts.value() : [];
    return list?.find((acc) => acc.status === 'ACTIVE');
  });

  readonly allPosts = computed<ScheduledPost[]>(() => (this.posts.hasValue() ? this.posts.value() : []));

  readonly filteredPosts = computed<ScheduledPost[]>(() => {
    const currentFilter = this.filter();
    const all = this.allPosts();
    if (currentFilter === 'ALL') {
      return all;
    }
    return all.filter((post) => post.status === currentFilter);
  });

  readonly counts = computed(() => {
    const all = this.allPosts();
    let pending = 0;
    let processing = 0;
    let published = 0;
    let failed = 0;
    for (const p of all) {
      if (p.status === 'PENDING') pending++;
      else if (p.status === 'PROCESSING') processing++;
      else if (p.status === 'PUBLISHED') published++;
      else if (p.status === 'FAILED') failed++;
    }
    return {
      all: all.length,
      pending,
      processing,
      published,
      failed,
    };
  });

  readonly isLoading = computed<boolean>(() => {
    return this.isActionLoading();
  });

  readonly isInitialLoading = computed<boolean>(() => {
    if (this.sessionCheckFailed() || !!this.accounts.error() || !!this.posts.error()) {
      return false;
    }
    if (this.isSessionChecking()) return true;
    if (!this.currentUserId()) return false;
    const accountsEmpty = !this.accounts.hasValue() || this.accounts.value().length === 0;
    const postsEmpty = !this.posts.hasValue() || this.posts.value().length === 0;
    return (
      (this.accounts.isLoading() && accountsEmpty) ||
      (this.posts.isLoading() && postsEmpty)
    );
  });

  setFilter(filter: 'ALL' | PostStatus): void {
    this.filter.set(filter);
  }

  reloadPosts(): void {
    this.posts.reload();
  }

  reloadAccounts(): void {
    this.accounts.reload();
  }

  connectLinkedIn(redirectUri?: string): void {
    this.isActionLoading.set(true);
    this.api.getLoginUrl(undefined, redirectUri).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        if (res?.url) {
          window.location.href = res.url;
        } else {
          this.toast.add({
            type: 'error',
            title: 'Error',
            description: 'Failed to retrieve LinkedIn login URL',
            priority: 'high',
          });
        }
      },
      error: () => {
        this.isActionLoading.set(false);
      },
    });
  }

  schedulePost(
    content: string,
    scheduledTime: string,
    onComplete?: () => void,
  ): void {
    const account = this.activeAccount();
    if (!account) {
      this.toast.add({
        type: 'error',
        title: 'Error',
        description: 'Please connect an active LinkedIn account first.',
        priority: 'high',
      });
      return;
    }

    this.isActionLoading.set(true);
    const dto: SchedulePostRequest = {
      userId: this.currentUserId(),
      accountId: account.id,
      content,
      scheduledTime,
    };

    this.api.schedulePost(dto).subscribe({
      next: (newPost) => {
        this.posts.update((prev) => [newPost, ...(prev ?? [])]);
        this.toast.add({
          type: 'success',
          title: 'Success',
          description: 'Post successfully scheduled to your LinkedIn feed.',
          priority: 'low',
        });
        this.isActionLoading.set(false);
        onComplete?.();
      },
      error: () => {
        this.isActionLoading.set(false);
      },
    });
  }

  cancelPost(postId: string): void {
    this.isActionLoading.set(true);
    this.api.cancelPost(postId).subscribe({
      next: () => {
        this.posts.update((prev) => (prev ?? []).filter((p) => p.id !== postId));
        this.toast.add({
          type: 'info',
          title: 'Notice',
          description: 'Post cancelled and deleted.',
          priority: 'low',
        });
        this.isActionLoading.set(false);
      },
      error: () => {
        this.isActionLoading.set(false);
      },
    });
  }

  retryPost(postId: string): void {
    this.isActionLoading.set(true);
    this.api.retryPost(postId).subscribe({
      next: (updated) => {
        this.posts.update((prev) =>
          (prev ?? []).map((p) => (p.id === postId ? updated : p)),
        );
        this.toast.add({
          type: 'success',
          title: 'Success',
          description: 'Post reset to PENDING and will be published shortly.',
          priority: 'low',
        });
        this.isActionLoading.set(false);
      },
      error: () => {
        this.isActionLoading.set(false);
      },
    });
  }

  disconnectAccount(accountId: string, onComplete?: () => void): void {
    this.isActionLoading.set(true);
    this.api.disconnectAccount(accountId).subscribe({
      next: () => {
        this.api.logout().subscribe({ next: () => {}, error: () => {} });
        this.currentUserId.set('');
        this.accounts.set([]);
        this.posts.set([]);
        this.isActionLoading.set(false);
        this.toast.add({
          type: 'info',
          title: 'Notice',
          description: 'LinkedIn account disconnected.',
          priority: 'low',
        });
        onComplete?.();
      },
      error: () => {
        this.isActionLoading.set(false);
        onComplete?.();
      },
    });
  }
}
