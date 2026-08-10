import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useRightSidebar } from '@/features/chat/context/RightSidebarContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MessageItem } from './MessageItem'; // We will render the parent message here directly
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSiloChatRoom } from '@/features/chat/hooks/useSiloChatRoom';
import { useWebSocket } from '@/context/WebSocketContext';

export const ThreadDrawer: React.FC = () => {
  const { isOpen, type, data, closeSidebar } = useRightSidebar();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registerMessageHandler } = useWebSocket();

  if (!isOpen || type !== 'thread' || !data) return null;

  const { channelId, workspaceId, parentMessage } = data;

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['thread', channelId, parentMessage.id],
    queryFn: () => api.listMessageThread(channelId, parentMessage.id),
    enabled: !!channelId && !!parentMessage.id,
  });



  useEffect(() => {
    if (!channelId || !parentMessage.id) return;

    const cleanupMsg = registerMessageHandler('chat.message_received', (payload: any) => {
      // Only add to thread if it's a reply to this parent
      if (String(payload.parent_message) === String(parentMessage.id)) {
        queryClient.setQueryData<any[]>(['thread', channelId, parentMessage.id], (old = []) => {
          if (old.some(m => String(m.id) === String(payload.id))) return old;
          return [...old, payload];
        });
      }
    });

    const cleanupReaction = registerMessageHandler('chat.reaction_updated', (payload: any) => {
      queryClient.setQueryData<any[]>(['thread', channelId, parentMessage.id], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupEdit = registerMessageHandler('chat.message_edited', (payload: any) => {
      queryClient.setQueryData<any[]>(['thread', channelId, parentMessage.id], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupDelete = registerMessageHandler('chat.message_deleted', (payload: any) => {
      queryClient.setQueryData<any[]>(['thread', channelId, parentMessage.id], (old = []) => {
        return old.map(m => String(m.id) === String(payload.id) ? payload : m);
      });
    });

    const cleanupPin = registerMessageHandler('chat.message_pinned', (payload: any) => {
      queryClient.setQueryData<any[]>(['thread', channelId, parentMessage.id], (old = []) => {
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
  }, [channelId, parentMessage.id, registerMessageHandler, queryClient]);

  const { sendReaction, sendEdit, sendDelete, sendPin, sendChannelMessage } = useSiloChatRoom(
    workspaceId || 0,
    channelId || 0
  );

  const handleSendReply = (content: string, attachments: any[] = []) => {
    if (!parentMessage.id) return;
    sendChannelMessage(content, attachments, parentMessage.id);
  };

  return (
    <div className="flex flex-col h-full bg-white relative w-full">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-gray-50/80 z-10">
        <div className="flex flex-col">
          <h2 className="font-bold text-gray-900 text-[15px] font-['Outfit']">Thread</h2>
          <span className="text-xs text-gray-500">#{data.channelName || 'channel'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={closeSidebar} className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-200">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent Message Sticky */}
      <div className="border-b bg-white shrink-0 py-2">
        <MessageItem
          message={parentMessage}
          isCompact={false}
          currentUserId={user?.id}
          onReact={(emoji) => sendReaction(parentMessage.id, emoji)}
          onReply={() => {}}
          onEdit={(content) => sendEdit(parentMessage.id, content)}
          onDelete={() => sendDelete(parentMessage.id)}
          onPin={() => sendPin(parentMessage.id)}
        />
      </div>

      <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2 border-b shrink-0">
        <span className="text-xs font-semibold text-gray-500">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
          </div>
        ) : (
          <MessageList
            messages={replies}
            currentUserId={user?.id}
            onReact={sendReaction}
            onReply={() => {}}
            onEdit={sendEdit}
            onDelete={sendDelete}
            onPin={sendPin}
          />
        )}
      </div>

      {/* Reply Input */}
      <div className="p-4 bg-white border-t shrink-0">
        <MessageInput
          placeholder="Reply..."
          onSendMessage={handleSendReply}
        />
      </div>
    </div>
  );
};
