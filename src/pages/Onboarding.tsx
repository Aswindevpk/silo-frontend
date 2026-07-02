import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token') || '';

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [joinToken, setJoinToken] = useState(inviteToken);
  const [loading, setLoading] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName || !workspaceSlug) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const ws = await api.createWorkspace(workspaceName, workspaceSlug);
      toast.success(`Workspace "${ws.name}" created successfully!`);
      // Redirect to the new workspace's channel feed
      navigate(`/w/${ws.slug}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinToken) {
      toast.error('Please enter an invitation token.');
      return;
    }

    try {
      setLoading(true);
      await api.acceptWorkspaceInvitation(joinToken);
      toast.success('Invitation accepted successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation. The token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-50 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-zinc-950 font-bold text-xl">
          ⬢
        </div>
        <span className="text-2xl font-bold tracking-tight text-zinc-100">Silo Onboarding</span>
      </div>

      <div className="grid w-full max-w-4xl gap-8 md:grid-cols-2">
        {/* Create Workspace */}
        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-xl text-sky-400">Create a New Workspace</CardTitle>
            <CardDescription className="text-zinc-400">
              Set up a private, collaborative tenant for your software engineering team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Corporation"
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    // Auto-slugify
                    setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-sky-500 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-zinc-300">Workspace URL Slug</Label>
                <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md px-3">
                  <span className="text-zinc-500 text-sm">silo.app/w/</span>
                  <input
                    id="slug"
                    placeholder="acme-corp"
                    value={workspaceSlug}
                    onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    className="flex-1 bg-transparent py-2 text-sm focus:outline-none text-zinc-100"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold">
                {loading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Join Workspace */}
        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-xl text-emerald-400">Join Existing Workspace</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your invitation token/UUID key to connect with an established team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-zinc-300">Invitation Token</Label>
                <Input
                  id="token"
                  placeholder="Paste UUID token here"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-zinc-100 font-mono text-xs"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold mt-8">
                {loading ? 'Accepting...' : 'Accept Invitation & Join'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="mt-8 text-sm text-zinc-400 hover:text-zinc-200 underline"
      >
        Back to Dashboard
      </button>
    </div>
  );
};
