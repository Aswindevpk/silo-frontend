import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { MessageSquare, X, Send } from 'lucide-react';


interface Message {
  id: string;
  sender_email: string;
  sender_username?: string;
  content: string;
  is_mine: boolean;
  timestamp: Date;
}

interface EphemeralChatProps {
  targetEmail: string | null;
  onClose: () => void;
  onIncomingMessage?: (senderEmail: string) => void;
}

export const EphemeralChat: React.FC<EphemeralChatProps> = ({ targetEmail, onClose, onIncomingMessage }) => {
  const [activeChat, setActiveChat] = useState<string | null>(null); // The person currently chatting with
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetEmail) {
      setActiveChat(targetEmail);
      // We don't clear messages if it's the same person, but for simplicity we keep history
    } else {
      setActiveChat(null);
    }
  }, [targetEmail]);

  useEffect(() => {
    const cleanup = registerMessageHandler('chat.message_received', (data: any) => {
      // Received a direct message
      const msg = data.payload || data;
      const sender_email = msg.sender?.email || msg.sender_email || '';
      const newMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender_email,
        sender_username: msg.sender?.username,
        content: msg.content,
        is_mine: false,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, newMessage]);
      

      
      // Auto-open if closed and we received a message
      if (onIncomingMessage) {
        onIncomingMessage(sender_email);
      }
    });

    return () => cleanup();
  }, [activeChat, registerMessageHandler, onIncomingMessage]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    // Send via WebSocket (bypasses DB)
    sendJsonMessage('chat.send_message', {
      receiver_email: activeChat,
      content: inputMessage.trim()
    }, "0", "0");

    // Append my own message locally
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender_email: 'Me',
      sender_username: 'Me',
      content: inputMessage.trim(),
      is_mine: true,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
  };

  if (!targetEmail && !activeChat) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden shadow-emerald-500/10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-zinc-950 border-b border-zinc-800">
        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-500" />
          Direct Message
        </h3>
        <button 
          onClick={() => {
            setActiveChat(null);
            onClose();
          }}
          className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <>
        <div className="bg-zinc-950/50 px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
          <span className="truncate">To: {activeChat}</span>
        </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="m-auto text-center text-zinc-500 text-xs">
                No messages yet.<br/>Messages disappear on refresh.
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}>
                  <div className="text-[10px] text-zinc-500 mb-1 px-1">
                    {msg.sender_username || msg.sender_email} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words shadow-sm ${msg.is_mine ? 'bg-emerald-500 text-zinc-950 rounded-br-sm' : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
            <input 
              type="text"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
            />
            <button 
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 rounded-full bg-emerald-500 text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
    </div>
  );
};
