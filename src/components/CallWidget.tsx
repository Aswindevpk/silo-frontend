import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/context/CallContext';
import { PhoneOff, PhoneCall, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export const CallWidget: React.FC = () => {
  const {
    callStatus,
    incomingCall,
    activeTargetEmail,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    isVideoEnabled,
    isMuted,
    toggleMute
  } = useCall();

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  // Attach remote stream to audio/video elements
  useEffect(() => {
    if (remoteStream) {
      if (audioRef.current) audioRef.current.srcObject = remoteStream;
      if (videoRef.current) videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callStatus === 'connected') {
      interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (callStatus === 'idle') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <audio ref={audioRef} autoPlay playsInline className="hidden" />
      
      {/* 1. Incoming Call Dialog */}
      {incomingCall && callStatus === 'ringing' && (
        <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-6 flex flex-col items-center animate-in slide-in-from-bottom-5 w-80 pointer-events-auto">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
            {(incomingCall.callerEmail || '?').charAt(0).toUpperCase()}
          </div>
          <h3 className="text-white font-semibold text-lg">{incomingCall.callerEmail || 'Incoming Call'}</h3>
          <p className="text-zinc-400 text-sm mb-6 animate-pulse">is calling you...</p>
          
          <div className="flex gap-4 w-full">
            <button
              onClick={rejectCall}
              className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-medium border border-red-500/20"
            >
              Decline
            </button>
            <button
              onClick={() => acceptCall(false)}
              className="flex-1 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition shadow-lg shadow-green-500/20 font-medium flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Call Widget */}
      {!incomingCall && (
        <div className={`bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center animate-in slide-in-from-bottom-5 transition-all pointer-events-auto ${isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0) ? 'w-96' : 'w-72 p-4 gap-4'}`}>
          
          {/* Video Container (only visible if video enabled on either end) */}
          {(isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0)) && (
            <div className="w-full aspect-video bg-black relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {isVideoEnabled && (
                <div className="absolute bottom-2 right-2 w-24 aspect-video bg-zinc-800 rounded overflow-hidden shadow-lg border border-zinc-700">
                  <video ref={(el) => { if (el && localStream) el.srcObject = localStream; }} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                </div>
              )}
            </div>
          )}

          {/* Audio/Avatar Container */}
          <div className={`flex items-center gap-4 w-full ${isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0) ? 'p-4 border-t border-zinc-800 bg-zinc-900/90' : ''}`}>
            {!(isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0)) && (
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
                 {(activeTargetEmail || '?').charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">
                {activeTargetEmail || 'Unknown User'}
              </h3>
              <p className="text-zinc-400 text-xs">
                {callStatus === 'calling' ? 'Calling...' : (!(isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0)) ? formatDuration(duration) : 'Connected')}
              </p>
            </div>
          </div>

          <div className={`flex gap-3 justify-center w-full pt-2 ${isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0) ? 'pb-4' : 'border-t border-zinc-800'}`}>
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition ${
                isMuted 
                  ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700' 
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition ${
                !isVideoEnabled 
                  ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700' 
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-lg shadow-red-500/20"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
