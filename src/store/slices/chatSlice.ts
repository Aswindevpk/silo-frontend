import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  activeChannelId: string | number | null;
}

const initialState: ChatState = {
  activeChannelId: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChannel: (state, action: PayloadAction<string | number | null>) => {
      state.activeChannelId = action.payload;
    },
  },
});

export const { setActiveChannel } = chatSlice.actions;

export default chatSlice.reducer;
