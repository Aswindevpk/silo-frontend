import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { useRightSidebar } from '@/context/RightSidebarContext';
import { useCall } from '@/context/CallContext';
import { api, type DirectMessage as ApiDirectMessage } from '@/lib/api';
import { Send, Search, Layout, Video, Phone, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  sender_email: string;
  content: string;
  is_mine: boolean;
  timestamp: Date;
}

export const DirectMessageView: React.FC = () => {
  const { workspaceSlug, targetEmail } = useParams<{ workspaceSlug: string; targetEmail: string }>();
  const { user } = useAuth();
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const { openProfile } = useRightSidebar();
  const { startCall } = useCall();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSelfChat = user?.email === targetEmail;

  useEffect(() => {
    // Clear messages when switching chats
    setMessages([]);

    if (workspaceSlug && targetEmail) {
      api.listDirectMessages(workspaceSlug, targetEmail)
        .then((data: ApiDirectMessage[]) => {
          const formattedMessages: Message[] = data.map((msg) => ({
            id: msg.id,
            sender_email: msg.sender_email,
            content: msg.content,
            is_mine: msg.sender_email === user?.email && (!isSelfChat || msg.sender_email === msg.receiver_email), // Treat our sends as mine
            timestamp: new Date(msg.created_at),
          }));
          
          if (isSelfChat) {
             // De-duplicate self chat if it returned twice (shouldn't happen with proper query)
             setMessages(formattedMessages);
          } else {
             setMessages(formattedMessages);
          }
        })
        .catch((err) => {
          console.error("Failed to load direct messages:", err);
        });
    }
  }, [workspaceSlug, targetEmail, user?.email, isSelfChat]);

  useEffect(() => {
    if (!targetEmail) return;

    const cleanup = registerMessageHandler('chat', 'ephemeral_chat', (payload: any) => {
      // Depending on the backend changes, it might be in `data` or `message_data`
      const data = payload.message_data || payload.data || payload;
      const { id, sender_email, content, receiver_email, timestamp } = data;
      
      // If we sent a message to ourselves, the sender and receiver are the same.
      // If we receive a message, we only want to show it if it's from the current target
      // Or if it's a message we sent to the current target!
      // Or if it's a self-chat
      if (
        sender_email === targetEmail || 
        receiver_email === targetEmail ||
        (isSelfChat && sender_email === user?.email)
      ) {
        const newMessage: Message = {
          id: id || Math.random().toString(36).substring(7),
          sender_email,
          content,
          is_mine: sender_email === user?.email, 
          timestamp: timestamp ? new Date(timestamp) : new Date()
        };
        
        setMessages((prev) => {
           // Prevent duplicate appending (especially if we broadcasted back to sender)
           if (prev.some(m => m.id === newMessage.id)) {
               return prev;
           }
           
           // If we optimistically appended, we might want to replace it. 
           // For simplicity, we just check by content and proximity if it's a temp id.
           const lastMsg = prev[prev.length - 1];
           if (lastMsg && lastMsg.is_mine && lastMsg.content === newMessage.content && (newMessage.timestamp.getTime() - lastMsg.timestamp.getTime() < 2000)) {
               // Replace the optimistic one with the real one from DB
               return [...prev.slice(0, -1), newMessage];
           }
           
           return [...prev, newMessage];
        });
      }
    });

    return () => cleanup();
  }, [targetEmail, registerMessageHandler, isSelfChat, user?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !targetEmail || !workspaceSlug) return;

    // Send across websocket
    sendJsonMessage('chat', {
      type: 'ephemeral_chat',
      receiver_email: targetEmail,
      workspace_slug: workspaceSlug,
      content: inputMessage.trim()
    });

    // Optimistic append
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender_email: user?.email || 'Me',
      content: inputMessage.trim(),
      is_mine: true,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    setInputMessage('');
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
          
          <div className="flex items-center gap-4 ml-6 text-sm font-medium text-gray-500">
             <button className="text-gray-900 border-b-2 border-gray-900 pb-4 pt-4">Chat</button>
             <button className="hover:text-gray-900 pb-4 pt-4">Calendar</button>
             <button className="hover:text-gray-900 pb-4 pt-4">Tasks</button>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          {!isSelfChat && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  if (workspaceSlug && targetEmail) {
                    startCall(workspaceSlug, targetEmail, false);
                  }
                }}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  if (workspaceSlug && targetEmail) {
                    startCall(workspaceSlug, targetEmail, true);
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
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        {isSelfChat && (
          <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center mt-10 mb-8 shrink-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2">This is your personal space</h3>
            <p className="text-gray-500 text-[15px] mb-6 leading-relaxed">
              It's just you and your brilliant ideas! Draft messages, set reminders, or store ideas and files for easy access later.
            </p>
            <Button variant="outline" className="w-full mb-4 border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2" onClick={handleOpenProfile}>
              <UserIcon className="h-4 w-4" /> View Profile
            </Button>
            <div className="w-full bg-red-50/50 border border-red-100 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-red-50 transition-colors">
               <div className="h-10 w-10 bg-white rounded shadow-sm flex items-center justify-center border border-red-100 text-red-500">
                  <span className="font-bold text-lg">📅</span>
               </div>
               <div className="text-left">
                  <h4 className="font-semibold text-gray-900 text-sm">View your calendar</h4>
                  <p className="text-xs text-gray-500">Create events or manage your schedule</p>
               </div>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="w-full flex items-center justify-center mt-4 mb-4 relative shrink-0">
            <div className="absolute border-t border-gray-200 w-full"></div>
            <span className="bg-white px-4 text-xs font-medium text-gray-400 relative z-10 border border-gray-200 rounded-full py-1">Today ⌄</span>
          </div>
        )}

        {messages.length === 0 && !isSelfChat && (
           <div className="m-auto text-center text-gray-500 text-sm">
             No messages yet. Say hello to {targetEmail?.split('@')[0]}!
           </div>
        )}

        {messages.map((msg, index) => {
          const showAvatar = index === 0 || messages[index - 1].sender_email !== msg.sender_email;
          
          return (
            <div key={msg.id} className="group flex gap-4 mt-1 hover:bg-gray-50/50 p-1 -mx-2 px-2 rounded-lg">
              <div className="w-10 shrink-0 flex justify-center">
                {showAvatar ? (
                  <Avatar className="h-9 w-9 rounded-md mt-1 ring-1 ring-gray-200">
                    <AvatarFallback className={`${msg.is_mine ? 'bg-gray-800' : 'bg-teal-600'} text-white rounded-md text-sm font-semibold`}>
                      {msg.sender_email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 font-medium mt-1.5 w-full text-right pr-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {showAvatar && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-[15px] text-gray-900 font-['Outfit']">{msg.sender_email.split('@')[0]}</span>
                    <span className="text-xs font-medium text-gray-400">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white z-10 shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <Button type="button" variant="ghost" size="icon" className="absolute left-2 h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
             <span className="text-lg">+</span>
          </Button>
          <input 
            type="text"
            placeholder={`Write to ${targetEmail?.split('@')[0]}, press 'space' for AI, '/' for commands`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-12 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 shadow-sm transition-all"
          />
          <Button 
            type="submit"
            disabled={!inputMessage.trim()}
            variant="ghost"
            size="icon"
            className="absolute right-2 h-8 w-8 text-gray-400 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
