import React from 'react';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { PublicLayout } from '@/components/PublicLayout';

export const Register: React.FC = () => {
  return (
    <PublicLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <RegisterForm />
      </div>
    </PublicLayout>
  );
};
