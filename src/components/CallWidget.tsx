import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/context/CallContext';
import { PhoneOff, PhoneCall, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export const CallWidget: React.FC = () => {
  const {
    callStatus,
    incomingCall,
    activeSession,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    isVideoEnabled
  } = useCall();

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

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

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (callStatus === 'idle') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {callStatus === 'ringing' && incomingCall && (
        <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl p-5 w-80 animate-in slide-in-from-bottom-5">
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
              <PhoneCall className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">Incoming Call</h3>
              <p className="text-sm text-zinc-400">{incomingCall.callerEmail}</p>
            </div>
            <div className="flex gap-4 mt-4 w-full">
              <button
                onClick={rejectCall}
                className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium transition"
              >
                Decline
              </button>
              <button
                onClick={() => acceptCall(false)}
                className="flex-1 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium transition shadow-lg shadow-green-500/20"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {(callStatus === 'connected' || callStatus === 'calling') && (
        <div className={`bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center animate-in slide-in-from-bottom-5 transition-all ${isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0) ? 'w-96' : 'w-72 p-4 gap-4'}`}>
          
          {/* Video Container */}
          {(isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0)) && (
             <div className="relative w-full h-64 bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {formatDuration(duration)}
                </div>
             </div>
          )}

          <div className={`flex items-center gap-4 w-full ${isVideoEnabled || (remoteStream && remoteStream.getVideoTracks().length > 0) ? 'p-4 border-t border-zinc-800 bg-zinc-900/90' : ''}`}>
            <div className="relative">
              <div className="h-12 w-12 bg-zinc-800 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-white">
                  {(activeSession?.receiver?.username || activeSession?.receiver?.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              {callStatus === 'connected' && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {activeSession?.receiver?.email || 'Unknown User'}
              </h4>
              <p className="text-xs text-zinc-400">
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
