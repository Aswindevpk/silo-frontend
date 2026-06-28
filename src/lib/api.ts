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

// Token helper helpers
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for requests: add access token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 Unauthorized and ensure it's not a retry request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If it's a login request, don't attempt to refresh token
      if (originalRequest.url?.includes('/api/users/login/')) {
        const apiError = error.response?.data?.detail || error.response?.data?.message || error.message;
        return Promise.reject(new Error(apiError));
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/users/token/refresh/`, { refresh });
        const { access } = response.data;
        
        setTokens(access, refresh);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        processQueue(null, access);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
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

export const api = {
  // Auth Operations
  async register(data: RegisterRequest) {
    const response = await apiClient.post('/api/users/register/', data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.get(`/api/users/register/verify-email/?token=${token}`);
    return response.data;
  },

  async resendVerificationEmail(email: string) {
    const response = await apiClient.post('/api/users/register/resend-verification-email/', { email });
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest) {
    const response = await apiClient.post('/api/users/forgot-password/', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest) {
    const response = await apiClient.post('/api/users/reset-password/', data);
    return response.data;
  },

  async login(data: LoginRequest) {
    const response = await apiClient.post('/api/users/login/', data);
    return response.data;
  },

  async googleLogin(data: GoogleLoginRequest) {
    const response = await apiClient.post('/api/users/auth/google/', data);
    return response.data;
  },
};
