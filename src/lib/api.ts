import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password?: string;
}

export interface GoogleLoginRequest {
  code: string;
  redirect_uri?: string;
}

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Removed manual Authorization header interceptor since cookies are sent automatically

// Interceptor for responses: handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 Unauthorized and ensure it's not a retry request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If it's a login request, don't attempt to refresh token
      if (originalRequest.url?.includes('/api/v1/users/login/')) {
        const apiError = error.response?.data?.detail || error.response?.data?.message || error.message;
        return Promise.reject(new Error(apiError));
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${API_BASE_URL}/api/v1/users/token/refresh/`, {}, { withCredentials: true });
        
        processQueue(null, 'refreshed');
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normal error handling: extract API message
    const apiError = error.response?.data?.detail || error.response?.data?.message || error.message;
    return Promise.reject(new Error(apiError));
  }
);

// Workspace and Membership Interfaces
export interface Workspace {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  created_by?: number;
}

export interface WorkspaceMember {
  id: number;
  workspace: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joined_at: string;
}

export interface WorkspaceInvitation {
  id: number;
  workspace: number;
  email: string;
  invited_by: number;
  role: string;
  token: string;
  created_at: string;
  expires_at: string;
  is_accepted: boolean;
}

export interface Channel {
  id: number;
  workspace: number;
  name: string;
  description: string;
  is_private: boolean;
  created_at: string;
  created_by?: number;
}

export interface Topic {
  id: number;
  channel: number;
  title: string;
  content: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username: string;
    email: string;
  };
  last_reply_at?: string;
  replies_count?: number;
}

export interface Reply {
  id: number;
  topic: number;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface CallSession {
  id: number;
  workspace: number;
  caller: {
    id: number;
    username: string;
    email: string;
  } | null;
  receiver: {
    id: number;
    username: string;
    email: string;
  } | null;
  status: 'RINGING' | 'CONNECTED' | 'MISSED' | 'REJECTED' | 'COMPLETED';
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
}

export interface WorkspaceSubscription {
  workspace: number;
  tier: 'FREE' | 'PREMIUM';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
  auto_renew: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
}

export const api = {
  // Auth Operations
  async register(data: RegisterRequest) {
    const response = await apiClient.post('/api/v1/users/register/', data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.get(`/api/v1/users/register/verify-email/?token=${token}`);
    return response.data;
  },

  async resendVerificationEmail(email: string) {
    const response = await apiClient.post('/api/v1/users/register/resend-verification-email/', { email });
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest) {
    const response = await apiClient.post('/api/v1/users/forgot-password/', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest) {
    const response = await apiClient.post('/api/v1/users/reset-password/', data);
    return response.data;
  },

  async login(data: LoginRequest) {
    const response = await apiClient.post('/api/v1/users/login/', data);
    return response.data;
  },

  async googleLogin(data: GoogleLoginRequest) {
    const response = await apiClient.post('/api/v1/users/auth/google/', data);
    return response.data;
  },

  async logout() {
    const response = await apiClient.post('/api/v1/users/logout/');
    return response.data;
  },

  // Workspace API Operations
  async listWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get('/api/v1/workspaces/');
    return response.data;
  },

  async createWorkspace(name: string, slug: string): Promise<Workspace> {
    const response = await apiClient.post('/api/v1/workspaces/', { name, slug });
    return response.data;
  },

  async inviteWorkspaceMember(slug: string, email: string, role: string): Promise<WorkspaceInvitation> {
    const response = await apiClient.post(`/api/v1/workspaces/${slug}/invite/`, { email, role });
    return response.data;
  },

  async listWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get(`/api/v1/workspaces/${slug}/members/`);
    return response.data;
  },

  async acceptWorkspaceInvitation(token: string): Promise<{ message: string }> {
    const response = await apiClient.post('/api/v1/workspaces/accept-invite/', { token });
    return response.data;
  },

  async toggleAutopay(slug: string): Promise<WorkspaceSubscription> {
    const response = await apiClient.post(`/api/v1/workspaces/${slug}/toggle-autopay/`);
    return response.data;
  },

  async checkoutSession(slug: string): Promise<{ checkout_url: string }> {
    const response = await apiClient.post(`/api/v1/workspaces/${slug}/checkout/`);
    return response.data;
  },

  // Chats & Channels API Operations
  async listChannels(workspaceSlug: string): Promise<Channel[]> {
    const response = await apiClient.get(`/api/v1/chats/workspaces/${workspaceSlug}/channels/`);
    return response.data;
  },

  async createChannel(workspaceSlug: string, name: string, description: string, isPrivate: boolean): Promise<Channel> {
    const response = await apiClient.post(`/api/v1/chats/workspaces/${workspaceSlug}/channels/`, {
      name,
      description,
      is_private: isPrivate
    });
    return response.data;
  },

  async listTopics(channelId: number): Promise<Topic[]> {
    const response = await apiClient.get(`/api/v1/chats/channels/${channelId}/topics/`);
    return response.data;
  },

  async createTopic(channelId: number, title: string, content: string): Promise<Topic> {
    const response = await apiClient.post(`/api/v1/chats/channels/${channelId}/topics/`, { title, content });
    return response.data;
  },

  async listReplies(topicId: number): Promise<Reply[]> {
    const response = await apiClient.get(`/api/v1/chats/topics/${topicId}/replies/`);
    return response.data;
  },

  async createReply(topicId: number, content: string): Promise<Reply> {
    const response = await apiClient.post(`/api/v1/chats/topics/${topicId}/replies/`, { content });
    return response.data;
  },

  // Voice Huddle / WebRTC Call API Operations
  async listCalls(workspaceSlug: string): Promise<CallSession[]> {
    const response = await apiClient.get(`/api/v1/calls/workspaces/${workspaceSlug}/calls/`);
    return response.data;
  },

  async createCall(workspaceSlug: string, receiverEmail: string): Promise<CallSession> {
    const response = await apiClient.post(`/api/v1/calls/workspaces/${workspaceSlug}/calls/`, { receiver_email: receiverEmail });
    return response.data;
  },

  async acceptCall(sessionId: number): Promise<CallSession> {
    const response = await apiClient.post(`/api/v1/calls/${sessionId}/accept/`);
    return response.data;
  },

  async endCall(sessionId: number): Promise<CallSession> {
    const response = await apiClient.post(`/api/v1/calls/${sessionId}/end/`);
    return response.data;
  },
};
