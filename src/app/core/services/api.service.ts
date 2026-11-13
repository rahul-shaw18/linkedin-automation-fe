import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LinkedInAccount,
  ScheduledPost,
  SchedulePostRequest,
  HealthResponse,
} from '../models/linkedin.model';

@Service()
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  getMe(): Observable<{ authenticated: boolean; userId: string | null; account: LinkedInAccount | null }> {
    return this.http.get<{ authenticated: boolean; userId: string | null; account: LinkedInAccount | null }>(
      `${this.baseUrl}/auth/linkedin/me`,
    );
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/auth/linkedin/logout`,
      {},
    );
  }

  getLoginUrl(userId?: string, redirectUri?: string): Observable<{ url: string; state: string }> {
    let url = `${this.baseUrl}/auth/linkedin/login-url`;
    const params: string[] = [];
    if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
    if (redirectUri) params.push(`redirectUri=${encodeURIComponent(redirectUri)}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<{ url: string; state: string }>(url);
  }

  handleOAuthCallback(
    code: string,
    userId?: string,
    redirectUri?: string,
  ): Observable<LinkedInAccount> {
    return this.http.post<LinkedInAccount>(`${this.baseUrl}/auth/linkedin/callback`, {
      code,
      userId,
      redirectUri,
    });
  }

  schedulePost(dto: SchedulePostRequest): Observable<ScheduledPost> {
    return this.http.post<ScheduledPost>(`${this.baseUrl}/posts/schedule`, dto);
  }

  cancelPost(postId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/posts/${encodeURIComponent(postId)}`,
    );
  }

  retryPost(postId: string): Observable<ScheduledPost> {
    return this.http.post<ScheduledPost>(
      `${this.baseUrl}/posts/${encodeURIComponent(postId)}/retry`,
      {},
    );
  }

  disconnectAccount(accountId: string): Observable<LinkedInAccount> {
    return this.http.delete<LinkedInAccount>(
      `${this.baseUrl}/auth/linkedin/accounts/${encodeURIComponent(accountId)}`,
    );
  }
}
