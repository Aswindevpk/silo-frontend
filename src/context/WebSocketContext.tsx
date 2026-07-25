import React, { createContext, useContext, useEffect, useState } from 'react';
import { wsManager } from '@/lib/WebSocketManager';
import { useAuth } from '@/context/AuthContext';


interface WebSocketContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  subscribeToChannel: (channelId: number | string, workspaceId?: string) => void;
  sendJsonMessage: (type: string, payload: any, workspaceId?: string, channelId?: string) => void;
  registerMessageHandler: (type: string, handler: (data: any, frame: any) => void) => () => void;
  toggleConnection: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isWsAuthenticated, setIsWsAuthenticated] = useState(false);
  const { isAuthenticated } = useAuth(); // from AuthContext

  useEffect(() => {
    // Sync React state with the global manager
    const unsubscribe = wsManager.onStateChange((connected, authenticated) => {
      setIsConnected(connected);
      setIsWsAuthenticated(authenticated);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Only connect if user is authenticated via AuthContext
    if (isAuthenticated) {
      wsManager.connect();
    } else {
      wsManager.disconnect();
    }
    
    // We do not cleanup connect/disconnect on unmount to survive React StrictMode,
    // we only depend on isAuthenticated changing.
  }, [isAuthenticated]);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      isAuthenticated: isWsAuthenticated,
      subscribeToChannel: wsManager.subscribeToChannel.bind(wsManager),
      sendJsonMessage: wsManager.sendJsonMessage.bind(wsManager),
      registerMessageHandler: wsManager.registerMessageHandler.bind(wsManager),
      toggleConnection: () => {
        if (isConnected) {
          wsManager.disconnect();
        } else {
          wsManager.connect();
        }
      }
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

