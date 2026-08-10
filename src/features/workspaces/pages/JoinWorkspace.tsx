import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const JoinWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (token) {
      // Store token in localStorage so it persists across registration/email verification
      localStorage.setItem('pendingWorkspaceToken', token);
    }
  }, [token, isAuthenticated, loading]);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    try {
      const res = await api.acceptWorkspaceInvitation(token);
      toast.success((res as any).detail || res.message || "Successfully joined workspace!");
      localStorage.removeItem('pendingWorkspaceToken');
      // Try to navigate to the new workspace, or just go to root to auto-redirect
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to join workspace. It may be expired or invalid.");
      localStorage.removeItem('pendingWorkspaceToken');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!token) {
    return (
      <PublicLayout>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
            <h2 className="text-2xl font-bold mb-4">Invalid Link</h2>
            <p className="text-gray-500 mb-8">This invitation link is missing a token or is invalid.</p>
            <Button onClick={() => navigate('/')} className="w-full py-6 rounded-2xl">Go to Home</Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
            <h2 className="text-3xl font-bold font-['Outfit'] mb-4">You've been invited!</h2>
            <p className="text-gray-500 mb-8">Please log in or create an account to accept the workspace invitation.</p>
            <div className="flex flex-col gap-4">
              <Button onClick={() => navigate('/register')} className="w-full py-6 rounded-2xl bg-black hover:bg-gray-800 text-lg">Sign Up</Button>
              <Button variant="outline" onClick={() => navigate('/login')} className="w-full py-6 rounded-2xl border-gray-200 text-lg">Log In</Button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
          <h2 className="text-3xl font-bold font-['Outfit'] mb-4">Accept Invitation</h2>
          <p className="text-gray-500 mb-8">You are currently logged in. Click below to join the workspace.</p>
          <Button 
            onClick={handleJoin} 
            className="w-full py-6 rounded-2xl bg-[#18181B] hover:bg-black font-bold text-lg"
            disabled={joining}
          >
            {joining ? 'Joining...' : 'Join Workspace'}
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};
