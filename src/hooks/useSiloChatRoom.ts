import { useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export function useSiloChatRoom(workspaceId: number, channelId: number) {
  const { sendJsonMessage } = useWebSocket();

  const sendChannelMessage = useCallback((textContent: string) => {
    sendJsonMessage('chat', {
      type: 'send_channel_message',
      workspace_id: workspaceId,
      channel_id: channelId,
      content: textContent
    });
  }, [sendJsonMessage, workspaceId, channelId]);

  return { sendChannelMessage };
}
