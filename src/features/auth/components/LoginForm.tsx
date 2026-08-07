import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../schemas/schemas';
import { useLoginMutation, useResendEmailMutation } from '../hooks/queries';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const loginMutation = useLoginMutation();
  const resendEmailMutation = useResendEmailMutation();

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldownLeft > 0) {
      timer = setInterval(() => {
        setCooldownLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownLeft]);

  const handleResend = () => {
    if (!unverifiedEmail) return;
    resendEmailMutation.mutate(unverifiedEmail, {
      onSuccess: () => {
        toast.success("Verification email resent successfully!");
        setCooldownLeft(120);
      },
      onError: (err: any) => {
        if (err.status === 429) {
          const match = err.message?.match(/(\d+)/);
          const seconds = match ? parseInt(match[0], 10) : 120;
          setCooldownLeft(seconds);
          toast.error(err.message);
        } else {
          toast.error(err.message || "Failed to resend email.");
        }
      }
    });
  };

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginInput) => {
    loginMutation.mutate(values, {
      onSuccess: (res: any) => {
        toast.success('Successfully logged in!');
        const user = res?.data?.user || res?.user;
        
        localStorage.setItem('user_profile', JSON.stringify(user));
        setUser(user);

        const pendingToken = localStorage.getItem('pendingWorkspaceToken');
        if (pendingToken) {
          navigate(`/join-workspace?token=${pendingToken}`);
        } else if (user?.default_workspace_slug) {
          navigate(`/w/${user.default_workspace_slug}`);
        } else {
          navigate('/onboarding');
        }
      },
      onError: (err: any) => {
        if (err.errors?.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(values.email);
        } else {
          setUnverifiedEmail(null);
        }
        toast.error(err.message || 'Login failed. Please verify your credentials.');
      },
    });
  };

  const handleGoogleLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    window.location.href = `${API_BASE_URL}/api/v1/users/auth/google/login`;
  };

  const isSubmitting = loginMutation.isPending;

  return (
    <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-['Outfit'] tracking-tight mb-2">Welcome back</h2>
        <p className="text-gray-500">Enter your credentials to access your account</p>
      </div>
      <div className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      disabled={isSubmitting}
                      className="bg-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      disabled={isSubmitting}
                      className="bg-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full py-6 mt-4 rounded-2xl bg-[#18181B] hover:bg-black font-bold text-lg" disabled={isSubmitting}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>

            {unverifiedEmail && (
              <div className="mt-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col items-center">
                <p className="text-sm text-orange-800 text-center mb-3">
                  Your email is not verified. Please check your inbox or resend the link.
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-100"
                  onClick={handleResend}
                  disabled={cooldownLeft > 0 || resendEmailMutation.isPending}
                >
                  {resendEmailMutation.isPending 
                    ? 'Sending...' 
                    : cooldownLeft > 0 
                      ? `Resend available in ${cooldownLeft}s` 
                      : 'Resend Verification Email'}
                </Button>
              </div>
            )}
          </form>
        </Form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-400 text-xs uppercase">Or continue with</span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        <Button variant="outline" className="w-full py-6 rounded-2xl border-gray-200 hover:bg-gray-50 font-bold" onClick={handleGoogleLogin} disabled={isSubmitting}>
          <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Continue with Google
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-8 text-sm text-gray-500">
        <span>Don't have an account?</span>
        <Link
          to="/register"
          className="font-bold text-black hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
};
