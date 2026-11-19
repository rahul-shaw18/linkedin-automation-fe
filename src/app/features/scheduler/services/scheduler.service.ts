import { computed, effect, inject, signal, untracked, Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { ApiService } from '../../../core/services/api.service';
import {
  LinkedInAccount,
  ScheduledPost,
  SchedulePostRequest,
  UpdatePostRequest,
  PostStatus,
  HealthResponse,
} from '../../../core/models/linkedin.model';

@Service()
export class SchedulerService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(RdxToastManager);

  readonly currentUserId = signal<string>(
    typeof window !== 'undefined' ? localStorage.getItem('la_user_id') || '' : '',
  );
  readonly filter = signal<'ALL' | PostStatus>('ALL');
  readonly session = httpResource<{
    authenticated: boolean;
    userId: string | null;
    account: LinkedInAccount | null;
  }>(() => `${this.api.baseUrl}/auth/linkedin/me`);

  readonly health = httpResource<HealthResponse>(() => `${this.api.baseUrl}/health`);

  // Data resources
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

  private readonly scheduleTrigger = signal<SchedulePostRequest | undefined>(undefined);
  readonly scheduleResource = httpResource<ScheduledPost>(() => {
    const payload = this.scheduleTrigger();
    return payload
      ? {
          url: `${this.api.baseUrl}/posts/schedule`,
          method: 'POST',
          body: payload,
        }
      : undefined;
  });

  private readonly updateTrigger = signal<{ postId: string; updates: UpdatePostRequest } | undefined>(undefined);
  readonly updateResource = httpResource<ScheduledPost>(() => {
    const req = this.updateTrigger();
    return req
      ? {
          url: `${this.api.baseUrl}/posts/${encodeURIComponent(req.postId)}`,
          method: 'PATCH',
          body: req.updates,
        }
      : undefined;
  });

  private readonly deleteTrigger = signal<{ postId: string; isPublished: boolean } | undefined>(undefined);
  readonly deleteResource = httpResource<{ success: boolean; message: string }>(() => {
    const req = this.deleteTrigger();
    return req
      ? {
          url: `${this.api.baseUrl}/posts/${encodeURIComponent(req.postId)}`,
          method: 'DELETE',
        }
      : undefined;
  });

  private readonly retryTrigger = signal<string | undefined>(undefined);
  readonly retryResource = httpResource<ScheduledPost>(() => {
    const postId = this.retryTrigger();
    return postId
      ? {
          url: `${this.api.baseUrl}/posts/${encodeURIComponent(postId)}/retry`,
          method: 'POST',
          body: {},
        }
      : undefined;
  });

  private readonly disconnectTrigger = signal<string | undefined>(undefined);
  readonly disconnectResource = httpResource<LinkedInAccount>(() => {
    const accountId = this.disconnectTrigger();
    return accountId
      ? {
          url: `${this.api.baseUrl}/auth/linkedin/accounts/${encodeURIComponent(accountId)}`,
          method: 'DELETE',
        }
      : undefined;
  });

  private readonly loginTrigger = signal<string | undefined>(undefined);
  readonly loginResource = httpResource<{ url: string; state: string }>(() => {
    const trigger = this.loginTrigger();
    if (trigger === undefined) return undefined;
    let url = `${this.api.baseUrl}/auth/linkedin/login-url`;
    const params: string[] = [];
    const uid = this.currentUserId();
    if (uid) params.push(`userId=${encodeURIComponent(uid)}`);
    if (trigger) params.push(`redirectUri=${encodeURIComponent(trigger)}`);
    if (params.length) url += `?${params.join('&')}`;
    return url;
  });

  private eventSource: EventSource | null = null;

  constructor() {
    effect(() => {
      if (this.session.status() === 'resolved') {
        const s = this.session.value();
        if (s?.authenticated && s.userId) {
          this.currentUserId.set(s.userId);
          if (s.account) {
            this.accounts.set([s.account]);
          }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('la_user_id', s.userId);
            } catch {}
          }
        } else if (s && !s.authenticated) {
          const localUid =
            typeof window !== 'undefined' ? localStorage.getItem('la_user_id') : null;
          if (!localUid) {
            this.currentUserId.set('');
            this.accounts.set([]);
            this.posts.set([]);
          }
        }
      }
    });

    // Auto-refresh when posts are actively pending or processing as a fallback
    effect((onCleanup) => {
      const counts = this.counts();
      const hasActivePosts = counts.pending > 0 || counts.processing > 0;
      if (!hasActivePosts || typeof window === 'undefined') return;

      const timer = setInterval(() => {
        this.posts.reload();
      }, 15000);

      onCleanup(() => clearInterval(timer));
    });

    // 2. Reactive SSE connection management
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

    effect(() => {
      if (this.scheduleResource.status() === 'resolved') {
        const newPost = this.scheduleResource.value();
        if (newPost) {
          this.posts.update((prev) => [newPost, ...(prev ?? []).filter((p) => p.id !== newPost.id)]);
          this.toast.add({
            type: 'success',
            title: 'Success',
            description: 'Post successfully scheduled to your LinkedIn feed.',
            priority: 'low',
          });
          untracked(() => this.scheduleTrigger.set(undefined));
        }
      } else if (this.scheduleResource.status() === 'error') {
        untracked(() => this.scheduleTrigger.set(undefined));
      }
    });

    effect(() => {
      if (this.updateResource.status() === 'resolved') {
        const updated = this.updateResource.value();
        if (updated) {
          this.posts.update((prev) =>
            (prev ?? []).map((p) => (p.id === updated.id ? updated : p)),
          );
          this.toast.add({
            type: 'success',
            title: updated.status === 'PUBLISHED' ? 'Updated on LinkedIn' : 'Post Updated',
            description:
              updated.status === 'PUBLISHED'
                ? 'Post commentary was updated on LinkedIn and saved.'
                : 'Post was successfully updated.',
            priority: 'low',
          });
          untracked(() => this.updateTrigger.set(undefined));
        }
      } else if (this.updateResource.status() === 'error') {
        this.posts.reload();
        untracked(() => this.updateTrigger.set(undefined));
      }
    });

    // 5. React to delete post resource resolution
    effect(() => {
      if (this.deleteResource.status() === 'resolved') {
        const trigger = untracked(this.deleteTrigger);
        const res = this.deleteResource.value();
        this.toast.add({
          type: 'success',
          title: trigger?.isPublished ? 'Deleted from LinkedIn' : 'Post Deleted',
          description:
            res?.message ||
            (trigger?.isPublished
              ? 'Post was permanently deleted from LinkedIn and removed from database.'
              : 'Post was removed.'),
          priority: 'low',
        });
        untracked(() => this.deleteTrigger.set(undefined));
      } else if (this.deleteResource.status() === 'error') {
        this.posts.reload();
        untracked(() => this.deleteTrigger.set(undefined));
      }
    });

    effect(() => {
      if (this.retryResource.status() === 'resolved') {
        const updated = this.retryResource.value();
        if (updated) {
          this.posts.update((prev) =>
            (prev ?? []).map((p) => (p.id === updated.id ? updated : p)),
          );
          this.toast.add({
            type: 'success',
            title: 'Success',
            description: 'Post reset to PENDING and will be published shortly.',
            priority: 'low',
          });
          untracked(() => this.retryTrigger.set(undefined));
        }
      } else if (this.retryResource.status() === 'error') {
        this.posts.reload();
        untracked(() => this.retryTrigger.set(undefined));
      }
    });

    effect(() => {
      if (this.disconnectResource.status() === 'resolved') {
        this.currentUserId.set('');
        this.accounts.set([]);
        this.posts.set([]);
        this.toast.add({
          type: 'info',
          title: 'Notice',
          description: 'LinkedIn account disconnected.',
          priority: 'low',
        });
        untracked(() => this.disconnectTrigger.set(undefined));
      } else if (this.disconnectResource.status() === 'error') {
        untracked(() => this.disconnectTrigger.set(undefined));
      }
    });

    effect(() => {
      if (this.loginResource.status() === 'resolved') {
        const res = this.loginResource.value();
        if (res?.url) {
          window.location.href = res.url;
        } else {
          this.toast.add({
            type: 'error',
            title: 'Error',
            description: 'Failed to retrieve LinkedIn login URL',
            priority: 'high',
          });
          untracked(() => this.loginTrigger.set(undefined));
        }
      } else if (this.loginResource.status() === 'error') {
        untracked(() => this.loginTrigger.set(undefined));
      }
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

      const handleEvent = (event: MessageEvent) => {
        try {
          if (!event.data) return;
          const payload = JSON.parse(event.data);
          if (payload.type === 'HEARTBEAT') return;

          console.log('[SSE] Real-time event received:', payload.type, payload);

          if (payload.type === 'POST_PUBLISHED') {
            const destName = payload.post?.account?.name || 'LinkedIn';
            this.toast.add({
              type: 'success',
              title: 'Post Published Live',
              description: `Your post for "${destName}" has been published.`,
              priority: 'high',
              timeout: 6000,
            });

            // Optimistically update signal immediately for instant UI change
            if (payload.post?.id) {
              this.posts.update((prev) =>
                (prev ?? []).map((p) =>
                  p.id === payload.post.id
                    ? {
                        ...p,
                        ...payload.post,
                        status: 'PUBLISHED' as const,
                      }
                    : p,
                ),
              );
            }
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

            if (payload.post?.id) {
              this.posts.update((prev) =>
                (prev ?? []).map((p) =>
                  p.id === payload.post.id
                    ? {
                        ...p,
                        ...payload.post,
                        status: 'FAILED' as const,
                        failureReason: errorMsg,
                      }
                    : p,
                ),
              );
            }
            this.posts.reload();
          } else if (payload.type === 'POST_PROCESSING') {
            if (payload.post?.id) {
              this.posts.update((prev) =>
                (prev ?? []).map((p) =>
                  p.id === payload.post.id
                    ? { ...p, status: 'PROCESSING' as const }
                    : p,
                ),
              );
            }
            this.posts.reload();
          } else if (payload.type === 'POST_UPDATED') {
            if (payload.post?.id) {
              this.posts.update((prev) =>
                (prev ?? []).map((p) =>
                  p.id === payload.post.id
                    ? { ...p, ...payload.post }
                    : p,
                ),
              );
            }
            this.posts.reload();
          } else if (payload.type === 'POST_DELETED') {
            if (payload.post?.id) {
              this.posts.update((prev) => (prev ?? []).filter((p) => p.id !== payload.post.id));
            } else {
              this.posts.reload();
            }
          }
        } catch (e) {
          console.error('[SSE] Failed to parse SSE payload', e);
        }
      };

      this.eventSource.onmessage = handleEvent;
      this.eventSource.onerror = (err) => {
        console.warn('[SSE] EventSource connection state:', this.eventSource?.readyState, err);
      };
    } catch (e) {
      console.error('[SSE] Failed to connect to SSE events stream', e);
    }
  }


  readonly backendHealth = computed<HealthResponse | null>(() => this.health.value() ?? null);

  readonly isSessionChecking = computed<boolean>(() => this.session.isLoading());
  readonly sessionCheckFailed = computed<boolean>(() => this.session.status() === 'error');

  readonly isActionLoading = computed<boolean>(() => {
    return (
      this.scheduleResource.isLoading() ||
      this.updateResource.isLoading() ||
      this.deleteResource.isLoading() ||
      this.retryResource.isLoading() ||
      this.disconnectResource.isLoading() ||
      this.loginResource.isLoading()
    );
  });

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
  connectLinkedIn(redirectUri?: string): void {
    this.loginTrigger.set(redirectUri ?? '');
  }

  schedulePost(content: string, scheduledTime: string): void {
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

    this.scheduleTrigger.set({
      userId: this.currentUserId(),
      accountId: account.id,
      content,
      scheduledTime,
    });
  }

  deletePost(postId: string, isPublished = false): void {
    // Optimistically update resource
    this.posts.update((prev) => (prev ?? []).filter((p) => p.id !== postId));
    this.deleteTrigger.set({ postId, isPublished });
  }

  updatePost(postId: string, updates: UpdatePostRequest): void {
    this.posts.update((prev) =>
      (prev ?? []).map((p) =>
        p.id === postId
          ? {
              ...p,
              content: updates.content ?? p.content,
              ...(updates.scheduledTime ? { scheduledTime: updates.scheduledTime } : {}),
            }
          : p,
      ),
    );
    this.updateTrigger.set({ postId, updates });
  }

  retryPost(postId: string): void {
    this.retryTrigger.set(postId);
  }

  disconnectAccount(accountId: string): void {
    this.disconnectTrigger.set(accountId);
  }

  setFilter(filter: 'ALL' | PostStatus): void {
    this.filter.set(filter);
  }
}
