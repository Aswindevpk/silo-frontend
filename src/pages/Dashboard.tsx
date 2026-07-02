import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Workspace } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, ArrowRight, LogOut, Layout } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const list = await api.listWorkspaces();
      setWorkspaces(list);
    } catch (err: any) {
      toast.error('Failed to load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto" />
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">
            Fetching organization spaces...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-zinc-950 font-extrabold text-lg">
                ⬢
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-100">Silo Workspace Hub</span>
            </div>

            {/* Profile / Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right text-xs">
                <span className="font-semibold text-zinc-200">{user?.username}</span>
                <span className="text-zinc-500">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                className="h-8 border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 flex-grow w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Welcome to Silo</h1>
            <p className="text-sm text-zinc-400">
              Select an organization workspace below or launch a new custom workspace to get started.
            </p>
          </div>
          <Button
            onClick={() => navigate('/onboarding')}
            className="bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold text-xs shrink-0"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Create Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <Card className="border-2 border-dashed border-zinc-800 bg-zinc-900/20 text-center py-16">
            <CardContent className="space-y-4">
              <Layout className="h-12 w-12 mx-auto text-zinc-700" />
              <div>
                <h4 className="font-bold text-zinc-300">No workspaces found</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  You are not currently a member of any organization workspaces. Create one above, or enter an invitation token to join an existing team space.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/onboarding')}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold"
              >
                Go to Onboarding Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                onClick={() => navigate(`/w/${ws.slug}`)}
                className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-sky-500/40 transition-all cursor-pointer group flex flex-col justify-between text-left"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 text-lg">⬢</span>
                    <CardTitle className="text-base text-zinc-100 font-bold group-hover:text-sky-400 transition-colors">
                      {ws.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-zinc-500 font-mono">
                    URL: silo.app/w/{ws.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center text-xs text-sky-400 font-semibold pt-2 border-t border-zinc-800/40">
                  <span>Enter Workspace</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
