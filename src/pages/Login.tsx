import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { PublicLayout } from '@/components/PublicLayout';

export const Login: React.FC = () => {
  return (
    <PublicLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <LoginForm />
      </div>
    </PublicLayout>
  );
};
