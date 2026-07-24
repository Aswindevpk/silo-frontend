import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Workspace } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, ArrowRight, LogOut } from 'lucide-react';
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
      if (list.length > 0) {
        // If the user has any workspaces (e.g. the default one), redirect to the first one.
        // They can switch or create new workspaces from the top navbar in the WorkspaceLayout.
        navigate(`/w/${list[0].slug}`);
        return;
      }
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
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-400">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#18181B] mx-auto" />
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
            Loading your workspaces...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#18181B] flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/silo.png" alt="SILO Logo" className="h-6 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight text-[#18181B] font-['Outfit']">Silo</span>
            </div>

            {/* Profile / Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right text-xs">
                <span className="font-semibold text-[#18181B]">{user?.username}</span>
                <span className="text-gray-500">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                className="h-9 rounded-full border-gray-200 hover:bg-gray-50 text-[#18181B] text-xs font-semibold px-4"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 flex-grow w-full space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold font-['Outfit'] text-[#18181B] tracking-tight mb-2">Welcome to Silo</h1>
            <p className="text-sm text-gray-500 max-w-lg">
              Select a workspace below or create a new one to start collaborating with your team.
            </p>
          </div>
          <Button
            onClick={() => navigate('/onboarding')}
            className="bg-[#18181B] text-white hover:bg-black font-semibold text-sm rounded-full px-6 py-5 shrink-0 shadow-sm"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <div className="grid w-full gap-8 md:grid-cols-2">
            {/* Create Workspace */}
            <Card className="border-gray-200 bg-white text-[#18181B] shadow-sm rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="text-xl text-[#18181B] font-['Outfit']">Create a New Workspace</CardTitle>
                <CardDescription className="text-gray-500">
                  Set up a private, collaborative space for your team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const name = target.name.value;
                  const slug = target.slug.value;
                  if (!name || !slug) {
                    toast.error('Please fill in all fields.');
                    return;
                  }
                  try {
                    setLoading(true);
                    const ws = await api.createWorkspace(name, slug);
                    toast.success(`Workspace "${ws.name}" created successfully!`);
                    navigate(`/w/${ws.slug}`);
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to create workspace.');
                    setLoading(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#18181B] font-medium">Workspace Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Acme Corporation"
                      onChange={(e) => {
                        const slugInput = document.getElementById('slug') as HTMLInputElement;
                        if (slugInput) {
                          slugInput.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        }
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
                        name="slug"
                        placeholder="acme-corp"
                        className="flex-1 bg-transparent py-2 text-sm focus:outline-none text-[#18181B]"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-[#18181B] text-white hover:bg-black font-semibold rounded-full h-10 mt-2 transition-all">
                    Create Workspace
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
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const token = target.token.value;
                  if (!token) {
                    toast.error('Please enter an invitation token.');
                    return;
                  }
                  try {
                    setLoading(true);
                    await api.acceptWorkspaceInvitation(token);
                    toast.success('Invitation accepted successfully!');
                    fetchWorkspaces();
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to accept invitation. The token may be expired.');
                    setLoading(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-[#18181B] font-medium">Invitation Token</Label>
                    <Input
                      id="token"
                      name="token"
                      placeholder="Paste token here"
                      className="bg-white border-gray-200 focus-visible:ring-[#18181B] text-[#18181B] font-mono text-sm rounded-lg"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-white text-[#18181B] border border-gray-200 hover:bg-gray-50 font-semibold rounded-full h-10 mt-8 transition-all">
                    Accept Invitation & Join
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                onClick={() => navigate(`/w/${ws.slug}`)}
                className="border border-gray-100 bg-white hover:border-gray-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 cursor-pointer group flex flex-col justify-between text-left rounded-[1.5rem] overflow-hidden"
              >
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#18181B] group-hover:text-white transition-colors">
                      <span className="text-[#18181B] group-hover:text-white text-sm font-extrabold transition-colors">⬢</span>
                    </div>
                    <CardTitle className="text-lg text-[#18181B] font-bold font-['Outfit']">
                      {ws.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-gray-500 font-medium">
                    silo.app/w/{ws.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center text-sm text-[#18181B] font-semibold py-4 px-6 border-t border-gray-50 bg-gray-50/50 group-hover:bg-gray-50 transition-colors">
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
