import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  id: string;
  sender_email: string;
  content: string;
  is_mine: boolean;
  timestamp: Date;
}

export const EphemeralChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState('');
  const [activeChat, setActiveChat] = useState(''); // The person currently chatting with
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = registerMessageHandler('chat', 'ephemeral_chat', (data: any) => {
      // Received a direct message
      const { sender_email, content } = data;
      const newMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender_email,
        content,
        is_mine: false,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, newMessage]);
      
      // Auto-open if closed and we received a message
      if (!isOpen) {
        setIsOpen(true);
        setActiveChat(sender_email);
        setReceiverEmail(sender_email);
      } else if (!activeChat) {
        setActiveChat(sender_email);
        setReceiverEmail(sender_email);
      }
    });

    return () => cleanup();
  }, [isOpen, activeChat, registerMessageHandler]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiverEmail.trim()) {
      setActiveChat(receiverEmail.trim());
      setMessages([]); // Clear previous chat history if starting new
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    // Send via WebSocket (bypasses DB)
    sendJsonMessage('chat', {
      type: 'ephemeral_chat',
      receiver_email: activeChat,
      content: inputMessage.trim()
    });

    // Append my own message locally
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender_email: 'Me',
      content: inputMessage.trim(),
      is_mine: true,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-xl flex items-center justify-center text-zinc-950 z-50 transition-all hover:scale-105"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
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
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      {!activeChat ? (
        <div className="flex-1 p-4 flex flex-col justify-center gap-3 bg-zinc-900/50">
          <p className="text-sm text-zinc-400 text-center mb-2">
            Start a secure, untracked, P2P ephemeral conversation.
          </p>
          <form onSubmit={handleStartChat} className="flex flex-col gap-2">
            <input 
              type="email"
              placeholder="Enter member's email..."
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
              required
            />
            <Button type="submit" className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-9 text-sm font-semibold">
              Start Chat
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="bg-zinc-950/50 px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span className="truncate">To: {activeChat}</span>
            <button onClick={() => setActiveChat('')} className="text-zinc-500 hover:text-zinc-300">Change</button>
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
                    {msg.sender_email} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
      )}
    </div>
  );
};
