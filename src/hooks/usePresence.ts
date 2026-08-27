import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { setInitialPresence, userJoined, userLeft } from '@/store/slices/presenceSlice';
import { api } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';

export const usePresence = (_workspaceSlug?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const onlineUserIds = useSelector((state: RootState) => state.presence.onlineUserIds);

  useEffect(() => {
    // Fetch initial presence exactly once when mounted
    let isMounted = true;
    const fetchPresence = async () => {
      try {
        const ids = await api.getOnlineUsers();
        if (isMounted) {
          dispatch(setInitialPresence(ids));
        }
      } catch (err) {
        console.error("Failed to fetch initial online users", err);
      }
    };
    
    fetchPresence();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Listen for WebSocket delta updates for presence
  const { registerMessageHandler } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = registerMessageHandler('presence.status_change', (data: any) => {
      const userIdNum = Number(data.user_id);
      if (data.status === 'online') {
        dispatch(userJoined(userIdNum));
      } else if (data.status === 'offline') {
        dispatch(userLeft(userIdNum));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [registerMessageHandler, dispatch]);

  // Convert array to Set for fast lookup if needed, or just use includes
  return {
    onlineUserIds: new Set(onlineUserIds),
    isOnline: (userId: number) => onlineUserIds.includes(userId)
  };
};
