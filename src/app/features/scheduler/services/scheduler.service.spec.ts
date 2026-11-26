import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SchedulerService } from './scheduler.service';
import { ApiService } from '../../../core/services/api.service';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { ScheduledPost, LinkedInAccount } from '../../../core/models/linkedin.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let mockToastManager: {
    add: ReturnType<typeof vi.fn>;
  };

  const sampleAccounts: LinkedInAccount[] = [
    {
      id: 'acc_1',
      userId: 'user_1',
      linkedInId: 'li_user_1',
      name: 'Rahul Shaw',
      status: 'ACTIVE',
      tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc_2',
      userId: 'user_1',
      linkedInId: 'li_user_2',
      name: 'Old Account',
      status: 'DISCONNECTED',
      tokenExpiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const samplePosts: ScheduledPost[] = [
    {
      id: 'post_1',
      userId: 'user_1',
      accountId: 'acc_1',
      content: 'Pending post test',
      scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_2',
      userId: 'user_1',
      accountId: 'acc_1',
      content: 'Published post test',
      scheduledTime: new Date(Date.now() - 3600000).toISOString(),
      status: 'PUBLISHED',
      linkedInPostId: 'urn:li:share:111222',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_3',
      userId: 'user_1',
      accountId: 'acc_1',
      content: 'Failed post test',
      scheduledTime: new Date(Date.now() - 7200000).toISOString(),
      status: 'FAILED',
      failureReason: 'Network timeout',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    mockToastManager = {
      add: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SchedulerService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RdxToastManager, useValue: mockToastManager },
      ],
    });

    service = TestBed.inject(SchedulerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('filtering & counts', () => {
    beforeEach(() => {
      service.posts.set(samplePosts);
      service.accounts.set(sampleAccounts);
    });

    it('should calculate post counts correctly', () => {
      const counts = service.counts();
      expect(counts.all).toBe(3);
      expect(counts.pending).toBe(1);
      expect(counts.published).toBe(1);
      expect(counts.failed).toBe(1);
      expect(counts.processing).toBe(0);
    });

    it('should return all posts when filter is ALL', () => {
      service.setFilter('ALL');
      expect(service.filteredPosts().length).toBe(3);
    });

    it('should filter posts by PENDING status', () => {
      service.setFilter('PENDING');
      const filtered = service.filteredPosts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('post_1');
    });

    it('should filter posts by PUBLISHED status', () => {
      service.setFilter('PUBLISHED');
      const filtered = service.filteredPosts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('post_2');
    });

    it('should filter posts by FAILED status', () => {
      service.setFilter('FAILED');
      const filtered = service.filteredPosts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('post_3');
    });

    it('should identify the active LinkedIn account', () => {
      const active = service.activeAccount();
      expect(active).toBeDefined();
      expect(active?.id).toBe('acc_1');
      expect(active?.status).toBe('ACTIVE');
    });
  });

  describe('optimistic UI operations', () => {
    beforeEach(() => {
      service.posts.set(samplePosts);
    });

    it('should optimistically remove post on deletePost()', () => {
      expect(service.allPosts().some((p) => p.id === 'post_1')).toBe(true);
      service.deletePost('post_1', false);
      expect(service.allPosts().some((p) => p.id === 'post_1')).toBe(false);
      expect(service.allPosts().length).toBe(2);
    });

    it('should optimistically update post content on updatePost()', () => {
      service.updatePost('post_1', { content: 'Optimistically updated text!' });
      const updated = service.allPosts().find((p) => p.id === 'post_1');
      expect(updated?.content).toBe('Optimistically updated text!');
    });
  });
});
