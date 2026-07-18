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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 text-[#18181B] py-12 font-sans">
      <div className="mb-10 flex items-center gap-3">
        <img src="/silo.png" alt="SILO Logo" className="h-8 w-auto object-contain" />
        <span className="text-2xl font-bold tracking-tight text-[#18181B] font-['Outfit']">Silo Onboarding</span>
      </div>

      <div className="grid w-full max-w-4xl gap-8 md:grid-cols-2">
        {/* Create Workspace */}
        <Card className="border-gray-200 bg-white text-[#18181B] shadow-sm rounded-[1.5rem]">
          <CardHeader>
            <CardTitle className="text-xl text-[#18181B] font-['Outfit']">Create a New Workspace</CardTitle>
            <CardDescription className="text-gray-500">
              Set up a private, collaborative space for your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#18181B] font-medium">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Corporation"
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    // Auto-slugify
                    setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="bg-white border-gray-200 focus-visible:ring-[#18181B] text-[#18181B] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-[#18181B] font-medium">Workspace URL Slug</Label>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 focus-within:ring-1 focus-within:ring-[#18181B]">
                  <span className="text-gray-400 text-sm font-medium">silo.app/w/</span>
                  <input
                    id="slug"
                    placeholder="acme-corp"
                    value={workspaceSlug}
                    onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    className="flex-1 bg-transparent py-2 text-sm focus:outline-none text-[#18181B]"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-[#18181B] text-white hover:bg-black font-semibold rounded-full h-10 mt-2 transition-all">
                {loading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Join Workspace */}
        <Card className="border-gray-200 bg-white text-[#18181B] shadow-sm rounded-[1.5rem]">
          <CardHeader>
            <CardTitle className="text-xl text-[#18181B] font-['Outfit']">Join Existing Workspace</CardTitle>
            <CardDescription className="text-gray-500">
              Enter your invitation token to connect with an established team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-[#18181B] font-medium">Invitation Token</Label>
                <Input
                  id="token"
                  placeholder="Paste token here"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  className="bg-white border-gray-200 focus-visible:ring-[#18181B] text-[#18181B] font-mono text-sm rounded-lg"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-white text-[#18181B] border border-gray-200 hover:bg-gray-50 font-semibold rounded-full h-10 mt-8 transition-all">
                {loading ? 'Accepting...' : 'Accept Invitation & Join'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="mt-10 text-sm font-medium text-gray-500 hover:text-[#18181B] transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
};
