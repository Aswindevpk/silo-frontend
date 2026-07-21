import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Reply } from '@/lib/api';

interface ChatState {
  threads: Record<string, Reply[]>;
}

const initialState: ChatState = {
  threads: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setHistoricalMessages: (state, action: PayloadAction<{ threadId: string | number; messages: Reply[] }>) => {
      state.threads[String(action.payload.threadId)] = action.payload.messages;
    },
    receiveLiveMessage: (state, action: PayloadAction<{ threadId: string | number; message: Reply }>) => {
      const threadId = String(action.payload.threadId);
      const incomingMessage = action.payload.message;

      if (!state.threads[threadId]) {
        state.threads[threadId] = [];
      }

      // Deduplicate by message ID
      const exists = state.threads[threadId].some((msg) => msg.id === incomingMessage.id);
      if (!exists) {
        state.threads[threadId].push(incomingMessage);
      }
    },
  },
});

export const { setHistoricalMessages, receiveLiveMessage } = chatSlice.actions;
export default chatSlice.reducer;
