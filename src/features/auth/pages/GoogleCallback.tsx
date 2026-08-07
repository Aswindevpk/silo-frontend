import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';

export const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorMsg = params.get('error');
    const userB64 = params.get('user');

    if (errorMsg) {
      toast.error(errorMsg);
      navigate('/login');
      return;
    }

    if (userB64) {
      try {
        const userJson = atob(userB64.replace(/-/g, '+').replace(/_/g, '/'));
        const user = JSON.parse(userJson);
        
        localStorage.setItem('user_profile', JSON.stringify(user));
        setUser(user);
        if (user.token) {
          localStorage.setItem('access_token', user.token);
        }

        toast.success('Successfully logged in with Google!');
        const pendingToken = localStorage.getItem('pendingWorkspaceToken');
        if (pendingToken) {
          navigate(`/join-workspace?token=${pendingToken}`);
        } else if (user.default_workspace_slug) {
          navigate(`/w/${user.default_workspace_slug}`);
        } else {
          navigate('/onboarding');
        }
      } catch (e) {
        console.error('Failed to parse user data from Google callback', e);
        toast.error('Google Sign-In failed.');
        navigate('/login');
      }
    } else {
      toast.error('Google Sign-In failed. Missing user data.');
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-zinc-500">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
};
