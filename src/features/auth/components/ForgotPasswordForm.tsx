import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/AuthSchema';
import { useForgotPasswordMutation } from '../hooks/useAuth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export const ForgotPasswordForm: React.FC = () => {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [isSent, setIsSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(values.email, {
      onSuccess: () => {
        toast.success('If an account with this email exists, a password reset link has been sent.');
        setSubmittedEmail(values.email);
        setIsSent(true);
      },
      onError: (err: any) => {
        if (err.status === 429) {
          toast.error(err.message);
        } else {
          toast.error(err.message || 'Failed to send password reset email.');
        }
      },
    });
  };

  const isSubmitting = forgotPasswordMutation.isPending;

  if (isSent) {
    return (
      <Card className="w-full max-w-md shadow-lg border-zinc-200/80 dark:border-zinc-800 text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight mt-4">Check your inbox</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            We have sent password reset instructions to <strong className="text-zinc-900 dark:text-white">{submittedEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Please click the link in the email to reset your password. If you don't receive it within a few minutes, check your spam folder.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/login" className="w-full">
            <Button className="w-full">Back to Sign In</Button>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight mt-2">Forgot Password</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
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
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Sending instructions...' : 'Send Reset Link'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <Link to="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50">
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
};
