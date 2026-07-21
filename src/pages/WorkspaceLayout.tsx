import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { EphemeralChat } from '@/components/EphemeralChat';
import { api, type Channel, type Workspace } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { usePresence } from '@/hooks/usePresence';
import { type WorkspaceMember } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Hash,
  BookOpen,
  Settings,
  Plus,
  ArrowLeft,
  PhoneCall,
  LogOut,
  Video,
  MessageSquare,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';

export const WorkspaceLayout: React.FC = () => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const {
    // incomingCall,
    // callStatus,
    // activeSession,
    // acceptCall,
    // rejectCall,
    // endCall,
    startCall
  } = useCall();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = usePresence(workspaceSlug);
  const { isConnected, toggleConnection } = useWebSocket();

  // Expanded member state
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [chatTargetEmail, setChatTargetEmail] = useState<string | null>(null);

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

      const memList = await api.listWorkspaceMembers(workspaceSlug);
      setMembers(memList);

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
      <div className="flex min-h-screen items-center justify-center bg-white text-[#18181B]">
        <div className="text-center space-y-4">
          <img src="/silo.png" alt="SILO Logo" className="h-10 w-auto object-contain animate-pulse" />
          <p className="text-gray-500 text-sm">Synchronizing tenant context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-[#18181B] overflow-hidden font-sans">
      {/* 1. Primary Left Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
        {/* Workspace Title */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <img src="/silo.png" alt="SILO Logo" className="h-6 w-auto object-contain" />
            <span className="font-bold tracking-tight text-sm truncate max-w-[100px]">
              {workspace?.name}
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleConnection}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                isConnected ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-500 bg-red-50 hover:bg-red-100'
              }`}
              title={isConnected ? 'Disconnect WebSocket' : 'Connect WebSocket'}
            >
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1 rounded text-gray-500 hover:text-[#18181B] hover:bg-gray-100"
              title="Switch Workspace"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Channels Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#18181B]0">
              <span>Threaded Channels</span>
              <button
                onClick={() => setShowAddChannel(true)}
                className="hover:text-[#18181B]"
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
                        ? 'bg-gray-100 text-[#18181B] border-l-2 border-[#18181B]'
                        : 'text-gray-500 hover:text-[#18181B] hover:bg-gray-50'
                    }`}
                  >
                    <Hash className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                    {ch.is_private && <span className="text-[10px] bg-gray-100 text-[#18181B]0 px-1 rounded">Private</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Docs/Wikis Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#18181B]0">
              <span>Living Documentation</span>
            </div>
            <div className="space-y-0.5">
              {/* API specification doc */}
              <Link
                to={`/w/${workspaceSlug}/docs/api-gateway-spec`}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.includes('/docs/api-gateway-spec')
                    ? 'bg-gray-100 text-[#18181B] border-l-2 border-[#18181B]'
                    : 'text-gray-500 hover:text-[#18181B] hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0 text-[#18181B]" />
                <span className="truncate">📄 API Gateway V2 Spec</span>
              </Link>
              {/* Coturn doc */}
              <Link
                to={`/w/${workspaceSlug}/docs/coturn-traversal`}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.includes('/docs/coturn-traversal')
                    ? 'bg-gray-100 text-[#18181B] border-l-2 border-[#18181B]'
                    : 'text-gray-500 hover:text-[#18181B] hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0 text-[#18181B]" />
                <span className="truncate">📄 Coturn Traversal Guide</span>
              </Link>
            </div>
          </div>

          {/* Direct Messages & Members Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#18181B]0">
              <span>Direct Messages</span>
            </div>
            <div className="space-y-0.5">
              {members.map((member) => {
                const isExpanded = expandedMemberId === member.user.id;
                const isCurrentUser = member.user.email === user?.email; // Use email since user.id is not in AuthContext User
                const isOnlineStatus = isOnline(member.user.id);
                
                return (
                  <div key={member.id} className="flex flex-col">
                    <button
                      onClick={() => setExpandedMemberId(isExpanded ? null : member.user.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors w-full ${
                        isExpanded
                          ? 'bg-gray-100 text-[#18181B]'
                          : 'text-gray-500 hover:text-[#18181B] hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative">
                        <div className="h-5 w-5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                          {member.user.username.charAt(0)}
                        </div>
                        {isOnlineStatus && (
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#18181B] rounded-full border border-white"></div>
                        )}
                      </div>
                      <span className="truncate flex-1 text-left">{member.user.username} {isCurrentUser && '(You)'}</span>
                    </button>
                    
                    {/* Action Bar */}
                    {isExpanded && !isCurrentUser && (
                      <div className="flex items-center gap-1 pl-9 pr-2 py-1 pb-2">
                        <button
                          onClick={() => {
                            if (workspaceSlug) startCall(workspaceSlug, member.user.email, false);
                          }}
                          className="flex-1 flex justify-center items-center py-1.5 bg-gray-100 hover:bg-gray-100 hover:text-[#18181B] text-gray-500 rounded transition-colors"
                          title="Voice Call"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (workspaceSlug) startCall(workspaceSlug, member.user.email, true);
                          }}
                          className="flex-1 flex justify-center items-center py-1.5 bg-gray-100 hover:bg-gray-100 hover:text-[#18181B] text-gray-500 rounded transition-colors"
                          title="Video Call"
                        >
                          <Video className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setChatTargetEmail(member.user.email);
                          }}
                          className="flex-1 flex justify-center items-center py-1.5 bg-gray-100 hover:bg-gray-100 hover:text-[#18181B] text-gray-500 rounded transition-colors"
                          title="Message"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Workspace Footer Actions */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {/* Billing Upgrade / Autopay Settings Link */}
          <Link
            to={`/w/${workspaceSlug}/settings/billing`}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
              location.pathname.includes('/settings/billing')
                ? 'bg-gray-100 text-[#18181B]'
                : 'text-gray-500 hover:text-[#18181B] hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4 text-gray-500" />
            <span>Billing & Members</span>
          </Link>

          {/* User Info & Logout */}
          <div className="flex items-center justify-between p-2 rounded bg-white/40 text-xs">
            <div className="flex flex-col truncate max-w-[130px]">
              <span className="font-semibold text-gray-700 truncate">{user?.username}</span>
              <span className="text-[10px] text-[#18181B]0 truncate">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-[#18181B]0 hover:text-red-400 p-1"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace View Area */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
        <Outlet />

      </main>
      <EphemeralChat 
        targetEmail={chatTargetEmail} 
        onClose={() => setChatTargetEmail(null)}
        onIncomingMessage={(senderEmail) => setChatTargetEmail(senderEmail)}
      />

      {/* 3. Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 max-w-md w-full rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#18181B]">Create Threaded Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ch-name" className="text-gray-700">Channel Name</Label>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-3 py-0.5">
                  <span className="text-[#18181B]0 text-sm">#</span>
                  <input
                    id="ch-name"
                    required
                    placeholder="e.g. design-assets"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="flex-1 bg-transparent py-2 text-sm text-[#18181B] focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-desc" className="text-gray-700">Description</Label>
                <Input
                  id="ch-desc"
                  placeholder="Topic focus of this channel"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="bg-white border-gray-200 text-[#18181B]"
                />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="ch-private"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="rounded border-gray-200 bg-white text-[#18181B] focus:ring-[#18181B]"
                />
                <Label htmlFor="ch-private" className="text-gray-700">Private Channel</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddChannel(false)}
                  className="border-gray-200 hover:bg-gray-100 text-gray-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#18181B] text-white hover:bg-black font-bold">
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
