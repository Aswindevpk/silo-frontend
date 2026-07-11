import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { api, type CallSession } from '@/lib/api';
import { toast } from 'sonner';
import { ringtoneManager } from '@/lib/audioUtils';
import { useAuth } from './AuthContext';

interface CallContextType {
  activeSession: CallSession | null;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected';
  incomingCall: { sessionId: number; callerEmail: string } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (workspaceSlug: string, receiverEmail: string, withVideo?: boolean) => Promise<void>;
  acceptCall: (withVideo?: boolean) => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  isVideoEnabled: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const activeSessionRef = useRef<CallSession | null>(null);

  const setSessionState = (session: CallSession | null) => {
    setActiveSession(session);
    activeSessionRef.current = session;
  };

  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<{ sessionId: number; callerEmail: string; withVideo?: boolean } | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // WebRTC Configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  // Clean up WebRTC peer connections
  const cleanupWebRTC = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setSessionState(null);
    setIncomingCall(null);
    setIsVideoEnabled(false);
    iceCandidateQueueRef.current = [];
    ringtoneManager.stop();
  };

  // Set up Peer Connection and media tracks
  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
    }

    // Handle remote track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        // Create a new stream object to force React state update
        const newStream = new MediaStream(event.streams[0].getTracks());
        setRemoteStream(newStream);
      }
    };

    // Send ICE Candidates
    pc.onicecandidate = (event) => {
      const currentSession = activeSessionRef.current;
      if (event.candidate && currentSession && user) {
        const isCaller = user.email === currentSession.caller?.email;
        const targetId = isCaller ? currentSession.receiver?.id : currentSession.caller?.id;
        if (targetId) {
          sendJsonMessage('calls', {
            type: 'ice_candidate',
            receiver_id: targetId,
            candidate: event.candidate
          });
        }
      }
    };

    return pc;
  };

  // Subscribe to call signaling events
  useEffect(() => {
    // 1. Incoming Call signal
    const cleanupIncoming = registerMessageHandler('calls', 'incoming_call', (data) => {
      // Data contains: { session_id, caller_id, caller_email, with_video }
      setIncomingCall({
        sessionId: data.session_id,
        callerEmail: data.caller_email || 'Workspace Member',
        withVideo: data.with_video || false
      });
      setCallStatus('ringing');
      toast.info(`Incoming voice call from ${data.caller_email || 'member'}`);
    });

    // 2. Call Accepted signal (for Caller)
    const cleanupAccepted = registerMessageHandler('calls', 'call_accepted', async () => {
      toast.success('Call accepted. Negotiating audio stream...');
      setCallStatus('connected');

      const pc = await setupPeerConnection();
      
      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const targetId = activeSessionRef.current?.receiver?.id;
      if (targetId) {
        sendJsonMessage('calls', {
          type: 'webrtc_signal',
          receiver_id: targetId,
          sdp: offer
        });
      }
    });

    // 3. WebRTC Signal Relay (SDP Offer/Answer)
    const cleanupSignal = registerMessageHandler('calls', 'webrtc_signal', async (data) => {
      const pc = peerConnectionRef.current || (await setupPeerConnection());
      
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Process queued ICE candidates now that remote description is set
        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('Error adding queued ICE', err));
          }
        }

        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          sendJsonMessage('calls', {
            type: 'webrtc_signal',
            receiver_id: data.sender_id,
            sdp: answer
          });
          setCallStatus('connected');
        }
      }
    });

    // 4. ICE Candidates
    const cleanupIce = registerMessageHandler('calls', 'ice_candidate', async (data) => {
      if (data.candidate) {
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error('Error adding ICE candidate', err);
          }
        } else {
          // Queue it if remote description isn't set yet
          iceCandidateQueueRef.current.push(data.candidate);
        }
      }
    });

    // 5. Call Ended / Rejected
    const cleanupEnded = registerMessageHandler('calls', 'call_ended', () => {
      toast.error('The call has ended.');
      cleanupWebRTC();
    });

    return () => {
      cleanupIncoming();
      cleanupAccepted();
      cleanupSignal();
      cleanupIce();
      cleanupEnded();
    };
  }, [activeSession]);

  // Manage Ringing Sounds based on callStatus
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

  const requestMediaPermissions = async (withVideo: boolean = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      return stream;
    } catch (err) {
      toast.error(`Media access is required for calls.`);
      throw err;
    }
  };

  const startCall = async (workspaceSlug: string, receiverEmail: string, withVideo: boolean = false) => {
    try {
      // Get permissions BEFORE dialing
      const stream = await requestMediaPermissions(withVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoEnabled(withVideo);

      setCallStatus('calling');
      // Pass with_video to the custom payload if needed, but our backend doesn't support adding custom fields to the signal yet.
      const session = await api.createCall(workspaceSlug, receiverEmail);
      setSessionState(session);
      toast.info(`Dialing ${receiverEmail}...`);
    } catch (err: any) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
         toast.error(err.message || 'Failed to start call');
      }
      setCallStatus('idle');
      cleanupWebRTC();
    }
  };

  const acceptCall = async (withVideo: boolean = false) => {
    if (!incomingCall) return;
    try {
      // Get permissions BEFORE accepting
      const stream = await requestMediaPermissions(withVideo || incomingCall.withVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoEnabled(withVideo || incomingCall.withVideo || false);

      const session = await api.acceptCall(incomingCall.sessionId);
      setSessionState(session);
      setIncomingCall(null);
      setCallStatus('connected');
      
      // Start media connections
      await setupPeerConnection();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept call');
      cleanupWebRTC();
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    try {
      await api.endCall(incomingCall.sessionId);
      setIncomingCall(null);
      setCallStatus('idle');
      toast.info('Call rejected.');
    } catch (err) {
      console.error(err);
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  const endCall = async () => {
    if (!activeSession) return;
    try {
      await api.endCall(activeSession.id);
      cleanupWebRTC();
      toast.info('Call ended.');
    } catch (err) {
      cleanupWebRTC();
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current || !peerConnectionRef.current) return;
    
    try {
      if (isVideoEnabled) {
        // Turn off video
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
          setIsVideoEnabled(false);
          // Need to renegotiate or just let the track go black. Removing track requires renegotiation.
          // For simplicity, just disable it:
          // videoTrack.enabled = false;
        }
      } else {
        // Turn on video
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        localStreamRef.current.addTrack(videoTrack);
        
        // Add to peer connection
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        } else {
          peerConnectionRef.current.addTrack(videoTrack, localStreamRef.current);
          // Trigger renegotiation
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          const currentSession = activeSessionRef.current;
          const targetId = user?.email === currentSession?.caller?.email ? currentSession?.receiver?.id : currentSession?.caller?.id;
          if (targetId) {
            sendJsonMessage('calls', {
              type: 'webrtc_signal',
              receiver_id: targetId,
              sdp: offer
            });
          }
        }
        setIsVideoEnabled(true);
      }
    } catch (err) {
      toast.error('Could not toggle camera.');
    }
  };

  return (
    <CallContext.Provider value={{
      activeSession,
      callStatus,
      incomingCall,
      localStream,
      remoteStream,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleVideo,
      isVideoEnabled
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
