import { useCallback } from 'react';
import { useWebSocket } from "@/context/WebSocketContext";

export function useSiloChatRoom(workspaceId: number, channelId: number) {
  const { sendJsonMessage } = useWebSocket();

  const sendChannelMessage = useCallback((textContent: string, attachments: any[] = [], parent_id?: number | null) => {
    sendJsonMessage('chat.send_message', {
      content: textContent,
      attachments: attachments,
      parent_id: parent_id,
      client_msg_id: Math.random().toString(36).substring(7)
    }, workspaceId.toString(), channelId.toString());
  }, [sendJsonMessage, workspaceId, channelId]);

  const sendReaction = useCallback((messageId: string | number, emoji: string) => {
    sendJsonMessage('chat.message_reaction', { message_id: messageId, emoji }, workspaceId.toString(), channelId.toString());
  }, [sendJsonMessage, workspaceId, channelId]);

  const sendEdit = useCallback((messageId: string | number, content: string) => {
    sendJsonMessage('chat.message_edit', { message_id: messageId, content }, workspaceId.toString(), channelId.toString());
  }, [sendJsonMessage, workspaceId, channelId]);

  const sendDelete = useCallback((messageId: string | number) => {
    sendJsonMessage('chat.message_delete', { message_id: messageId }, workspaceId.toString(), channelId.toString());
  }, [sendJsonMessage, workspaceId, channelId]);

  const sendPin = useCallback((messageId: string | number) => {
    sendJsonMessage('chat.message_pin', { message_id: messageId }, workspaceId.toString(), channelId.toString());
  }, [sendJsonMessage, workspaceId, channelId]);

  return { sendChannelMessage, sendReaction, sendEdit, sendDelete, sendPin };
}
