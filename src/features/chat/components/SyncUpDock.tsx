import React, { useState } from 'react';
import { useSFUContext } from '@/features/calls/context/ChannelSFUContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, Maximize2, Minimize2, Users, Settings, ScreenShare, Video, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const SyncUpDock: React.FC = () => {
  const { isActive, participants, isMuted, toggleMute, leaveHuddle } = useSFUContext();
  const { user } = useAuth();
  const [isDocked, setIsDocked] = useState(false);

  if (!isActive) return null;

  // Include current user
  const allParticipants = [
    { userId: user?.id, username: user?.username + ' (You)', avatar: null, isMuted },
    ...participants
  ];

  if (isDocked) {
    return (
      <div className="fixed bottom-6 left-6 z-[100] w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-900">SyncUp</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-900" onClick={() => setIsDocked(false)}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 flex gap-3 overflow-x-auto custom-scrollbar">
          {allParticipants.map((p, idx) => (
            <div key={idx} className="relative shrink-0">
              <Avatar className="h-12 w-12 border-2 border-white ring-1 ring-gray-100 shadow-sm">
                {p.avatar ? (
                  <AvatarImage src={p.avatar} alt={p.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                    {p.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {p.isMuted && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-0.5 rounded-full ring-2 ring-white">
                  <MicOff className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant={isMuted ? "destructive" : "secondary"}
              className={`h-9 w-9 rounded-full ${!isMuted && 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button 
            size="icon" 
            variant="destructive"
            className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 shadow-sm"
            onClick={leaveHuddle}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Full Screen Mode
  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 text-teal-600 p-1.5 rounded-md">
            <Users className="h-4 w-4" />
          </div>
          <h1 className="text-[15px] font-semibold text-gray-900 font-['Outfit']">Team Space</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100" onClick={() => setIsDocked(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto h-full place-content-center">
          {allParticipants.map((p, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center aspect-square md:aspect-video relative border border-gray-200 shadow-sm"
            >
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  {p.avatar ? (
                    <AvatarImage src={p.avatar} alt={p.username} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold">
                      {p.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="absolute bottom-4 left-4 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                {p.username}
              </div>
              {p.isMuted && (
                <div className="absolute bottom-4 right-4 bg-red-50 text-red-500 p-2 rounded-full border border-red-100">
                  <MicOff className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-white border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex-1 flex items-center justify-start">
          <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full border border-purple-100 cursor-pointer">
            <span className="text-sm font-semibold">AI Notes: On</span>
            <div className="h-4 w-8 bg-purple-600 rounded-full flex items-center px-1">
              <div className="h-3 w-3 bg-white rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            className={`h-12 w-16 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100' 
                : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
            }`}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-full text-gray-400 border-gray-200 cursor-not-allowed">
            <Video className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-full text-gray-600 hover:bg-gray-100 border-gray-200">
            <ScreenShare className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-full text-gray-600 hover:bg-gray-100 border-gray-200">
            <Users className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-full text-gray-600 hover:bg-gray-100 border-gray-200">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-full text-gray-600 hover:bg-gray-100 border-gray-200">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button 
            size="lg"
            className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold ml-2 shadow-sm"
            onClick={leaveHuddle}
          >
            Leave
          </Button>
        </div>

        <div className="flex-1" />
      </div>
    </div>
  );
};
