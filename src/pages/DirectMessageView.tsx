import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { useRightSidebar } from '@/context/RightSidebarContext';
import { useCall } from '@/context/CallContext';
import { useSiloChatRoom } from '@/hooks/useSiloChatRoom';
import { api, type Message } from '@/lib/api';
import { Search, Layout, Video, Phone, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';

export const DirectMessageView: React.FC = () => {
  const { workspaceSlug, targetEmail } = useParams<{ workspaceSlug: string; targetEmail: string }>();
  const { user } = useAuth();
  const { subscribeToChannel, registerMessageHandler } = useWebSocket();
  const { openProfile, openSidebar } = useRightSidebar();
  const { startCall } = useCall();
  const queryClient = useQueryClient();
  
  const [channelId, setChannelId] = useState<number | null>(null);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  const isSelfChat = user?.email === targetEmail;

  useEffect(() => {
    // Clear channel when switching
    setChannelId(null);
    setWorkspaceId(null);

    if (workspaceSlug && targetEmail) {
      api.getOrCreateDirectMessageChannel(workspaceSlug, targetEmail)
        .then((channel) => {
          setChannelId(channel.id);
          setWorkspaceId(channel.workspace);
          subscribeToChannel(channel.id);
        })
        .catch(console.error);
    }
  }, [workspaceSlug, targetEmail]);

  // Query Messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => api.listMessages(channelId!),
    enabled: !!channelId,
  });

  useEffect(() => {
    if (!channelId) return;

    const cleanupMsg = registerMessageHandler('chat.message_received', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
        if (old.some(m => String(m.id) === String(payload.id))) return old;
        return [...old, payload];
      });
    });

    const cleanupReaction = registerMessageHandler('chat.reaction_updated', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupEdit = registerMessageHandler('chat.message_edited', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupDelete = registerMessageHandler('chat.message_deleted', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupPin = registerMessageHandler('chat.message_pinned', (payload: any) => {
      queryClient.setQueryData<Message[]>(['messages', channelId], (old = []) => {
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



  const { sendChannelMessage, sendReaction, sendEdit, sendDelete, sendPin } = useSiloChatRoom(
    workspaceId || 0,
    channelId || 0
  );

  const handleSendMessage = (content: string, _attachments: any[] = []) => {
    if (!content.trim() || !targetEmail || !workspaceSlug || !channelId) return;
    sendChannelMessage(content);
  };



  const handleReply = (messageId: string | number) => {
    const parentMsg = messages.find(m => m.id === messageId);
    if (parentMsg) {
      openSidebar('thread', { 
        channelId, 
        workspaceId: workspaceId || 0,
        parentMessage: parentMsg, 
        channelName: targetEmail?.split('@')[0] 
      });
    }
  };

  const handleOpenProfile = () => {
    if (targetEmail) {
      openProfile({
        id: targetEmail,
        username: targetEmail.split('@')[0],
        email: targetEmail
      });
    }
  };

  if (isLoading && !channelId) {
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
          <div className="flex items-center gap-2 cursor-pointer group" onClick={handleOpenProfile}>
            <Avatar className="h-8 w-8 rounded-md ring-1 ring-gray-200">
              <AvatarFallback className="bg-gray-800 text-white rounded-md text-sm font-semibold">
                {targetEmail?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
               <h2 className="font-bold text-gray-900 group-hover:underline text-[15px] font-['Outfit']">{targetEmail?.split('@')[0]}</h2>
            </div>
          </div>
          
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          {!isSelfChat && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!channelId}
                className="h-8 w-8 hover:bg-gray-100 rounded-md disabled:opacity-50"
                onClick={() => {
                  if (channelId && targetEmail) {
                    startCall(channelId, targetEmail, false);
                  }
                }}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!channelId}
                className="h-8 w-8 hover:bg-gray-100 rounded-md disabled:opacity-50"
                onClick={() => {
                  if (channelId && targetEmail) {
                    startCall(channelId, targetEmail, true);
                  }
                }}
              >
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-md">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-md" onClick={handleOpenProfile}>
            <Layout className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      {isSelfChat && messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center mt-10 mb-8 shrink-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2">This is your personal space</h3>
            <p className="text-gray-500 text-[15px] mb-6 leading-relaxed">
              It's just you and your brilliant ideas! Draft messages, set reminders, or store ideas and files for easy access later.
            </p>
            <Button variant="outline" className="w-full mb-4 border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2" onClick={handleOpenProfile}>
              <UserIcon className="h-4 w-4" /> View Profile
            </Button>
          </div>
        </div>
      ) : (
        <MessageList 
          messages={messages} 
          currentUserId={user?.id}
          channelName={targetEmail?.split('@')[0]}
          onReact={sendReaction}
          onReply={handleReply}
          onEdit={sendEdit}
          onDelete={sendDelete}
          onPin={sendPin}
        />
      )}

      {/* Input Area */}
      <div className="p-4 bg-white z-10 shrink-0">
        <MessageInput 
          disabled={!channelId}
          placeholder={`Write to ${targetEmail?.split('@')[0]}`} 
          onSendMessage={handleSendMessage} 
        />
      </div>
    </div>
  );
};
