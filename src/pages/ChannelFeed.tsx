import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Channel, type Topic, type Reply } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import { useSiloChatRoom } from '@/hooks/useSiloChatRoom';
import { useCall } from '@/context/CallContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Hash,
  MessageSquare,
  ChevronRight,
  X,
  Send,
  PhoneCall,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const ChannelFeed: React.FC = () => {
  const { workspaceSlug, channelId } = useParams<{ workspaceSlug: string; channelId: string }>();
  const { subscribeToChannel, registerMessageHandler } = useWebSocket();
  const { startCall } = useCall();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Thread / Replies Drawer State
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  
  // Use new hook
  const { sendReplyMessage, updateTypingStatus, activeTypers } = useSiloChatRoom(
    channel?.workspace || 0, // wait, channel model has workspace? Yes.
    parseInt(channelId || '0', 10),
    activeTopic?.id || null
  );
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Add Topic Modal State
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');

  // Call Dialer Modal State
  const [showCallDialer, setShowCallDialer] = useState(false);
  const [dialerEmail, setDialerEmail] = useState('');

  const fetchChannelData = async () => {
    if (!channelId || !workspaceSlug) return;
    try {
      setLoading(true);
      const id = parseInt(channelId, 10);
      
      // Load current channel info
      const chList = await api.listChannels(workspaceSlug);
      const ch = chList.find((c) => c.id === id);
      if (!ch) {
        toast.error('Channel not found.');
        return;
      }
      setChannel(ch);

      // Subscribe to WebSocket channel updates
      subscribeToChannel(id);

      // Fetch topics list
      const topicList = await api.listTopics(id);
      setTopics(topicList);
    } catch (err: any) {
      toast.error('Failed to load channel discussion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
    setActiveTopic(null); // Clear selected topic on channel switch
  }, [channelId, workspaceSlug]);

  // Real-time updates subscription hook
  useEffect(() => {
    // Listen for new topics or new replies posted in our channel group
    const unsubscribeNewReply = registerMessageHandler('chat', 'new_reply_broadcast', (message: any) => {
      // Message format: ReplySerializer data. It has topic (id), content, etc.
      // Wait! In the view we serialized it using ReplySerializer, so it has `topic` instead of `topic_id`!
      // Let's check ReplySerializer in backend to be sure. If it has `topic`, we use `message.topic`.
      const topicId = message.topic || message.topic_id;
      if (message && topicId) {
        // Increment reply count in topics list
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicId
              ? { ...t, replies_count: (t.replies_count || 0) + 1 }
              : t
          )
        );

        // If the active open thread drawer is for this topic, append the reply in real time!
        if (activeTopic && activeTopic.id === topicId) {
          setReplies((prev) => {
            // Deduplicate (if we already appended it optimistically)
            if (prev.some(r => r.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      }
    });

    return () => {
      unsubscribeNewReply();
    };
  }, [activeTopic]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !newTopicTitle || !newTopicContent) return;

    try {
      const topic = await api.createTopic(channel.id, newTopicTitle, newTopicContent);
      toast.success('New topic thread published!');
      setTopics([topic, ...topics]);
      setShowAddTopic(false);
      setNewTopicTitle('');
      setNewTopicContent('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create topic.');
    }
  };

  const handleOpenThread = async (topic: Topic) => {
    setActiveTopic(topic);
    setReplies([]);
    try {
      setLoadingReplies(true);
      const list = await api.listReplies(topic.id);
      setReplies(list);
    } catch (err) {
      toast.error('Failed to load thread replies.');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic || !newReplyContent.trim()) return;

    try {
      sendReplyMessage(newReplyContent);
      setNewReplyContent('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply.');
    }
  };

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !dialerEmail) return;

    try {
      setShowCallDialer(false);
      await startCall(workspaceSlug, dialerEmail);
      setDialerEmail('');
    } catch (err) {
      // handeled by CallContext
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 1. Timeline Feed */}
      <section className="flex-1 flex flex-col min-w-0 h-full border-r border-zinc-800">
        {/* Top Navbar Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div>
            <div className="flex items-center gap-1 font-bold text-zinc-100 text-lg">
              <Hash className="h-5 w-5 text-sky-400 shrink-0" />
              <span>{channel?.name}</span>
            </div>
            <p className="text-xs text-zinc-400 truncate max-w-[400px]">
              {channel?.description || 'Collaborative engineering discussion thread.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Huddle actions */}
            <Button
              onClick={() => setShowCallDialer(true)}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 text-xs font-bold flex items-center gap-1.5 h-9"
            >
              <PhoneCall className="h-4 w-4" />
              Join Voice Huddle
            </Button>
          </div>
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
            <span className="text-sm font-semibold text-zinc-400">
              {topics.length} active discussion threads
            </span>
            <Button
              onClick={() => setShowAddTopic(true)}
              className="bg-sky-500 text-zinc-950 hover:bg-sky-400 text-xs font-bold"
            >
              + New Topic Thread
            </Button>
          </div>

          {topics.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto text-zinc-600" />
              <h4 className="font-bold text-zinc-400">No active discussions</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Create a new topic thread to start collaborating asynchronously with your workspace team.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => {
                const isSelected = activeTopic?.id === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleOpenThread(topic)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-sky-500/50 bg-sky-950/20'
                        : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                      <span>
                        Thread Owner: <strong className="text-zinc-400">@{topic.created_by?.username || 'member'}</strong>
                      </span>
                      <span>
                        {topic.created_at ? new Date(topic.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-100 text-sm mb-1">{topic.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{topic.content}</p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/40">
                      <div className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold">
                        <span>{topic.replies_count || 0} replies</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 2. Right Thread Panel Drawer */}
      {activeTopic && (
        <aside className="w-96 border-l border-zinc-800 bg-zinc-900/40 flex flex-col h-full shrink-0">
          <div className="h-16 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-400">
              Discussion Thread
            </span>
            <button
              onClick={() => setActiveTopic(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Original Post */}
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <div className="h-4 w-4 rounded-full bg-sky-500 text-zinc-950 font-bold text-[8px] flex items-center justify-center uppercase">
                  {activeTopic.created_by?.username?.slice(0, 2) || 'M'}
                </div>
                <span>@{activeTopic.created_by?.username || 'member'}</span>
              </div>
              <h5 className="font-bold text-sm text-zinc-100">{activeTopic.title}</h5>
              <p className="text-xs text-zinc-400">{activeTopic.content}</p>
            </div>

            {/* Replies List */}
            <div className="space-y-3">
              {loadingReplies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                </div>
              ) : replies.length === 0 ? (
                <p className="text-[11px] text-zinc-500 text-center py-6">
                  No replies yet. Be the first to comment!
                </p>
              ) : (
                replies.map((rep) => (
                  <div key={rep.id} className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/40 text-xs">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
                      <div className="h-3.5 w-3.5 rounded-full bg-zinc-700 text-zinc-300 font-bold text-[7px] flex items-center justify-center uppercase">
                        {rep.created_by?.username?.slice(0, 2) || 'R'}
                      </div>
                      <span className="font-semibold">@{rep.created_by?.username || 'replier'}</span>
                      <span className="ml-auto">
                        {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{rep.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Post Reply Input Form */}
          <div className="px-4 py-1 text-[10px] text-zinc-500 italic h-4">
            {Object.values(activeTypers).some(Boolean) && "Someone is typing..."}
          </div>
          <form onSubmit={handlePostReply} className="p-3 border-t border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-2">
              <input
                placeholder="Reply to this thread..."
                value={newReplyContent}
                onChange={(e) => {
                  setNewReplyContent(e.target.value);
                  updateTypingStatus(e.target.value.length > 0);
                }}
                onBlur={() => updateTypingStatus(false)}
                className="flex-1 bg-transparent py-2 text-xs focus:outline-none text-zinc-100"
              />
              <button
                type="submit"
                disabled={!newReplyContent.trim()}
                className="text-sky-500 hover:text-sky-400 p-1.5 disabled:text-zinc-600"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </aside>
      )}

      {/* 3. New Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-lg w-full rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-sky-400">Launch New Discussion Thread</h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic-title" className="text-zinc-300">Topic Title</Label>
                <Input
                  id="topic-title"
                  required
                  placeholder="e.g. Postgres Connection Pool Leak"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-content" className="text-zinc-300">Detailed Description / Question</Label>
                <textarea
                  id="topic-content"
                  required
                  rows={4}
                  placeholder="Explain the background context, options explored, and explicit questions..."
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddTopic(false)}
                  className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold">
                  Publish Topic
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Voice Huddle Dialing Modal */}
      {showCallDialer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-sm w-full rounded-xl p-6 space-y-4">
            <div className="text-center">
              <PhoneCall className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-zinc-100">Start Voice Call</h3>
              <p className="text-xs text-zinc-400">
                Dial another member in this workspace using WebRTC.
              </p>
            </div>
            <form onSubmit={handleStartCall} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dial-email" className="text-zinc-300">Target Member Email</Label>
                <Input
                  id="dial-email"
                  required
                  type="email"
                  placeholder="colleague@example.com"
                  value={dialerEmail}
                  onChange={(e) => setDialerEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCallDialer(false)}
                  className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!workspaceSlug || !dialerEmail) return;
                    setShowCallDialer(false);
                    startCall(workspaceSlug, dialerEmail, false).then(() => setDialerEmail('')).catch(()=>{});
                  }}
                >
                  Voice
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-sky-500 text-zinc-950 hover:bg-sky-400 font-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!workspaceSlug || !dialerEmail) return;
                    setShowCallDialer(false);
                    startCall(workspaceSlug, dialerEmail, true).then(() => setDialerEmail('')).catch(()=>{});
                  }}
                >
                  Video
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
