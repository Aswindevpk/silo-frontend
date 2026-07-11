import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

export const usePresence = (workspaceSlug?: string) => {
  const { sendJsonMessage, registerMessageHandler, isConnected } = useWebSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!workspaceSlug || !isConnected) return;

    // Send heartbeat immediately on connect, then every 30s
    const sendHeartbeat = () => {
      sendJsonMessage('system', {
        type: 'presence_heartbeat',
        workspace_slug: workspaceSlug
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    // Listen for presence broadcasts
    const unsubscribe = registerMessageHandler('system', 'presence_update', (data) => {
      const { user_id, status } = data;
      if (user_id) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (status === 'online') {
            next.add(user_id);
          } else {
            next.delete(user_id);
          }
          return next;
        });
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [workspaceSlug, isConnected]);

  return {
    onlineUserIds,
    isOnline: (userId: number) => onlineUserIds.has(userId)
  };
};
