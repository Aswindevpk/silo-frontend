import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { api, type Channel, type Workspace } from '@/lib/api';
import { useAuth } from '@/features/auth/context/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import { type WorkspaceMember } from '@/lib/api';
import { useCreateWorkspaceMutation, useSetDefaultWorkspaceMutation } from '@/features/workspaces/hooks/useWorkspace';

import { RightSidebar } from '@/components/RightSidebar';
import { SyncUpDock } from '@/features/chat/components/SyncUpDock';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Hash,
  Settings,
  Plus,
  LogOut,
  Video,
  ChevronDown,
  PanelLeftClose,
  LayoutDashboard,
  Users,
  AppWindow,
  LayoutTemplate,
  FileEdit,
  Zap,
  Tags,
  VolumeX,
  Bell,
  Palette,
  Command,
  Download,
  ExternalLink,
  HelpCircle,
  Bug,
  CheckCircle2,
  Pin,
  Briefcase,
  Clock,
  FileText,
  Mic,
  AlarmClock,
  File,
  Monitor,
  Bot,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export const WorkspaceLayout: React.FC = () => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { isOnline } = usePresence(workspaceSlug);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  // Layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Channel Creation Modal State
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  // Workspace Creation Modal State
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  // Fetch Workspace details and channels
  const loadWorkspaceDetails = async () => {
    if (!workspaceSlug) return;
    try {
      setLoading(true);
      const workspacesList = await api.listWorkspaces();
      const ws = workspacesList.find((w) => w.slug === workspaceSlug);

      if (!ws) {
        toast.error('Workspace not found.');
        navigate('/');
        return;
      }
      setWorkspace(ws);
      setAllWorkspaces(workspacesList);

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

  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const setDefaultWorkspaceMutation = useSetDefaultWorkspaceMutation();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName) return;

    setCreatingWorkspace(true);
    createWorkspaceMutation.mutate(
      { name: newWorkspaceName },
      {
        onSuccess: (ws) => {
          toast.success('Workspace created successfully!');
          setShowAddWorkspace(false);
          setNewWorkspaceName('');
          navigate(`/w/${ws.slug}`);
          setCreatingWorkspace(false);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to create workspace.');
          setCreatingWorkspace(false);
        }
      }
    );
  };

  const handleSetDefaultWorkspace = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    setDefaultWorkspaceMutation.mutate(slug, {
      onSuccess: () => {
        toast.success('Default workspace updated!');
        setAllWorkspaces(prev => prev.map(w => ({
          ...w,
          is_default: w.slug === slug
        })));
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to set default workspace.');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#18181B]">
        <div className="text-center space-y-4">
          <img src="/silo.png" alt="SILO Logo" className="h-10 w-auto object-contain animate-pulse mx-auto" />
          <p className="text-muted-foreground text-sm">Synchronizing tenant context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/silo.png" alt="SILO Logo" className="h-6 w-auto object-contain" />
          </Link>

          <Separator orientation="vertical" className="h-6" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="font-semibold flex items-center gap-2 bg-gray-100/80 hover:bg-gray-200/80 text-sm px-2 py-1.5 h-auto rounded-md border border-gray-200">
                <div className="h-5 w-5 bg-teal-500 rounded text-white flex items-center justify-center text-xs font-bold mr-0.5">
                  {workspace?.name.charAt(0).toUpperCase()}
                </div>
                {workspace?.name} <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-2 rounded-xl shadow-lg border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-teal-500 rounded-lg text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {workspace?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[15px]">{workspace?.name}</span>
                      {workspace?.is_default && (
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">Free Forever · Upgrade</span>
                  </div>
                </div>
              </div>

              {/* Settings & People Buttons */}
              <div className="flex items-center gap-2 px-2 py-2">
                <Button variant="outline" size="sm" className="w-1/2 flex items-center justify-center gap-2 text-xs h-8 border-gray-200" onClick={() => navigate(`/w/${workspaceSlug}/settings/billing`)}>
                  <Settings className="h-3.5 w-3.5" /> Settings
                </Button>
                <Button variant="outline" size="sm" className="w-1/2 flex items-center justify-center gap-2 text-xs h-8 border-gray-200" onClick={() => navigate(`/w/${workspaceSlug}/people`)}>
                  <Users className="h-3.5 w-3.5" /> People
                </Button>
              </div>

              <DropdownMenuSeparator className="my-1 border-gray-100" />

              <div className="px-3 py-1.5">
                <span className="text-[11px] text-gray-500 font-medium">Manage</span>
              </div>

              <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] flex items-center gap-3 focus:bg-gray-50">
                <AppWindow className="h-4 w-4 text-gray-600" /> Apps
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] flex items-center gap-3 focus:bg-gray-50">
                <LayoutTemplate className="h-4 w-4 text-gray-600" /> Templates
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] flex items-center gap-3 focus:bg-gray-50">
                <FileEdit className="h-4 w-4 text-gray-600" /> Custom Fields
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] flex items-center gap-3 focus:bg-gray-50">
                <Zap className="h-4 w-4 text-gray-600" /> Automations
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-1.5 px-3 text-[13px] flex items-center gap-3 justify-between focus:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Tags className="h-4 w-4 text-gray-600" /> Tag Manager
                </div>
                <span className="text-[10px] font-semibold bg-[#EBEBFE] text-[#5851DE] px-1.5 py-0.5 rounded">New</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-gray-100" />

              <div className="px-3 py-1.5 mt-1">
                <span className="text-[11px] text-gray-500 font-medium">Switch Workspaces</span>
              </div>

              {allWorkspaces.filter(w => w.id !== workspace?.id).map(w => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => navigate(`/w/${w.slug}`)}
                  className="cursor-pointer py-2 px-3 text-[13px] flex items-center justify-between focus:bg-gray-50 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-6 w-6 bg-teal-600 rounded text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700 truncate">{w.name}</span>
                    {w.is_default && (
                      <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">Default</span>
                    )}
                  </div>
                  {!w.is_default && (
                    <button
                      onClick={(e) => handleSetDefaultWorkspace(e, w.slug)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-all"
                    >
                      Set Default
                    </button>
                  )}
                </DropdownMenuItem>
              ))}

              <div className="p-2 mt-1">
                <Button variant="outline" className="w-full justify-center flex items-center gap-2 text-[13px] text-gray-700 font-medium hover:bg-gray-50 h-9 border-gray-200 rounded-lg shadow-sm" onClick={() => setShowAddWorkspace(true)}>
                  <Plus className="h-3.5 w-3.5" /> Create Workspace
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] p-0 rounded-xl shadow-lg border border-gray-200" align="end" forceMount>
              {/* Header Profile */}
              <div className="p-4 flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-800 text-white font-semibold">
                      {user?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm leading-tight text-gray-900">{user?.username}</span>
                  <span className="text-xs text-gray-500 mt-0.5">Online</span>
                </div>
              </div>

              {/* Status Input */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                  <span className="text-gray-400">😊</span>
                  <span>Set status</span>
                </div>
              </div>

              {/* Notifications & Settings Group */}
              <div className="py-1">
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center justify-between focus:bg-gray-50">
                  <div className="flex items-center gap-3 text-gray-700">
                    <VolumeX className="h-4 w-4" /> Mute notifications
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-gray-400" />
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-gray-100" />

              <div className="py-1">
                <DropdownMenuItem onClick={() => navigate(`/w/${workspaceSlug}/settings/billing`)} className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Bell className="h-4 w-4" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Palette className="h-4 w-4" /> Themes
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Command className="h-4 w-4" /> Keyboard shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center justify-between text-gray-700 focus:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Download className="h-4 w-4" /> Download SILO App
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center justify-between text-gray-700 focus:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4" /> Help
                  </div>
                  <Bug className="h-3.5 w-3.5 text-gray-400" />
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-gray-100" />

              {/* Personal Tools */}
              <div className="py-1">
                <div className="px-4 py-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Personal Tools</span>
                </div>

                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center justify-between text-gray-700 focus:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4" /> Create task
                  </div>
                  <Pin className="h-3 w-3 text-gray-400 rotate-45" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Briefcase className="h-4 w-4" /> My Work
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Clock className="h-4 w-4" /> Track Time
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <FileText className="h-4 w-4" /> Notepad
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center justify-between text-gray-700 focus:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Video className="h-4 w-4" /> Record a Clip
                  </div>
                  <Pin className="h-3 w-3 text-gray-400 rotate-45" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center justify-between text-gray-700 focus:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Mic className="h-4 w-4" /> Talk to Text
                  </div>
                  <Pin className="h-3 w-3 text-gray-400 rotate-45" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <AlarmClock className="h-4 w-4" /> Create Reminder
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <File className="h-4 w-4" /> Create Doc
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Monitor className="h-4 w-4" /> Create Whiteboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/w/${workspaceSlug}/people`)} className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Users className="h-4 w-4" /> View People
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <LayoutDashboard className="h-4 w-4" /> Create Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Bot className="h-4 w-4" /> AI Notetaker
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-gray-100" />

              <div className="py-1">
                <DropdownMenuItem className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <Trash2 className="h-4 w-4" /> Trash
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="cursor-pointer py-1.5 px-4 text-[13px] flex items-center gap-3 text-gray-700 focus:bg-gray-50">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 2. MAIN LAYOUT (SIDEBAR + OUTLET) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} border-r bg-muted/20 flex flex-col transition-all duration-300 ease-in-out shrink-0 z-0`}>
          <div className="flex h-12 items-center justify-between border-b px-2">
            {!isSidebarCollapsed && <span className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Menu</span>}
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`ml-auto h-8 w-8 text-muted-foreground hover:text-foreground ${isSidebarCollapsed ? 'mx-auto ml-0' : ''}`}>
              <PanelLeftClose className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {/* Channels Section */}
            <div className="p-2">
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Channels</span>
                  <button onClick={() => setShowAddChannel(true)} className="hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {channels.map((ch) => {
                  const isActive = location.pathname.includes(`/ch/${ch.id}`);
                  const btn = (
                    <Link
                      key={ch.id}
                      to={`/w/${workspaceSlug}/ch/${ch.id}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Hash className="h-4 w-4 shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate flex-1">{ch.name}</span>}
                      {!isSidebarCollapsed && ch.is_private && <span className="text-[10px] bg-muted px-1 rounded">Priv</span>}
                    </Link>
                  );
                  return isSidebarCollapsed ? (
                    <Tooltip key={ch.id} delayDuration={0}>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {ch.name} {ch.is_private && <span className="text-[10px] bg-muted text-foreground px-1 rounded">Private</span>}
                      </TooltipContent>
                    </Tooltip>
                  ) : btn;
                })}
                {isSidebarCollapsed && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button onClick={() => setShowAddChannel(true)} className="flex w-full items-center justify-center py-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground mt-1">
                        <Plus className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Add Channel</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* <Separator className="my-2 mx-4 w-auto opacity-50" /> */}

            {/* Docs Section */}
            {/* <div className="p-2">
                {!isSidebarCollapsed && (
                  <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Documentation</span>
                  </div>
                )}
                <div className="space-y-1">
                  {[
                    { id: 'api-gateway-spec', name: 'API Gateway V2 Spec', icon: BookOpen },
                    { id: 'coturn-traversal', name: 'Coturn Traversal Guide', icon: BookOpen }
                  ].map(doc => {
                    const isActive = location.pathname.includes(`/docs/${doc.id}`);
                    const Icon = doc.icon;
                    const btn = (
                      <Link
                        key={doc.id}
                        to={`/w/${workspaceSlug}/docs/${doc.id}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!isSidebarCollapsed && <span className="truncate flex-1">{doc.name}</span>}
                      </Link>
                    );
                    return isSidebarCollapsed ? (
                      <Tooltip key={doc.id} delayDuration={0}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="right">{doc.name}</TooltipContent>
                      </Tooltip>
                    ) : btn;
                  })}
                </div>
             </div> */}

            <Separator className="my-2 mx-4 w-auto opacity-50" />

            {/* DMs Section */}
            <div className="p-2">
              {!isSidebarCollapsed && (
                <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Direct Messages</span>
                  <button onClick={() => navigate(`/w/${workspaceSlug}/people`)} className="hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {members.filter(m => m.status === 'ACTIVE' && m.user).map(member => {
                  const isCurrentUser = member.user!.email === user?.email;
                  const isOnlineStatus = isOnline(member.user!.id);

                  const btn = (
                    <div key={member.id} className="flex flex-col">
                      <button
                        onClick={() => navigate(`/w/${workspaceSlug}/dm/${member.user!.email}`)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors w-full text-muted-foreground hover:bg-muted hover:text-foreground ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <div className="relative shrink-0 flex items-center justify-center">
                          <Avatar className="h-5 w-5 rounded-md">
                            <AvatarFallback className="rounded-md bg-muted-foreground/20 text-[10px] text-foreground font-semibold">
                              {member.user!.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isOnlineStatus && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        {!isSidebarCollapsed && <span className="truncate flex-1 text-left">{member.user!.username} {isCurrentUser && '— You'}</span>}
                      </button>
                    </div>
                  );

                  return isSidebarCollapsed ? (
                    <Tooltip key={member.id} delayDuration={0}>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="right">{member.user!.username}</TooltipContent>
                    </Tooltip>
                  ) : btn;
                })}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Workspace View Area */}
        <main className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
          <Outlet />
        </main>

        {/* Right Sidebar Details Area */}
        <RightSidebar />
      </div>

      {/* 3. Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border max-w-md w-full rounded-xl p-6 space-y-4 shadow-lg">
            <h3 className="text-lg font-bold">Create Threaded Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ch-name">Channel Name</Label>
                <div className="flex items-center gap-2 px-3 py-1 bg-background border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="text-muted-foreground text-sm font-semibold">#</span>
                  <input
                    id="ch-name"
                    required
                    placeholder="e.g. design-assets"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="flex-1 bg-transparent py-1.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-desc">Description</Label>
                <Input
                  id="ch-desc"
                  placeholder="Topic focus of this channel"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="ch-private"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="ch-private" className="cursor-pointer">Private Channel</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddChannel(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Channel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Workspace Modal */}
      {showAddWorkspace && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border max-w-md w-full rounded-xl p-6 space-y-4 shadow-lg">
            <h3 className="text-lg font-bold">Create New Workspace</h3>
            <p className="text-sm text-muted-foreground">Set up a new workspace for your team or project.</p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input
                  id="ws-name"
                  required
                  placeholder="e.g. Acme Corp"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddWorkspace(false)}
                  disabled={creatingWorkspace}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newWorkspaceName || creatingWorkspace}>
                  {creatingWorkspace ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SyncUp Audio Huddle UI */}
      <SyncUpDock />

    </div>
  );
};
