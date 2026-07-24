import type { Middleware } from '@reduxjs/toolkit';
import { addMessageToThread } from '../slices/chatSlice';
import { receiveNotification } from '../slices/notificationSlice';
import { receiveCallSignal } from '../slices/callSlice';
import { userJoined, userLeft } from '../slices/presenceSlice';

export const websocketMiddleware: Middleware = (store) => (next) => (action: any) => {
  // Check if the action is our custom websocket receive action
  if (action.type === 'WEBSOCKET_RECEIVE') {
    const data = action.payload;
    const eventType = data.event_type || data.payload?.type;

    switch (eventType) {
      case 'NEW_MESSAGE':
      case 'new_reply':
        // Handle payload format from Django consumer or sample payload
        const threadId = data.payload?.topic_id || data.payload?.thread_id || data.payload?.data?.topic;
        const message = data.payload?.message || data.payload?.data;
        
        if (threadId && message) {
          store.dispatch(addMessageToThread({ threadId, message }));
        }
        break;

      case 'NOTIFICATION':
        store.dispatch(receiveNotification(data.payload));
        break;

      case 'WEBRTC_SIGNAL':
      case 'call.broadcast_signal':
        store.dispatch(receiveCallSignal(data.payload));
        break;

      case 'presence_update':
        if (data.payload?.action === 'user_joined') {
          store.dispatch(userJoined(data.payload.user_id));
        } else if (data.payload?.action === 'user_left') {
          store.dispatch(userLeft(data.payload.user_id));
        }
        break;

      default:
        // Pass through unknown websocket events if needed
        break;
    }
  }

  return next(action);
};
