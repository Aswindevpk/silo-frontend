import { useMutation } from '@tanstack/react-query';
import { api, setTokens, type RegisterRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const useLoginMutation = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (data: { email?: string; password?: string }) => {
      return api.login(data);
    },
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      localStorage.setItem('user_profile', JSON.stringify(data.user));
      setUser(data.user);
    },
  });
};

export const useGoogleLoginMutation = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (code: string) => {
      return api.googleLogin({ code, redirect_uri: 'postmessage' });
    },
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      localStorage.setItem('user_profile', JSON.stringify(data.user));
      setUser(data.user);
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
