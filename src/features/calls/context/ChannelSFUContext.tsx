import React, { createContext, useContext, type ReactNode } from 'react';
import { useChannelSFUHuddle } from '@/features/calls/hooks/useChannelSFUHuddle';

type SFUContextType = ReturnType<typeof useChannelSFUHuddle>;

const ChannelSFUContext = createContext<SFUContextType | undefined>(undefined);

export const ChannelSFUProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const sfu = useChannelSFUHuddle();
  return (
    <ChannelSFUContext.Provider value={sfu}>
      {children}
    </ChannelSFUContext.Provider>
  );
};

export const useSFUContext = () => {
  const context = useContext(ChannelSFUContext);
  if (!context) {
    throw new Error('useSFUContext must be used within a ChannelSFUProvider');
  }
  return context;
};
