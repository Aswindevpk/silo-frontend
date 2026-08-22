import { useMutation } from '@tanstack/react-query';
import { api, type RegisterRequest } from '@/lib/api';
import { useAuth } from '@/features/auth/context/AuthContext';

export const useLoginMutation = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (data: { email?: string; password?: string }) => {
      return api.login(data);
    },
    onSuccess: (res: any) => {
      const user = res?.data?.user || res?.user;
      const token = res?.data?.token || res?.token;
      if (user) {
        localStorage.setItem('user_profile', JSON.stringify(user));
        if (token) localStorage.setItem('access_token', token);
        setUser(user);
      }
    },
  });
};

export const useGoogleLoginMutation = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (code: string) => {
      return api.googleLogin({ code, redirect_uri: 'postmessage' });
    },
    onSuccess: (res: any) => {
      const user = res?.data?.user || res?.user;
      const token = res?.data?.token || res?.token;
      if (user) {
        localStorage.setItem('user_profile', JSON.stringify(user));
        if (token) localStorage.setItem('access_token', token);
        setUser(user);
      }
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      return api.register(data);
    },
  });
};

export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      return api.verifyEmail(token);
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      return api.forgotPassword({ email });
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: { token: string; password?: string }) => {
      return api.resetPassword(data);
    },
  });
};

export const useResendEmailMutation = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      return api.resendVerificationEmail(email);
    },
  });
};

export const useLogoutMutation = () => {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return api.logout();
    },
    onSuccess: () => {
      logout();
    },
    onError: () => {
      logout(); // Force local logout even if server fails
    }
  });
};
