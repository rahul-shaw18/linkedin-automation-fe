import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostCardComponent } from './post-card.component';
import { SchedulerService } from '../../services/scheduler.service';
import { RdxToastManager } from '@radix-ng/primitives/toast';
import { Clipboard } from '@angular/cdk/clipboard';
import { ScheduledPost } from '../../../../core/models/linkedin.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PostCardComponent', () => {
  let component: PostCardComponent;
  let fixture: ComponentFixture<PostCardComponent>;
  let mockSchedulerService: {
    deletePost: ReturnType<typeof vi.fn>;
    retryPost: ReturnType<typeof vi.fn>;
  };
  let mockToastManager: {
    add: ReturnType<typeof vi.fn>;
  };
  let mockClipboard: {
    copy: ReturnType<typeof vi.fn>;
  };

  const samplePendingPost: ScheduledPost = {
    id: 'post_p1',
    userId: 'user_1',
    accountId: 'acc_1',
    content: 'Testing Angular 22 Signals & Radix UI',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    account: {
      id: 'acc_1',
      linkedInId: 'li_user_1',
      name: 'Rahul Shaw',
      status: 'ACTIVE',
    },
  };

  beforeEach(async () => {
    mockSchedulerService = {
      deletePost: vi.fn(),
      retryPost: vi.fn(),
    };

    mockToastManager = {
      add: vi.fn(),
    };

    mockClipboard = {
      copy: vi.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [
        { provide: SchedulerService, useValue: mockSchedulerService },
        { provide: RdxToastManager, useValue: mockToastManager },
        { provide: Clipboard, useValue: mockClipboard },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', samplePendingPost);
    fixture.detectChanges();
  });

  it('should create component instance', () => {
    expect(component).toBeTruthy();
  });

  describe('computed dialog titles and labels', () => {
    it('should compute correct titles for PENDING post', () => {
      expect(component.deleteDialogTitle()).toBe('Delete scheduled post?');
      expect(component.deleteConfirmText()).toBe('Yes, Delete Post');
      expect(component.deleteDialogDescription()).toContain('removed from your execution queue');
    });

    it('should compute correct titles for PUBLISHED post', () => {
      fixture.componentRef.setInput('post', {
        ...samplePendingPost,
        status: 'PUBLISHED',
        linkedInPostId: 'urn:li:share:987654',
      });
      fixture.detectChanges();

      expect(component.deleteDialogTitle()).toBe('Delete post from LinkedIn?');
      expect(component.deleteConfirmText()).toBe('Yes, Delete from LinkedIn');
      expect(component.deleteDialogDescription()).toContain('permanently deleted from LinkedIn');
    });

    it('should compute correct titles for FAILED post', () => {
      fixture.componentRef.setInput('post', {
        ...samplePendingPost,
        status: 'FAILED',
        failureReason: 'Rate limit hit',
      });
      fixture.detectChanges();

      expect(component.deleteDialogTitle()).toBe('Delete failed post?');
      expect(component.deleteConfirmText()).toBe('Yes, Delete Post');
      expect(component.deleteDialogDescription()).toContain('permanently removed from your history');
    });
  });

  describe('actions', () => {
    it('should open edit dialog when openEdit() is called', () => {
      expect(component.isEditDialogOpen()).toBe(false);
      component.openEdit();
      expect(component.isEditDialogOpen()).toBe(true);
    });

    it('should open delete dialog when openDelete() is called', () => {
      expect(component.isDeleteDialogOpen()).toBe(false);
      component.openDelete();
      expect(component.isDeleteDialogOpen()).toBe(true);
    });

    it('should dispatch deletePost with isPublished=false for pending post', () => {
      component.onDeleteConfirmed();
      expect(mockSchedulerService.deletePost).toHaveBeenCalledWith('post_p1', false);
    });

    it('should dispatch deletePost with isPublished=true for published post', () => {
      fixture.componentRef.setInput('post', {
        ...samplePendingPost,
        status: 'PUBLISHED',
      });
      fixture.detectChanges();

      component.onDeleteConfirmed();
      expect(mockSchedulerService.deletePost).toHaveBeenCalledWith('post_p1', true);
    });

    it('should call state.retryPost on retry action', () => {
      component.onRetry();
      expect(mockSchedulerService.retryPost).toHaveBeenCalledWith('post_p1');
    });

    it('should copy text to clipboard and trigger success toast', () => {
      component.copyToClipboard('urn:li:share:123', 'Post ID');

      expect(mockClipboard.copy).toHaveBeenCalledWith('urn:li:share:123');
      expect(mockToastManager.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Copied to Clipboard',
        }),
      );
    });
  });
});
