import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../schemas/schemas';
import { useLoginMutation, useGoogleLoginMutation } from '../hooks/queries';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGoogleLogin } from '@react-oauth/google';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const googleLoginMutation = useGoogleLoginMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginInput) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Login failed. Please verify your credentials.');
      },
    });
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (codeResponse) => {
      googleLoginMutation.mutate(codeResponse.code, {
        onSuccess: () => {
          toast.success('Signed in with Google!');
          navigate('/dashboard');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Google Sign-In failed.');
        },
      });
    },
    onError: (error) => {
      console.error('Google Sign-In failed:', error);
      toast.error('Google Sign-In was cancelled or failed.');
    },
  });

  const isSubmitting = loginMutation.isPending || googleLoginMutation.isPending;

  return (
    <Card className="w-full max-w-md shadow-lg border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight mt-2">Welcome back to Silo</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-400 text-xs uppercase">Or continue with</span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin} disabled={isSubmitting}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span>Don't have an account?</span>
        <Link
          to="/register"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
};
