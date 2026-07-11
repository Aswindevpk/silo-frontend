import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export function useSiloChatRoom(workspaceId: number, channelId: number, topicId: number | null) {
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const [activeTypers, setActiveTypers] = useState<Record<number, boolean>>({});

  // 1. Send Reply Message Mutation directly across the open socket pipeline
  const sendReplyMessage = useCallback((textContent: string) => {
    if (!topicId) return;
    sendJsonMessage('chat', {
      type: 'send_reply',
      workspace_id: workspaceId,
      channel_id: channelId,
      topic_id: topicId,
      content: textContent
    });
  }, [sendJsonMessage, workspaceId, channelId, topicId]);

  // 2. Broadcast volatile typing status parameters
  const updateTypingStatus = useCallback((isTypingValue: boolean) => {
    sendJsonMessage('chat', {
      type: 'typing_indicator',
      workspace_id: workspaceId,
      channel_id: channelId,
      is_typing: isTypingValue
    });
  }, [sendJsonMessage, workspaceId, channelId]);

  // 3. Centralized event subscriber loop hook
  useEffect(() => {
    const cleanupTyping = registerMessageHandler('chat', 'user_typing', (data: any) => {
      setActiveTypers((prevMap) => ({
        ...prevMap,
        [data.user_id]: data.is_typing
      }));
    });

    return () => {
      cleanupTyping();
    };
  }, [registerMessageHandler]);

  return { sendReplyMessage, updateTypingStatus, activeTypers };
}
