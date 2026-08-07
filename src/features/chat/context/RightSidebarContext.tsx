import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type RightSidebarType = 'profile' | 'details' | 'custom' | 'thread' | null;

type RightSidebarContextType = {
  isOpen: boolean;
  type: RightSidebarType;
  data: any; // Can be UserProfileData or other data based on type
  openSidebar: (type: RightSidebarType, data: any) => void;
  openProfile: (profile: any) => void; // Convenience method
  closeSidebar: () => void;
};

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

export const RightSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<RightSidebarType>(null);
  const [data, setData] = useState<any>(null);

  const openSidebar = (newType: RightSidebarType, newData: any) => {
    setType(newType);
    setData(newData);
    setIsOpen(true);
  };

  const openProfile = (profile: any) => {
    openSidebar('profile', profile);
  };

  const closeSidebar = () => {
    setIsOpen(false);
    // Delay clearing data to allow for smooth closing animation
    setTimeout(() => {
      setType(null);
      setData(null);
    }, 300);
  };

  return (
    <RightSidebarContext.Provider value={{ isOpen, type, data, openSidebar, openProfile, closeSidebar }}>
      {children}
    </RightSidebarContext.Provider>
  );
};

export const useRightSidebar = () => {
  const context = useContext(RightSidebarContext);
  if (context === undefined) {
    throw new Error('useRightSidebar must be used within a RightSidebarProvider');
  }
  return context;
};
