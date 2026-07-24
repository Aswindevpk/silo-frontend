import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ChannelMessage } from '@/lib/api';

interface ChatState {
  threads: Record<string, ChannelMessage[]>;
}

const initialState: ChatState = {
  threads: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setHistoricalMessages: (state, action: PayloadAction<{ threadId: string | number; messages: ChannelMessage[] }>) => {
      state.threads[String(action.payload.threadId)] = action.payload.messages;
    },
    addMessageToThread: (state, action: PayloadAction<{ threadId: string | number; message: ChannelMessage }>) => {
      const threadId = String(action.payload.threadId);
      if (!state.threads[threadId]) {
        state.threads[threadId] = [];
      }
      
      const existingIds = new Set(state.threads[threadId].map(msg => msg.id));
      if (!existingIds.has(action.payload.message.id)) {
        state.threads[threadId].push(action.payload.message);
      }
    },
  },
});

export const { setHistoricalMessages, addMessageToThread } = chatSlice.actions;

export default chatSlice.reducer;
