import { useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export function useSiloChatRoom(workspaceId: number, channelId: number, topicId: number | null) {
  const { sendJsonMessage } = useWebSocket();

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

  return { sendReplyMessage };
}
