import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useChannelSFUHuddle } from '@/features/calls/hooks/useChannelSFUHuddle';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

export const ChannelCallRoom: React.FC = () => {
  const { workspaceSlug, channelId } = useParams<{ workspaceSlug: string; channelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const action = searchParams.get('action'); // "start" or "join"
  const callIdParam = searchParams.get('callId');
  
  const { isActive, isMuted, participants, startHuddle, joinHuddle, autoHuddle, leaveHuddle, toggleMute, endCall, callId, creatorId } = useChannelSFUHuddle();
  
  const [error, setError] = useState<{ message: string; existingCallId?: number; existingCreatorId?: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const initCall = async () => {
      if (isActive || error) return;
      
      try {
        if (action === 'start') {
          await startHuddle(channelId!);
        } else if (action === 'join' && callIdParam) {
          await joinHuddle(parseInt(callIdParam), channelId!);
        } else if (action === 'auto') {
          await autoHuddle(channelId!);
        } else {
          if (mounted) setError({ message: "Invalid call parameters." });
        }
      } catch (err: any) {
        if (mounted) {
          setError({
            message: err.message || "Failed to connect to the call.",
            existingCallId: err.existingCallId,
            existingCreatorId: err.existingCreatorId,
          });
        }
      }
    };
    
    initCall();
    
    // Cleanup is handled by leaving the page
    return () => {
      mounted = false;
      leaveHuddle();
    };
  }, [action, callIdParam, channelId]); // remove isActive/error to avoid re-triggering

  const handleLeave = () => {
    leaveHuddle();
    navigate(`/w/${workspaceSlug}/channel/${channelId}`);
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 h-full">
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center max-w-md w-full">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <PhoneOff className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Call Error</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <div className="flex flex-col gap-3">
            {error.existingCreatorId && user && String(error.existingCreatorId) === String(user.id) && error.existingCallId && (
              <Button 
                variant="destructive"
                onClick={async () => {
                  try {
                    await endCall(error.existingCallId!);
                    navigate(`/w/${workspaceSlug}/channel/${channelId}`);
                  } catch (e) {
                    console.error(e);
                  }
                }} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                End Existing Call
              </Button>
            )}
            <Button onClick={() => navigate(`/w/${workspaceSlug}/channel/${channelId}`)} variant={error.existingCreatorId ? "outline" : "default"} className="w-full">
              Return to Channel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Include the current user in the grid
  const allParticipants = [
    { userId: user?.id, username: user?.username + ' (You)', avatar: null, isMuted },
    ...participants
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/20 text-teal-400 p-2 rounded-md">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-medium text-white">Channel Voice Huddle</h1>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-sm">
          {isActive ? (
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto h-full place-content-center">
          {allParticipants.map((p, idx) => (
            <div 
              key={idx} 
              className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center aspect-video relative border border-white/5 shadow-xl"
            >
              <div className="relative mb-4">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.username} className="w-24 h-24 rounded-full object-cover border-4 border-slate-700" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-semibold text-white border-4 border-slate-700 shadow-inner">
                    {p.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                {p.isMuted && (
                  <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-800">
                    <MicOff className="h-4 w-4" />
                  </div>
                )}
              </div>
              <span className="text-white font-medium text-lg drop-shadow-sm">{p.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 border-t border-white/10 flex items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-md sticky bottom-0">
        <Button
          variant="outline"
          size="lg"
          onClick={toggleMute}
          className={`rounded-full w-14 h-14 p-0 border-0 ${
            isMuted 
              ? 'bg-slate-700 text-red-400 hover:bg-slate-600 hover:text-red-300' 
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          onClick={handleLeave}
          className="rounded-full w-14 h-14 p-0 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
        {creatorId && user && String(creatorId) === String(user.id) && callId && (
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await endCall(callId);
                navigate(`/w/${workspaceSlug}/channel/${channelId}`);
              } catch (e) {
                console.error(e);
              }
            }}
            className="rounded-full h-14 px-6 bg-red-900 hover:bg-red-950 shadow-lg"
          >
            End Call for Everyone
          </Button>
        )}
      </div>
    </div>
  );
};
