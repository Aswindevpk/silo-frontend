import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageItem } from './MessageItem';
import type { Message } from '@/lib/api';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string | number;
  channelName?: string;
  onReact: (messageId: string | number, emoji: string) => void;
  onReply: (messageId: string | number) => void;
  onEdit: (messageId: string | number, content: string) => void;
  onDelete: (messageId: string | number) => void;
  onPin: (messageId: string | number) => void;
  onJoinCall?: (channelId: string | number) => void;
  onLeaveCall?: (channelId: string | number) => void;
  activeCallChannelId?: string | number | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  channelName,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onJoinCall,
  onLeaveCall,
  activeCallChannelId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtualizer
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // estimated height of a message row
    overscan: 10,
  });

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (parentRef.current && virtualizer.getTotalSize() > 0) {
      // Basic auto-scroll. Can be optimized to only scroll if already near bottom.
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length, virtualizer]);

  // Handle infinite scroll up
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    if (!virtualItems.length) return;
    const firstVisibleItem = virtualItems[0];
    // If we're showing the very first item (oldest message currently loaded) 
    // and we have more to fetch, trigger fetchNextPage
    if (firstVisibleItem.index === 0 && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-y-auto px-1 py-4"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {messages.length === 0 && !isFetchingNextPage && (
          <div className="absolute inset-0 m-auto text-center text-gray-500 text-sm mt-10 h-10">
            No messages yet. Start the conversation{channelName ? ` in #${channelName}` : ''}!
          </div>
        )}

        {isFetchingNextPage && (
          <div className="text-center text-gray-400 text-xs py-2 w-full absolute top-0">
            Loading older messages...
          </div>
        )}
        
        {virtualItems.map((virtualItem) => {
          const msg = messages[virtualItem.index];
          
          // Determine if compact (same sender as previous message and within 2 mins)
          let isCompact = false;
          if (virtualItem.index > 0) {
            const prevMsg = messages[virtualItem.index - 1];
            if (prevMsg.sender.id === msg.sender.id) {
              const diff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
              if (diff < 2 * 60 * 1000) {
                isCompact = true;
              }
            }
          }

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageItem
                message={msg}
                isCompact={isCompact}
                currentUserId={currentUserId}
                onReact={(emoji) => onReact(msg.id, emoji)}
                onReply={() => onReply(msg.id)}
                onEdit={(content) => onEdit(msg.id, content)}
                onDelete={() => onDelete(msg.id)}
                onPin={() => onPin(msg.id)}
                onJoinCall={onJoinCall}
                onLeaveCall={onLeaveCall}
                activeCallChannelId={activeCallChannelId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
