import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import {
  LinkedInAccount,
  ScheduledPost,
  SchedulePostRequest,
  UpdatePostRequest,
} from '../models/linkedin.model';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ApiService', () => {
  let service: ApiService;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMe', () => {
    it('should issue a GET request to /auth/linkedin/me', () => {
      const mockResponse = {
        authenticated: true,
        userId: 'user_123',
        account: {
          id: 'acc_1',
          userId: 'user_123',
          linkedInId: 'li_123',
          name: 'Rahul Shaw',
          email: 'rahul@example.com',
          tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'ACTIVE' as const,
          createdAt: new Date().toISOString(),
        } as LinkedInAccount,
      };

      service.getMe().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${baseUrl}/auth/linkedin/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getLoginUrl', () => {
    it('should construct query params and request /auth/linkedin/login-url', () => {
      const mockResult = {
        url: 'https://www.linkedin.com/oauth/v2/authorization?client_id=123',
        state: 'auth_state_xyz',
      };

      service.getLoginUrl('user_123', 'https://example.com/callback').subscribe((res) => {
        expect(res).toEqual(mockResult);
      });

      const req = httpTestingController.expectOne(
        `${baseUrl}/auth/linkedin/login-url?userId=user_123&redirectUri=https%3A%2F%2Fexample.com%2Fcallback`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });
  });

  describe('schedulePost', () => {
    it('should POST post payload to /posts/schedule', () => {
      const payload: SchedulePostRequest = {
        userId: 'user_123',
        accountId: 'acc_1',
        content: 'Launching our capstone demo!',
        scheduledTime: '2026-11-26T16:00:00.000Z',
      };

      const mockCreatedPost: ScheduledPost = {
        id: 'post_new_1',
        userId: 'user_123',
        accountId: 'acc_1',
        content: payload.content,
        scheduledTime: payload.scheduledTime,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      service.schedulePost(payload).subscribe((res) => {
        expect(res).toEqual(mockCreatedPost);
      });

      const req = httpTestingController.expectOne(`${baseUrl}/posts/schedule`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockCreatedPost);
    });
  });

  describe('updatePost', () => {
    it('should PATCH update payload to /posts/:id', () => {
      const payload: UpdatePostRequest = {
        content: 'Updated post commentary!',
      };

      const mockUpdatedPost: ScheduledPost = {
        id: 'post_123',
        userId: 'user_123',
        accountId: 'acc_1',
        content: 'Updated post commentary!',
        scheduledTime: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      service.updatePost('post_123', payload).subscribe((res) => {
        expect(res).toEqual(mockUpdatedPost);
      });

      const req = httpTestingController.expectOne(`${baseUrl}/posts/post_123`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(mockUpdatedPost);
    });
  });

  describe('deletePost', () => {
    it('should send DELETE request to /posts/:id', () => {
      const mockResponse = {
        success: true,
        message: 'Post was successfully removed.',
      };

      service.deletePost('post_to_delete').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${baseUrl}/posts/post_to_delete`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('retryPost', () => {
    it('should POST to /posts/:id/retry', () => {
      const mockRetriedPost: ScheduledPost = {
        id: 'failed_post_1',
        userId: 'user_123',
        accountId: 'acc_1',
        content: 'Retried post content',
        scheduledTime: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      service.retryPost('failed_post_1').subscribe((res) => {
        expect(res).toEqual(mockRetriedPost);
      });

      const req = httpTestingController.expectOne(`${baseUrl}/posts/failed_post_1/retry`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockRetriedPost);
    });
  });

  describe('disconnectAccount', () => {
    it('should DELETE to /auth/linkedin/accounts/:id', () => {
      const mockDisconnectedAccount: LinkedInAccount = {
        id: 'acc_1',
        userId: 'user_123',
        linkedInId: 'li_123',
        tokenExpiresAt: new Date().toISOString(),
        status: 'DISCONNECTED',
        createdAt: new Date().toISOString(),
      };

      service.disconnectAccount('acc_1').subscribe((res) => {
        expect(res.status).toBe('DISCONNECTED');
      });

      const req = httpTestingController.expectOne(`${baseUrl}/auth/linkedin/accounts/acc_1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockDisconnectedAccount);
    });
  });
});
