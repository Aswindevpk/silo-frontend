import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const Login: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <LoginForm />
    </div>
  );
};
