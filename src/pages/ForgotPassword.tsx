import React from 'react';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const ForgotPassword: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <ForgotPasswordForm />
    </div>
  );
};
