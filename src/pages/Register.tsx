import React from 'react';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const Register: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <RegisterForm />
    </div>
  );
};
