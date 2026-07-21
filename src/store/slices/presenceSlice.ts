import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface PresenceState {
  onlineUserIds: number[];
}

const initialState: PresenceState = {
  onlineUserIds: [],
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setInitialPresence: (state, action: PayloadAction<number[]>) => {
      state.onlineUserIds = action.payload;
    },
    userJoined: (state, action: PayloadAction<number>) => {
      if (!state.onlineUserIds.includes(action.payload)) {
        state.onlineUserIds.push(action.payload);
      }
    },
    userLeft: (state, action: PayloadAction<number>) => {
      state.onlineUserIds = state.onlineUserIds.filter(id => id !== action.payload);
    },
  },
});

export const { setInitialPresence, userJoined, userLeft } = presenceSlice.actions;
export default presenceSlice.reducer;
