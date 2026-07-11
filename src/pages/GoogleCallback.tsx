import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userB64 = params.get('user');

    if (userB64) {
      try {
        const userJson = atob(userB64.replace(/-/g, '+').replace(/_/g, '/'));
        const user = JSON.parse(userJson);
        
        localStorage.setItem('user_profile', JSON.stringify(user));

        toast.success('Successfully logged in with Google!');
        navigate('/dashboard');
        window.location.reload(); 
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
