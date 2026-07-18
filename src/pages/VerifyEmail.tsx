import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useVerifyEmailMutation, useResendEmailMutation } from '@/features/auth/hooks/queries';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const initialEmail = searchParams.get('email') || '';
  const navigate = useNavigate();

  const verifyEmailMutation = useVerifyEmailMutation();
  const resendEmailMutation = useResendEmailMutation();

  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const hasAttempted = React.useRef(false);

  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      
      const verify = async () => {
        setVerificationStatus('verifying');
        try {
          await verifyEmailMutation.mutateAsync(token);
          setVerificationStatus('success');
          toast.success('Email verified successfully! You can now log in.');
        } catch (err: any) {
          setVerificationStatus('error');
          setErrorMessage(err.message || 'Verification failed. The token may be invalid or expired.');
        }
      };

      verify();
    }
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    resendEmailMutation.mutate(email, {
      onSuccess: (res: any) => {
        toast.success(res?.detail || 'Verification email resent! Please check your inbox.');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to resend verification email.');
      },
    });
  };

  const isVerifying = verificationStatus === 'verifying';
  const isSuccess = verificationStatus === 'success';
  const isError = verificationStatus === 'error';
  const isResending = resendEmailMutation.isPending;

  // Initial state if no token in URL
  const isIdle = !token || verificationStatus === 'idle';

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-lg border-zinc-200/80 dark:border-zinc-800 text-center">
        {isVerifying && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight">Verifying your email</CardTitle>
              <CardDescription>Please wait while we confirm your account...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent dark:border-zinc-100" />
            </CardContent>
          </>
        )}

        {isSuccess && (
          <>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight mt-4">Verification Complete</CardTitle>
              <CardDescription>Your email address has been successfully verified.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You can now log in and start using your Silo dashboard.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </CardFooter>
          </>
        )}

        {isError && (
          <>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight mt-4">Verification Failed</CardTitle>
              <CardDescription className="text-red-500 font-medium">{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-4 pt-4 text-left">
                <form onSubmit={handleResend} className="grid gap-3">
                  <Label htmlFor="resend-email" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Resend Verification Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent"
                      required
                    />
                    <Button type="submit" disabled={isResending} className="shrink-0">
                      {isResending ? 'Resending...' : 'Resend'}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center text-sm">
              <Link to="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50">
                Back to Sign In
              </Link>
            </CardFooter>
          </>
        )}

        {isIdle && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight">Verify Email</CardTitle>
              <CardDescription>Please request a verification link or enter your email to resend one.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResend} className="grid gap-4 text-left">
                <div className="grid gap-2">
                  <Label htmlFor="idle-email">Email Address</Label>
                  <Input
                    id="idle-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent"
                    required
                  />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={isResending}>
                  {isResending ? 'Sending link...' : 'Send Verification Link'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm">
              <Link to="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50">
                Back to Sign In
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};
