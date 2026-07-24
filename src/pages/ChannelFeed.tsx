import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Channel } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import { useSiloChatRoom } from '@/hooks/useSiloChatRoom';
import { Button } from '@/components/ui/button';
import { Hash, Send, Search, Layout } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_email: string;
  content: string;
  is_mine: boolean;
  timestamp: Date;
}

export const ChannelFeed: React.FC = () => {
  const { workspaceSlug, channelId } = useParams<{ workspaceSlug: string; channelId: string }>();
  const { subscribeToChannel, registerMessageHandler } = useWebSocket();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendChannelMessage } = useSiloChatRoom(
    channel?.workspace || 0,
    parseInt(channelId || '0', 10)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Fetch channel messages
      const msgList = await api.listChannelMessages(id);
      const formattedMessages: Message[] = msgList.map((msg) => ({
        id: msg.id,
        sender_email: msg.sender_email,
        content: msg.content,
        is_mine: msg.sender_email === user?.email,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
    } catch (err: any) {
      toast.error('Failed to load channel discussion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, [channelId, workspaceSlug]);

  useEffect(() => {
    if (!channelId) return;

    const cleanup = registerMessageHandler('chat', 'new_channel_message', (payload: any) => {
      const data = payload.message_data || payload.data || payload;
      const { id, sender_email, content, timestamp } = data;
      
      const newMessage: Message = {
        id: id || Math.random().toString(36).substring(7),
        sender_email,
        content,
        is_mine: sender_email === user?.email, 
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };
      
      setMessages((prev) => {
         if (prev.some(m => m.id === newMessage.id)) {
             return prev;
         }
         
         const lastMsg = prev[prev.length - 1];
         if (lastMsg && lastMsg.is_mine && lastMsg.content === newMessage.content && (newMessage.timestamp.getTime() - lastMsg.timestamp.getTime() < 2000)) {
             return [...prev.slice(0, -1), newMessage];
         }
         
         return [...prev, newMessage];
      });
    });

    return () => cleanup();
  }, [channelId, registerMessageHandler, user?.email]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !channelId) return;

    // Send across websocket
    sendChannelMessage(inputMessage.trim());

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

  if (loading) {
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
          
          <div className="flex items-center gap-4 ml-6 text-sm font-medium text-gray-500">
             <button className="text-gray-900 border-b-2 border-gray-900 pb-4 pt-4">Chat</button>
             <button className="hover:text-gray-900 pb-4 pt-4">Files</button>
             <button className="hover:text-gray-900 pb-4 pt-4">Canvas</button>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-md">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-md">
            <Layout className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        {messages.length > 0 && (
          <div className="w-full flex items-center justify-center mt-4 mb-4 relative shrink-0">
            <div className="absolute border-t border-gray-200 w-full"></div>
            <span className="bg-white px-4 text-xs font-medium text-gray-400 relative z-10 border border-gray-200 rounded-full py-1">Beginning of {channel?.name} ⌄</span>
          </div>
        )}

        {messages.length === 0 && (
           <div className="m-auto text-center text-gray-500 text-sm">
             No messages yet. Start the conversation in #{channel?.name}!
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
            placeholder={`Message #${channel?.name}`}
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
