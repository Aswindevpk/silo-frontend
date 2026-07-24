import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected';

export interface UseWebRTCReturn {
  callStatus: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  targetUserId: number | null;
  startCall: (targetId: number, withVideo?: boolean) => Promise<RTCSessionDescriptionInit>;
  acceptCall: (targetId: number, offerSdp: RTCSessionDescriptionInit, withVideo?: boolean) => Promise<RTCSessionDescriptionInit>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  handleRemoteAnswer: (answerSdp: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  setCallStatus: React.Dispatch<React.SetStateAction<CallStatus>>;
  setTargetUserId: React.Dispatch<React.SetStateAction<number | null>>;
  onIceCandidateRef: React.MutableRefObject<((candidate: RTCIceCandidate) => void) | null>;
  onRenegotiationRef: React.MutableRefObject<((offer: RTCSessionDescriptionInit) => void) | null>;
}

const DEFAULT_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceTransportPolicy: 'relay'
};

export const useWebRTC = (): UseWebRTCReturn => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const onIceCandidateRef = useRef<((candidate: RTCIceCandidate) => void) | null>(null);
  const onRenegotiationRef = useRef<((offer: RTCSessionDescriptionInit) => void) | null>(null);

  const requestMedia = async (withVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(withVideo);
      setIsMuted(false);
      return stream;
    } catch (err) {
      toast.error('Microphone/Camera permission denied or device not found.');
      throw err;
    }
  };

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        localStreamRef.current?.removeTrack(track);
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    setCallStatus('idle');
    setTargetUserId(null);
    setIsVideoEnabled(false);
    setIsMuted(false);
  }, []);

  const createPeerConnection = useCallback((config: RTCConfiguration = DEFAULT_ICE_SERVERS) => {
    const pc = new RTCPeerConnection(config);

    // Send ICE candidates out
    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidateRef.current) {
        onIceCandidateRef.current(event.candidate);
      }
    };

    // Receive remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        // Clone stream to trigger React re-renders if necessary, or just set it
        const newStream = new MediaStream(event.streams[0].getTracks());
        setRemoteStream(newStream);
      }
    };

    // Add local tracks to PC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, []);

  const processIceQueue = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding queued ICE candidate', err);
        }
      }
    }
  }, []);

  const startCall = async (targetId: number, withVideo: boolean = false): Promise<RTCSessionDescriptionInit> => {
    cleanup();
    setTargetUserId(targetId);
    await requestMedia(withVideo);
    
    let iceConfig: RTCConfiguration = DEFAULT_ICE_SERVERS;
    try {
      const turnCreds = await api.getTurnCredentials();
      if (turnCreds && turnCreds.iceServers) {
        const servers = Array.isArray(turnCreds.iceServers) 
          ? turnCreds.iceServers 
          : [turnCreds.iceServers];
          
        iceConfig = { 
          iceServers: servers,
          iceTransportPolicy: 'relay'
        };
      }
    } catch (e) {
      console.warn("Failed to fetch TURN credentials, falling back to STUN", e);
    }
    
    const pc = createPeerConnection(iceConfig);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    setCallStatus('calling');
    return offer;
  };

  const acceptCall = async (targetId: number, offerSdp: RTCSessionDescriptionInit, withVideo: boolean = false): Promise<RTCSessionDescriptionInit> => {
    setTargetUserId(targetId);
    await requestMedia(withVideo);

    let iceConfig: RTCConfiguration = DEFAULT_ICE_SERVERS;
    try {
      const turnCreds = await api.getTurnCredentials();
      if (turnCreds && turnCreds.iceServers) {
        const servers = Array.isArray(turnCreds.iceServers) 
          ? turnCreds.iceServers 
          : [turnCreds.iceServers];
          
        iceConfig = { 
          iceServers: servers,
          iceTransportPolicy: 'relay'
        };
      }
    } catch (e) {
      console.warn("Failed to fetch TURN credentials, falling back to STUN", e);
    }

    const pc = createPeerConnection(iceConfig);
    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    await processIceQueue(pc);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    setCallStatus('connected');
    return answer;
  };

  const handleRemoteAnswer = async (answerSdp: RTCSessionDescriptionInit) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answerSdp));
      await processIceQueue(pcRef.current);
      setCallStatus('connected');
    }
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (pcRef.current && pcRef.current.remoteDescription) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    } else {
      iceCandidateQueueRef.current.push(candidate);
    }
  };

  const rejectCall = () => {
    cleanup();
  };

  const endCall = () => {
    cleanup();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current || !pcRef.current) return;

    try {
      if (isVideoEnabled) {
        // Turn off video
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach(track => {
          track.stop();
          localStreamRef.current?.removeTrack(track);
        });
        setIsVideoEnabled(false);
      } else {
        // Turn on video dynamically
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        localStreamRef.current.addTrack(videoTrack);

        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        } else {
          pcRef.current.addTrack(videoTrack, localStreamRef.current);
          
          // Renegotiate
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          
          if (targetUserId) {
            // Need to notify peer via the context, but the hook can't easily send the WS message itself.
            // Actually, we can just trigger a state change or callback.
            // But since ICE candidates and SDP are handled, if we just call the onRenegotiate callback...
            if (onRenegotiationRef.current) {
               onRenegotiationRef.current(offer);
            }
          }
        }
        setIsVideoEnabled(true);
      }
    } catch (err) {
      toast.error('Could not access camera.');
      console.error(err);
    }
  };

  return {
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    targetUserId,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleRemoteAnswer,
    addIceCandidate,
    setCallStatus,
    setTargetUserId,
    onIceCandidateRef,
    onRenegotiationRef
  };
};
