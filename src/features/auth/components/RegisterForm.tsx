import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '../schemas/AuthSchema';
import { useRegisterMutation } from '../hooks/useAuth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    registerMutation.mutate(
      {
        username: values.username,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success('Registration successful. Please check your email to verify your account.');
          setRegisteredEmail(values.email);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Registration failed. Please check the values.');
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    window.location.href = `${API_BASE_URL}/api/v1/users/auth/google/login`;
  };

  const isSubmitting = registerMutation.isPending;

  if (registeredEmail) {
    return (
      <div className="w-full max-w-md text-center bg-white p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold font-['Outfit'] tracking-tight mb-3">Check your email</h2>
        <p className="text-gray-500 mb-6">
          We have sent a verification link to <strong className="text-black">{registeredEmail}</strong>. Please click the link to activate your account.
        </p>

        <div className="flex flex-col gap-3">
          <Button className="w-full py-6 rounded-2xl bg-[#18181B] hover:bg-black font-bold text-lg" onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
          <Link
            to={`/register/verify-email?email=${encodeURIComponent(registeredEmail)}`}
            className="text-sm font-medium text-gray-400 hover:text-black transition-colors"
          >
            Manually Verify Email / Resend Email
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-['Outfit'] tracking-tight mb-2">Create an account</h2>
        <p className="text-gray-500">Enter your details to get started</p>
      </div>
      <div className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="johndoe"
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
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
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
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
        <span>Already have an account?</span>
        <Link
          to="/login"
          className="font-bold text-black hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};
