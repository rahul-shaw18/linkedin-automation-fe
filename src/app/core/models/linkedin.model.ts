export type AccountStatus = 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED';
export type PostStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';

export interface LinkedInAccount {
  id: string;
  userId: string;
  linkedInId: string;
  name?: string | null;
  email?: string | null;
  pictureUrl?: string | null;
  tokenExpiresAt: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt?: string;
}


export interface ScheduledPost {
  id: string;
  userId: string;
  accountId: string;
  content: string;
  scheduledTime: string;
  status: PostStatus;
  linkedInPostId?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    linkedInId: string;
    status: AccountStatus;
    name?: string | null;
    pictureUrl?: string | null;
  };
}

export interface SchedulePostRequest {
  userId: string;
  accountId: string;
  content: string;
  scheduledTime: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service?: string;
  uptimeSeconds?: number;
  uptime?: number;
  database: string | {
    status: string;
    connected: boolean;
  };
}

