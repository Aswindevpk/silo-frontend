import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface CallState {
  incomingCall: any | null;
  callSignal: any | null;
}

const initialState: CallState = {
  incomingCall: null,
  callSignal: null,
};

export const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    receiveCallSignal: (state, action: PayloadAction<any>) => {
      // The payload will contain the offer, answer, or ice candidate
      state.callSignal = action.payload;
      
      // If it's a new offer, we might want to flag it as an incoming call explicitly
      if (action.payload?.signal_data?.type === 'offer') {
        state.incomingCall = action.payload;
      }
    },
    clearCallState: (state) => {
      state.incomingCall = null;
      state.callSignal = null;
    },
  },
});

export const { receiveCallSignal, clearCallState } = callSlice.actions;
export default callSlice.reducer;
