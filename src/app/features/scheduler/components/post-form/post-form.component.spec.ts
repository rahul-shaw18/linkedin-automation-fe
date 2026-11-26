import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostFormComponent } from './post-form.component';
import { SchedulerService } from '../../services/scheduler.service';
import { signal } from '@angular/core';
import { LinkedInAccount } from '../../../../core/models/linkedin.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PostFormComponent', () => {
  let component: PostFormComponent;
  let fixture: ComponentFixture<PostFormComponent>;
  let mockSchedulerService: {
    activeAccount: ReturnType<typeof signal<LinkedInAccount | undefined>>;
    isActionLoading: ReturnType<typeof signal<boolean>>;
    isAccountLoading: ReturnType<typeof signal<boolean>>;
    connectLinkedIn: ReturnType<typeof vi.fn>;
    schedulePost: ReturnType<typeof vi.fn>;
  };

  const activeAccountMock: LinkedInAccount = {
    id: 'acc_active_1',
    userId: 'user_1',
    linkedInId: 'li_user_1',
    name: 'Rahul Shaw',
    tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockSchedulerService = {
      activeAccount: signal<LinkedInAccount | undefined>(activeAccountMock),
      isActionLoading: signal<boolean>(false),
      isAccountLoading: signal<boolean>(false),
      connectLinkedIn: vi.fn(),
      schedulePost: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PostFormComponent],
      providers: [
        { provide: SchedulerService, useValue: mockSchedulerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component instance', () => {
    expect(component).toBeTruthy();
  });

  describe('character counting & tag appending', () => {
    it('should initialize characterCount to 0', () => {
      expect(component.characterCount()).toBe(0);
    });

    it('should append tag with appropriate whitespace spacing', () => {
      component.appendTag('#tech');
      expect(component['postModel']().content).toBe('#tech');
      expect(component.characterCount()).toBe(5);

      component.appendTag('#ai');
      expect(component['postModel']().content).toBe('#tech #ai');
      expect(component.characterCount()).toBe(9);
    });
  });

  describe('connect account', () => {
    it('should trigger state.connectLinkedIn when onConnectLinkedIn is called', () => {
      component.onConnectLinkedIn();
      expect(mockSchedulerService.connectLinkedIn).toHaveBeenCalled();
    });
  });

  describe('submission validation', () => {
    it('should not schedule post if content is empty or only whitespace', () => {
      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      component['postModel'].set({ content: '   ' });

      component.onSubmit(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockSchedulerService.schedulePost).not.toHaveBeenCalled();
    });

    it('should not schedule post if activeAccount is missing', () => {
      mockSchedulerService.activeAccount.set(undefined);
      component['postModel'].set({ content: 'Valid post commentary' });

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      component.onSubmit(mockEvent);

      expect(mockSchedulerService.schedulePost).not.toHaveBeenCalled();
    });

    it('should not schedule post if isActionLoading is true', () => {
      mockSchedulerService.isActionLoading.set(true);
      component['postModel'].set({ content: 'Valid post commentary' });

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      component.onSubmit(mockEvent);

      expect(mockSchedulerService.schedulePost).not.toHaveBeenCalled();
    });

    it('should schedule post when content is valid and active account exists', () => {
      component['postModel'].set({ content: 'Production ready capstone test!' });

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      component.onSubmit(mockEvent);

      expect(mockSchedulerService.schedulePost).toHaveBeenCalledWith(
        'Production ready capstone test!',
        expect.any(String),
      );
      expect(component['postModel']().content).toBe('');
    });
  });
});
