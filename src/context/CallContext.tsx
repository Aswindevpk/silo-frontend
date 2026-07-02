import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { api, type CallSession } from '@/lib/api';
import { toast } from 'sonner';

interface CallContextType {
  activeSession: CallSession | null;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected';
  incomingCall: { sessionId: number; callerEmail: string } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (workspaceSlug: string, receiverEmail: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<{ sessionId: number; callerEmail: string } | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

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
    setActiveSession(null);
    setIncomingCall(null);
  };

  // Set up Peer Connection and media tracks
  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Request local audio stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      console.warn('Microphone permission denied or unavailable, running calling flow in silent mode.', err);
    }

    // Handle remote track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Send ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && activeSession) {
        sendJsonMessage({
          type: 'ice_candidate',
          receiver_id: activeSession.receiver?.id === activeSession.caller?.id ? activeSession.caller?.id : activeSession.receiver?.id,
          candidate: event.candidate
        });
      }
    };

    return pc;
  };

  // Subscribe to call signaling events
  useEffect(() => {
    // 1. Incoming Call signal
    const cleanupIncoming = registerMessageHandler('incoming_call', (data) => {
      // Data contains: { session_id, caller_id, caller_email }
      setIncomingCall({
        sessionId: data.session_id,
        callerEmail: data.caller_email || 'Workspace Member'
      });
      setCallStatus('ringing');
      toast.info(`Incoming voice call from ${data.caller_email || 'member'}`);
    });

    // 2. Call Accepted signal (for Caller)
    const cleanupAccepted = registerMessageHandler('call_accepted', async () => {
      toast.success('Call accepted. Negotiating audio stream...');
      setCallStatus('connected');

      const pc = await setupPeerConnection();
      
      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendJsonMessage({
        type: 'webrtc_signal',
        receiver_id: activeSession?.receiver?.id,
        sdp: offer
      });
    });

    // 3. WebRTC Signal Relay (SDP Offer/Answer)
    const cleanupSignal = registerMessageHandler('webrtc_signal', async (data) => {
      const pc = peerConnectionRef.current || (await setupPeerConnection());
      
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          sendJsonMessage({
            type: 'webrtc_signal',
            receiver_id: data.sender_id,
            sdp: answer
          });
          setCallStatus('connected');
        }
      }
    });

    // 4. ICE Candidates
    const cleanupIce = registerMessageHandler('ice_candidate', async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      }
    });

    // 5. Call Ended / Rejected
    const cleanupEnded = registerMessageHandler('call_ended', () => {
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

  const startCall = async (workspaceSlug: string, receiverEmail: string) => {
    try {
      setCallStatus('calling');
      const session = await api.createCall(workspaceSlug, receiverEmail);
      setActiveSession(session);
      
      // Send WebSocket Dial Request
      sendJsonMessage({
        type: 'call_request',
        receiver_id: session.receiver?.id
      });
      toast.info(`Dialing ${receiverEmail}...`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start call');
      setCallStatus('idle');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const session = await api.acceptCall(incomingCall.sessionId);
      setActiveSession(session);
      setIncomingCall(null);
      setCallStatus('connected');

      // Inform Caller via WebSockets
      sendJsonMessage({
        type: 'call_accept',
        session_id: session.id
      });
      
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
      // In WebSockets, send reject signal
      sendJsonMessage({
        type: 'call_reject',
        session_id: incomingCall.sessionId
      });
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
      sendJsonMessage({
        type: 'call_reject', // Signaling consumer handles this as closing
        session_id: activeSession.id
      });
      cleanupWebRTC();
      toast.info('Call ended.');
    } catch (err) {
      cleanupWebRTC();
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
      endCall
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
