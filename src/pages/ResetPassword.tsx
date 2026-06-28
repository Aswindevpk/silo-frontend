import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <Card className="w-full max-w-md shadow-lg border-zinc-200/80 dark:border-zinc-800 text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-4">Invalid Link</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              The password reset token is missing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Please click the link directly from your password reset email, or request a new reset link.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link to="/forgot-password" className="w-full">
              <Button className="w-full" variant="outline">Request Reset Link</Button>
            </Link>
            <Link to="/login" className="text-xs text-zinc-500 hover:text-zinc-900 underline dark:text-zinc-400 dark:hover:text-zinc-50">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <ResetPasswordForm token={token} />
    </div>
  );
};
