import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import callReducer from './slices/callSlice';
import presenceReducer from './slices/presenceSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    notification: notificationReducer,
    call: callReducer,
    presence: presenceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
