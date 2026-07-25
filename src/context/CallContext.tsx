import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { toast } from 'sonner';
import { ringtoneManager } from '@/lib/audioUtils';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAuth } from './AuthContext';

interface CallContextType {
  callStatus: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  incomingCall: { callerId: number; callerEmail: string; withVideo?: boolean; sdp: RTCSessionDescriptionInit } | null;
  activeTargetEmail: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  startCall: (workspaceSlug: string, receiverEmail: string, withVideo?: boolean) => Promise<void>;
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
  
  const [incomingCall, setIncomingCall] = useState<{ callerId: number; callerEmail: string; withVideo?: boolean; sdp: RTCSessionDescriptionInit } | null>(null);
  const [activeTargetEmail, setActiveTargetEmail] = useState<string | null>(null);
  const targetEmailRef = useRef<string | null>(null);

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
      if (targetUserId !== null) {
        sendJsonMessage('calls', {
          type: 'ice_candidate',
          target_user_id: targetUserId,
          candidate: candidate
        });
      } else if (targetEmailRef.current) {
        sendJsonMessage('calls', {
          type: 'ice_candidate',
          receiver_email: targetEmailRef.current,
          candidate: candidate
        });
      }
    };

    onRenegotiationRef.current = (offer: RTCSessionDescriptionInit) => {
      if (targetUserId !== null) {
        sendJsonMessage('calls', {
          type: 'call_renegotiate',
          target_user_id: targetUserId,
          sdp: offer
        });
      }
    };
  }, [targetUserId, sendJsonMessage, onIceCandidateRef, onRenegotiationRef]);

  // 3. Register WebSocket Signal Handlers
  useEffect(() => {
    const cleanupOffer = registerMessageHandler('calls', 'call_offer', async (data: any) => {
      setIncomingCall({
        callerId: data.sender_id,
        callerEmail: data.caller_email || 'Member',
        withVideo: data.with_video || false,
        sdp: data.sdp
      });
      setCallStatus('ringing');
      toast.info(`Incoming voice call from ${data.caller_email || 'member'}`);
    });

    const cleanupAnswer = registerMessageHandler('calls', 'call_answer', async (data: any) => {
      toast.success('Call accepted. Negotiating audio stream...');
      // Caller saves the target ID they got from the answer
      setTargetUserId(data.sender_id);
      await handleRemoteAnswer(data.sdp);
    });

    const cleanupIce = registerMessageHandler('calls', 'ice_candidate', async (data: any) => {
      if (data.candidate) {
        await addIceCandidate(data.candidate);
      }
    });

    const cleanupEnd = registerMessageHandler('calls', 'call_end', () => {
      toast.error('The call has ended.');
      hookEndCall();
      setIncomingCall(null);
      setActiveTargetEmail(null);
    });

    const cleanupReject = registerMessageHandler('calls', 'call_reject', () => {
      toast.error('The call was rejected.');
      hookEndCall();
      setIncomingCall(null);
      setActiveTargetEmail(null);
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
  const startCall = async (_workspaceSlug: string, receiverEmail: string, withVideo: boolean = false) => {
    try {
      targetEmailRef.current = receiverEmail;
      const offer = await hookStartCall(null, withVideo);
      
      sendJsonMessage('calls', {
        type: 'call_offer',
        receiver_email: receiverEmail, 
        caller_email: user?.email,
        with_video: withVideo,
        sdp: offer
      });
      setActiveTargetEmail(receiverEmail);
      toast.info(`Dialing ${receiverEmail}...`);
    } catch (err: any) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
         toast.error(err.message || 'Failed to start call');
      }
      hookEndCall();
      targetEmailRef.current = null;
      setActiveTargetEmail(null);
    }
  };

  const acceptCall = async (withVideo: boolean = false) => {
    if (!incomingCall) return;
    try {
      targetEmailRef.current = incomingCall.callerEmail;
      const answer = await hookAcceptCall(incomingCall.callerId, incomingCall.sdp, withVideo || incomingCall.withVideo);
      
      sendJsonMessage('calls', {
        type: 'call_answer',
        target_user_id: incomingCall.callerId,
        sdp: answer
      });
      setActiveTargetEmail(incomingCall.callerEmail);
      setIncomingCall(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept call');
      hookEndCall();
      setIncomingCall(null);
      targetEmailRef.current = null;
      setActiveTargetEmail(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      sendJsonMessage('calls', {
        type: 'call_reject',
        target_user_id: incomingCall.callerId
      });
    }
    hookRejectCall();
    setIncomingCall(null);
    targetEmailRef.current = null;
    setActiveTargetEmail(null);
  };

  const endCall = () => {
    if (targetUserId) {
      sendJsonMessage('calls', {
        type: 'call_end',
        target_user_id: targetUserId
      });
    } else if (targetEmailRef.current) {
      sendJsonMessage('calls', {
        type: 'call_end',
        receiver_email: targetEmailRef.current
      });
    }
    hookEndCall();
    targetEmailRef.current = null;
    setActiveTargetEmail(null);
  };

  return (
    <CallContext.Provider value={{
      callStatus,
      incomingCall,
      activeTargetEmail,
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
