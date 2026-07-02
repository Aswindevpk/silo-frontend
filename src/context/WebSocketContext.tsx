import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/api';

interface WebSocketContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  subscribeToChannel: (channelId: number) => void;
  sendJsonMessage: (message: any) => void;
  registerMessageHandler: (type: string, handler: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  // Connect WebSocket
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/users/';
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      
      // Perform in-band JWT Authentication
      const token = getAccessToken();
      if (token) {
        socket.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        // Handle auth success response if backend notifies us
        if (payload.message === 'Authentication successful!' || (payload.status === 'success' && payload.message?.includes('Subscribed'))) {
          if (payload.message === 'Authentication successful!') {
            setIsAuthenticated(true);
          }
        }

        // Standard notification broadcast type
        const type = payload.type || payload.status;
        if (type) {
          const handlers = messageHandlersRef.current.get(type);
          if (handlers) {
            handlers.forEach((handler) => handler(payload.data || payload));
          }
        }
      } catch (err) {
        console.error('Error parsing web socket frame message', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    socket.onerror = (err) => {
      console.error('WebSocket encountered an error', err);
    };

    return () => {
      socket.close();
    };
  }, []);

  const subscribeToChannel = (channelId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'subscribe',
        channel_id: channelId
      }));
    }
  };

  const sendJsonMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send websocket message: Socket is not open.');
    }
  };

  const registerMessageHandler = (type: string, handler: (data: any) => void) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type)!.add(handler);

    // Return cleanup function to unregister
    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(type);
        }
      }
    };
  };

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      isAuthenticated,
      subscribeToChannel,
      sendJsonMessage,
      registerMessageHandler
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
