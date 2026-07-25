import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { toast } from 'sonner';
import { ringtoneManager } from '@/lib/audioUtils';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAuth } from './AuthContext';

interface CallContextType {
  callStatus: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  incomingCall: { callerId: number; callerEmail: string; withVideo?: boolean; sdp: RTCSessionDescriptionInit; channelId: number } | null;
  activeTargetEmail: string | null;
  activeChannelId: number | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  startCall: (channelId: number, receiverEmail: string, withVideo?: boolean) => Promise<void>;
  acceptCall: (withVideo?: boolean) => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const { user } = useAuth();
  
  const [incomingCall, setIncomingCall] = useState<{ callerId: number; callerEmail: string; withVideo?: boolean; sdp: RTCSessionDescriptionInit; channelId: number } | null>(null);
  const [activeTargetEmail, setActiveTargetEmail] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const targetEmailRef = useRef<string | null>(null);
  const channelIdRef = useRef<number | null>(null);

  const {
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    targetUserId,
    startCall: hookStartCall,
    acceptCall: hookAcceptCall,
    rejectCall: hookRejectCall,
    endCall: hookEndCall,
    toggleMute,
    toggleVideo,
    handleRemoteAnswer,
    addIceCandidate,
    setCallStatus,
    setTargetUserId,
    onIceCandidateRef,
    onRenegotiationRef
  } = useWebRTC();

  // 1. Manage Ringing Sounds based on callStatus
  useEffect(() => {
    if (callStatus === 'ringing') {
      ringtoneManager.start('incoming');
    } else if (callStatus === 'calling') {
      ringtoneManager.start('outgoing');
    } else {
      ringtoneManager.stop();
    }
    return () => ringtoneManager.stop();
  }, [callStatus]);

  // 2. Set up outgoing ICE candidate & Renegotiation handlers
  useEffect(() => {
    onIceCandidateRef.current = (candidate: RTCIceCandidate) => {
      // Send ICE candidate to peer
      if (channelIdRef.current) {
        sendJsonMessage('webrtc.ice_candidate', {
          target_user_id: targetUserId,
          candidate: candidate
        }, undefined, String(channelIdRef.current));
      }
    };

    onRenegotiationRef.current = (offer: RTCSessionDescriptionInit) => {
      if (channelIdRef.current) {
        sendJsonMessage('webrtc.call_renegotiate', {
          target_user_id: targetUserId,
          sdp: offer
        }, undefined, String(channelIdRef.current));
      }
    };
  }, [targetUserId, sendJsonMessage, onIceCandidateRef, onRenegotiationRef]);

  // 3. Register WebSocket Signal Handlers
  useEffect(() => {
    const cleanupOffer = registerMessageHandler('webrtc.call_offer', async (data: any, frame: any) => {
      const payload = data.payload || data;
      setIncomingCall({
        callerId: payload.sender_id,
        callerEmail: payload.caller_email || 'Member',
        withVideo: payload.with_video || false,
        sdp: payload.sdp,
        channelId: parseInt(frame.channel_id, 10)
      });
      setCallStatus('ringing');
      toast.info(`Incoming voice call from ${payload.caller_email || 'member'}`);
    });

    const cleanupAnswer = registerMessageHandler('webrtc.call_answer', async (data: any) => {
      const payload = data.payload || data;
      toast.success('Call accepted. Negotiating audio stream...');
      setTargetUserId(payload.sender_id);
      await handleRemoteAnswer(payload.sdp);
    });

    const cleanupIce = registerMessageHandler('webrtc.ice_candidate', async (data: any) => {
      const payload = data.payload || data;
      if (payload.candidate) {
        await addIceCandidate(payload.candidate);
      }
    });

    const cleanupEnd = registerMessageHandler('webrtc.call_end', () => {
      toast.error('The call has ended.');
      hookEndCall();
      setIncomingCall(null);
      setActiveTargetEmail(null);
      setActiveChannelId(null);
      channelIdRef.current = null;
    });

    const cleanupReject = registerMessageHandler('webrtc.call_reject', () => {
      toast.error('The call was rejected.');
      hookEndCall();
      setIncomingCall(null);
      setActiveTargetEmail(null);
      setActiveChannelId(null);
      channelIdRef.current = null;
    });

    return () => {
      cleanupOffer();
      cleanupAnswer();
      cleanupIce();
      cleanupEnd();
      cleanupReject();
    };
  }, [registerMessageHandler, handleRemoteAnswer, addIceCandidate, hookEndCall, setCallStatus, setTargetUserId]);

  // 4. Implement Public Context Methods
  const startCall = async (channelId: number, receiverEmail: string, withVideo: boolean = false) => {
    try {
      targetEmailRef.current = receiverEmail;
      channelIdRef.current = channelId;
      setActiveChannelId(channelId);
      const offer = await hookStartCall(null, withVideo);
      
      sendJsonMessage('webrtc.call_offer', {
        receiver_email: receiverEmail, 
        caller_email: user?.email,
        with_video: withVideo,
        sdp: offer
      }, undefined, String(channelId));
      setActiveTargetEmail(receiverEmail);
      toast.info(`Dialing ${receiverEmail}...`);
    } catch (err: any) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
         toast.error(err.message || 'Failed to start call');
      }
      hookEndCall();
      targetEmailRef.current = null;
      setActiveTargetEmail(null);
      channelIdRef.current = null;
      setActiveChannelId(null);
    }
  };

  const acceptCall = async (withVideo: boolean = false) => {
    if (!incomingCall) return;
    try {
      targetEmailRef.current = incomingCall.callerEmail;
      channelIdRef.current = incomingCall.channelId;
      setActiveChannelId(incomingCall.channelId);
      const answer = await hookAcceptCall(incomingCall.callerId, incomingCall.sdp, withVideo || incomingCall.withVideo);
      
      sendJsonMessage('webrtc.call_answer', {
        target_user_id: incomingCall.callerId,
        sdp: answer
      }, undefined, String(incomingCall.channelId));
      setActiveTargetEmail(incomingCall.callerEmail);
      setIncomingCall(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept call');
      hookEndCall();
      setIncomingCall(null);
      targetEmailRef.current = null;
      setActiveTargetEmail(null);
      channelIdRef.current = null;
      setActiveChannelId(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      sendJsonMessage('webrtc.call_reject', {
        target_user_id: incomingCall.callerId
      }, undefined, String(incomingCall.channelId));
    }
    hookRejectCall();
    setIncomingCall(null);
    targetEmailRef.current = null;
    setActiveTargetEmail(null);
    channelIdRef.current = null;
    setActiveChannelId(null);
  };

  const endCall = () => {
    if (channelIdRef.current) {
      sendJsonMessage('webrtc.call_end', {
        target_user_id: targetUserId,
        receiver_email: targetEmailRef.current
      }, undefined, String(channelIdRef.current));
    }
    hookEndCall();
    targetEmailRef.current = null;
    setActiveTargetEmail(null);
    channelIdRef.current = null;
    setActiveChannelId(null);
  };

  return (
    <CallContext.Provider value={{
      callStatus,
      incomingCall,
      activeTargetEmail,
      activeChannelId,
      localStream,
      remoteStream,
      isMuted,
      isVideoEnabled,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
