import React, { useState } from 'react';
import type { Message } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ReactionPicker } from './ReactionPicker';
import { MessageInput } from './MessageInput';
import { 
  MessageSquare, Pin, Pencil, Trash2, 
  MoreHorizontal, File, Mic
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
  isCompact?: boolean;
  currentUserId?: string | number;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onPin: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCompact = false,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isMine = String(message.sender.id) === String(currentUserId);
  const timestamp = new Date(message.created_at);

  const handleEditSubmit = (newContent: string) => {
    onEdit(newContent);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "group relative flex gap-4 px-5 py-1 hover:bg-gray-50/80 transition-colors",
      isCompact ? "mt-0" : "mt-2",
      message.is_pinned && "bg-orange-50/30 hover:bg-orange-50/50"
    )}>
      {/* Pinned indicator banner (only on non-compact) */}
      {message.is_pinned && !isCompact && (
        <div className="absolute top-0 left-0 w-full h-px bg-orange-200"></div>
      )}

      {/* Hover Actions Menu */}
      <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 shadow-sm rounded-lg flex items-center p-0.5 z-10">
        <ReactionPicker 
          onSelect={onReact}
          className="h-7 w-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" onClick={onReply}>
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onPin} className="gap-2">
              <Pin className="h-4 w-4" /> {message.is_pinned ? 'Unpin message' : 'Pin message'}
            </DropdownMenuItem>
            {isMine && (
              <>
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                  <Pencil className="h-4 w-4" /> Edit message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4" /> Delete message
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Avatar or Timestamp column */}
      <div className="w-10 shrink-0 flex justify-center">
        {!isCompact ? (
          <Avatar className="h-9 w-9 rounded-md mt-0.5 ring-1 ring-gray-200">
            <AvatarFallback className={cn("text-white rounded-md text-sm font-semibold", isMine ? "bg-gray-800" : "bg-teal-600")}>
              {message.sender.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 font-medium mt-1.5 w-full text-right pr-2">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {!isCompact && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-bold text-[15px] text-gray-900 font-['Outfit']">{message.sender.username}</span>
            <span className="text-xs font-medium text-gray-400">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {isEditing ? (
          <div className="mt-1 mb-2">
            <MessageInput 
              onSendMessage={handleEditSubmit} 
              // We could populate initial content here if MessageInput accepts it.
              // For now, it will start blank or we need to add initialContent to MessageInput
            />
            <div className="text-xs text-gray-400 mt-1">Press ESC to cancel</div>
          </div>
        ) : (
          <div className="text-[15px] text-gray-800 leading-relaxed break-words prose prose-sm max-w-none">
            {message.is_deleted ? (
              <span className="text-gray-400 italic">This message was deleted.</span>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: message.content }} />
            )}
            {message.is_edited && !message.is_deleted && (
              <span className="text-[10px] text-gray-400 ml-1">(edited)</span>
            )}
          </div>
        )}

        {/* Attachments */}
        {!message.is_deleted && message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-md">
                {att.type === 'image' ? (
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-gray-50">
                    <img src={att.url} alt={att.name} className="max-h-80 max-w-full object-contain" loading="lazy" />
                  </a>
                ) : att.type === 'audio' ? (
                  <div className="p-2 w-[280px]">
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium">
                      <Mic className="h-4 w-4" /> Voice Note
                    </div>
                    <audio controls src={att.url} className="w-full h-8" />
                  </div>
                ) : (
                  <a 
                    href={att.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors w-[280px]"
                  >
                    <div className="h-10 w-10 shrink-0 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                      <File className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold text-gray-900 truncate">{att.name}</span>
                      <span className="text-xs text-gray-500">{(att.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((reaction) => {
              const hasReacted = reaction.user_ids.includes(String(currentUserId));
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => onReact(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    hasReacted 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread Reply Indicator */}
        {message.reply_count && message.reply_count > 0 ? (
          <div className="mt-1.5">
            <button 
              onClick={onReply}
              className="flex items-center gap-2 group/thread"
            >
              <div className="flex -space-x-1">
                {/* Normally we'd render participant avatars here */}
                <div className="h-6 w-6 rounded-md bg-blue-100 border border-white flex items-center justify-center text-[10px] font-bold text-blue-700">
                  +
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-blue-600 group-hover/thread:underline">
                  {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                </span>
                {message.latest_reply_at && (
                  <span className="text-xs text-gray-400">
                    Last reply {new Date(message.latest_reply_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
