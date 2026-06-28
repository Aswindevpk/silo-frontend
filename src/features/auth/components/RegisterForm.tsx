import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '../schemas/schemas';
import { useRegisterMutation, useGoogleLoginMutation } from '../hooks/queries';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const googleLoginMutation = useGoogleLoginMutation();
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
          toast.success('Registration successful! Please check your email.');
          setRegisteredEmail(values.email);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Registration failed. Please check the values.');
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    const mockGoogleToken = 'mock_google_id_token_' + Math.random().toString(36).substring(7);
    googleLoginMutation.mutate(mockGoogleToken, {
      onSuccess: () => {
        toast.success('Signed in with Google!');
        navigate('/dashboard');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Google Sign-In failed.');
      },
    });
  };

  const isSubmitting = registerMutation.isPending || googleLoginMutation.isPending;

  if (registeredEmail) {
    return (
      <Card className="w-full max-w-md shadow-lg border-zinc-200/80 dark:border-zinc-800 text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight mt-4">Check your email</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            We have sent a verification link to <strong className="text-zinc-900 dark:text-white">{registeredEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Please click the link in the email to activate your account. Once verified, you can proceed to sign in.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
          <Link
            to={`/register/verify-email?email=${encodeURIComponent(registeredEmail)}`}
            className="text-xs text-zinc-500 hover:text-zinc-900 underline dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Manually Verify Email / Resend Email
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-zinc-200/80 dark:border-zinc-800">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight mt-2">Create your Silo Account</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Enter your details to register a new account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
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
        <span>Already have an account?</span>
        <Link
          to="/login"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
};
