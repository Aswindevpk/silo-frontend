import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { api, type Channel, type Workspace } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Hash,
  BookOpen,
  Settings,
  Plus,
  ArrowLeft,
  Volume2,
  PhoneCall,
  PhoneOff,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export const WorkspaceLayout: React.FC = () => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const {
    incomingCall,
    callStatus,
    activeSession,
    acceptCall,
    rejectCall,
    endCall
  } = useCall();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // Channel Creation Modal State
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  // Fetch Workspace details and channels
  const loadWorkspaceDetails = async () => {
    if (!workspaceSlug) return;
    try {
      setLoading(true);
      const workspaces = await api.listWorkspaces();
      const ws = workspaces.find((w) => w.slug === workspaceSlug);
      
      if (!ws) {
        toast.error('Workspace not found.');
        navigate('/dashboard');
        return;
      }
      setWorkspace(ws);

      const chList = await api.listChannels(workspaceSlug);
      setChannels(chList);

      // If we are just on /w/:workspaceSlug, navigate to the first channel
      if (location.pathname === `/w/${workspaceSlug}` || location.pathname === `/w/${workspaceSlug}/`) {
        if (chList.length > 0) {
          navigate(`/w/${workspaceSlug}/ch/${chList[0].id}`);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceDetails();
  }, [workspaceSlug]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !newChannelName) return;

    try {
      const cleanName = newChannelName.toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
      const newCh = await api.createChannel(workspaceSlug, cleanName, newChannelDesc, newChannelPrivate);
      toast.success(`Channel #${newCh.name} created!`);
      setChannels([...channels, newCh]);
      setShowAddChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelPrivate(false);
      navigate(`/w/${workspaceSlug}/ch/${newCh.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create channel.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl text-sky-400 font-bold">⬢</div>
          <p className="text-zinc-400 text-sm">Synchronizing tenant context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* 1. Primary Left Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full shrink-0">
        {/* Workspace Title */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-xl text-sky-400">⬢</span>
            <span className="font-bold tracking-tight text-sm truncate max-w-[130px]">
              {workspace?.name}
            </span>
          </Link>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            title="Switch Workspace"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Channels Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Threaded Channels</span>
              <button
                onClick={() => setShowAddChannel(true)}
                className="hover:text-zinc-200"
                title="Create Channel"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isActive = location.pathname.includes(`/ch/${ch.id}`);
                return (
                  <Link
                    key={ch.id}
                    to={`/w/${workspaceSlug}/ch/${ch.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-sky-400 border-l-2 border-sky-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Hash className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                    {ch.is_private && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1 rounded">Private</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Docs/Wikis Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Living Documentation</span>
            </div>
            <div className="space-y-0.5">
              {/* API specification doc */}
              <Link
                to={`/w/${workspaceSlug}/docs/api-gateway-spec`}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.includes('/docs/api-gateway-spec')
                    ? 'bg-zinc-800 text-purple-400 border-l-2 border-purple-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0 text-purple-400" />
                <span className="truncate">📄 API Gateway V2 Spec</span>
              </Link>
              {/* Coturn doc */}
              <Link
                to={`/w/${workspaceSlug}/docs/coturn-traversal`}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.includes('/docs/coturn-traversal')
                    ? 'bg-zinc-800 text-purple-400 border-l-2 border-purple-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0 text-purple-400" />
                <span className="truncate">📄 Coturn Traversal Guide</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Workspace Footer Actions */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          {/* Billing Upgrade / Autopay Settings Link */}
          <Link
            to={`/w/${workspaceSlug}/settings/billing`}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
              location.pathname.includes('/settings/billing')
                ? 'bg-zinc-800 text-sky-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Settings className="h-4 w-4 text-zinc-400" />
            <span>Billing & Members</span>
          </Link>

          {/* User Info & Logout */}
          <div className="flex items-center justify-between p-2 rounded bg-zinc-950/40 text-xs">
            <div className="flex flex-col truncate max-w-[130px]">
              <span className="font-semibold text-zinc-300 truncate">{user?.username}</span>
              <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-zinc-500 hover:text-red-400 p-1"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace View Area */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
        <Outlet />

        {/* Voice Calling Signaling Floating Modal Overlay */}
        {incomingCall && (
          <div className="absolute bottom-6 right-6 z-50 bg-zinc-900 border-2 border-emerald-500 p-4 rounded-xl shadow-2xl w-80 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-full animate-pulse">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-zinc-100">Incoming Huddle Call</h4>
                <p className="text-xs text-zinc-400 truncate">{incomingCall.callerEmail}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={acceptCall}
                className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold text-xs"
              >
                Accept
              </Button>
              <Button
                onClick={rejectCall}
                variant="outline"
                className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs"
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        {callStatus !== 'idle' && !incomingCall && (
          <div className="absolute bottom-6 right-6 z-50 bg-zinc-900 border border-sky-500 p-4 rounded-xl shadow-2xl w-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                  {callStatus === 'calling' ? 'Dialing Connection...' : 'Voice Huddle Connected'}
                </span>
              </div>
              <button
                onClick={endCall}
                className="text-red-500 hover:text-red-400 p-1"
                title="End Call"
              >
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between bg-zinc-950/60 p-2 rounded">
              <span className="text-xs font-mono text-zinc-300">
                {activeSession?.receiver?.email || 'Huddle participant'}
              </span>
              <Volume2 className="h-4 w-4 text-sky-400" />
            </div>
          </div>
        )}
      </main>

      {/* 3. Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-sky-400">Create Threaded Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ch-name" className="text-zinc-300">Channel Name</Label>
                <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-0.5">
                  <span className="text-zinc-500 text-sm">#</span>
                  <input
                    id="ch-name"
                    required
                    placeholder="e.g. design-assets"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="flex-1 bg-transparent py-2 text-sm text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-desc" className="text-zinc-300">Description</Label>
                <Input
                  id="ch-desc"
                  placeholder="Topic focus of this channel"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="ch-private"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500"
                />
                <Label htmlFor="ch-private" className="text-zinc-300">Private Channel</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddChannel(false)}
                  className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold">
                  Create Channel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
