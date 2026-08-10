import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Channel, type Message } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import { useSiloChatRoom } from '@/features/chat/hooks/useSiloChatRoom';
import { Button } from '@/components/ui/button';
import { Hash, Search, Layout } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import { MessageList } from '@/features/chat/components/MessageList';
import { MessageInput } from '@/features/chat/components/MessageInput';
import { PreCallModal } from '@/features/chat/components/PreCallModal';
import { useRightSidebar } from '@/features/chat/context/RightSidebarContext';
import { useSFUContext } from '@/features/calls/context/ChannelSFUContext';

import { Phone } from 'lucide-react';

export const ChannelFeed: React.FC = () => {
  const { workspaceSlug, channelId } = useParams<{ workspaceSlug: string; channelId: string }>();
  const { subscribeToChannel, registerMessageHandler } = useWebSocket();
  const [channel, setChannel] = useState<Channel | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openSidebar } = useRightSidebar();
  
  const [showPreCallModal, setShowPreCallModal] = useState(false);
  const [targetCallChannelId, setTargetCallChannelId] = useState<string | number | null>(null);
  const { autoHuddle, leaveHuddle, activeChannelId } = useSFUContext();
  
  const parsedChannelId = parseInt(channelId || '0', 10);
  
  const { sendChannelMessage, sendReaction, sendEdit, sendDelete, sendPin } = useSiloChatRoom(
    channel?.workspace || 0,
    parsedChannelId
  );

  // Fetch Channel Details
  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId || !workspaceSlug) return;
      try {
        const chList = await api.listChannels(workspaceSlug);
        const ch = chList.find((c) => c.id === parsedChannelId);
        if (ch) {
          setChannel(ch);
          subscribeToChannel(parsedChannelId);
        } else {
          toast.error('Channel not found.');
        }
      } catch (err) {
        toast.error('Failed to load channel details.');
      }
    };
    fetchChannel();
  }, [channelId, workspaceSlug]);

  // Query Messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', parsedChannelId],
    queryFn: () => api.listMessages(parsedChannelId),
    enabled: !!parsedChannelId,
  });

  // Websocket listener for incoming real-time updates
  useEffect(() => {
    if (!channelId) return;
    const cleanupMsg = registerMessageHandler('chat.message_received', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', parsedChannelId], (old = []) => {
        // Prevent duplicates
        if (old.some(m => String(m.id) === String(payload.id))) return old;
        return [...old, payload];
      });
    });

    const cleanupReaction = registerMessageHandler('chat.reaction_updated', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', parsedChannelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupEdit = registerMessageHandler('chat.message_edited', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', parsedChannelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupDelete = registerMessageHandler('chat.message_deleted', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', parsedChannelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupPin = registerMessageHandler('chat.message_pinned', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', parsedChannelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    return () => {
      cleanupMsg();
      cleanupReaction();
      cleanupEdit();
      cleanupDelete();
      cleanupPin();
    };
  }, [channelId, registerMessageHandler, queryClient]);



  // Actions
  const handleSendMessage = (content: string, attachments: any[] = []) => {
    sendChannelMessage(content, attachments);
  };



  const handleReply = (messageId: string | number) => {
    const parentMsg = messages.find(m => m.id === messageId);
    if (parentMsg) {
      openSidebar('thread', { 
        channelId: parsedChannelId, 
        workspaceId: channel?.workspace || 0,
        parentMessage: parentMsg, 
        channelName: channel?.name 
      });
    }
  };

  const handleJoinCallRequest = (joinChannelId?: string | number) => {
    const alwaysShow = localStorage.getItem('syncup_always_show_preview') !== 'false';
    const cid = joinChannelId || parsedChannelId;
    if (alwaysShow) {
      setTargetCallChannelId(cid);
      setShowPreCallModal(true);
    } else {
      autoHuddle(cid).catch(e => toast.error(e.message || 'Failed to join call'));
    }
  };

  const handleConfirmJoinCall = (_isMuted: boolean) => {
    setShowPreCallModal(false);
    if (targetCallChannelId) {
      autoHuddle(targetCallChannelId).catch(e => toast.error(e.message || 'Failed to join call'));
      // Note: We'd ideally toggle mute if `isMuted` is true, but useSFUContext doesn't accept initial mute yet.
      // The toggleMute action can be applied after if needed.
    }
  };

  if (isLoading && !channel) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white text-gray-500">
        <div className="animate-spin h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-6 shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="h-8 w-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Hash className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
               <h2 className="font-bold text-gray-900 group-hover:underline text-[15px] font-['Outfit']">{channel?.name}</h2>
            </div>
          </div>
          

        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-gray-100 rounded-md mr-1" 
            onClick={() => handleJoinCallRequest(parsedChannelId)}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-md">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-md">
            <Layout className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Messages Area */}
      <MessageList 
        messages={messages} 
        currentUserId={user?.id}
        channelName={channel?.name}
        onReact={sendReaction}
        onReply={handleReply}
        onEdit={sendEdit}
        onDelete={sendDelete}
        onPin={sendPin}
        onJoinCall={handleJoinCallRequest}
        onLeaveCall={leaveHuddle}
        activeCallChannelId={activeChannelId}
      />

      {/* Input Area */}
      <div className="p-4 bg-white z-10 shrink-0">
        <MessageInput 
          placeholder={`Message #${channel?.name}`} 
          onSendMessage={handleSendMessage} 
        />
      </div>

      {showPreCallModal && (
        <PreCallModal 
          onJoin={handleConfirmJoinCall} 
          onCancel={() => setShowPreCallModal(false)} 
        />
      )}
    </div>
  );
};
