import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';

export interface HuddleParticipant {
  userId: string | number;
  username: string;
  avatar: string | null;
  isMuted: boolean;
}

export const useChannelSFUHuddle = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [callId, setCallId] = useState<number | null>(null);
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | number | null>(null);
  const [participants, setParticipants] = useState<HuddleParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transceiversRef = useRef<RTCRtpTransceiver[]>([]);
  const publishedTracksRef = useRef<any[]>([]);

  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const txHandlers = useRef<Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>>(new Map());

  const sendWsRequest = useCallback((type: string, payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const txId = Math.random().toString(36).substring(7);
      txHandlers.current.set(txId, { resolve, reject });
      const targetChannelId = payload.channel_id;
      sendJsonMessage(type, { ...payload, transaction_id: txId }, undefined, targetChannelId);
      
      setTimeout(() => {
        if (txHandlers.current.has(txId)) {
          txHandlers.current.get(txId)!.reject(new Error('WebSocket request timed out'));
          txHandlers.current.delete(txId);
        }
      }, 15000);
    });
  }, [sendJsonMessage]);

  const subscribeToRemoteTracks = useCallback(async (remoteTracks: any[]) => {
    if (!pcRef.current || !sessionIdRef.current || remoteTracks.length === 0) return;
    const pc = pcRef.current;

    console.log('[SFU] Requesting subscription to remote tracks...', remoteTracks);
    const newRemoteTracksResult = await sendWsRequest('sfu_huddle.new_tracks', {
      channel_id: activeChannelId,
      session_id: sessionIdRef.current,
      tracks: remoteTracks
    });
    console.log('[SFU] subscription response received:', newRemoteTracksResult);

    if (newRemoteTracksResult.requiresImmediateRenegotiation) {
      console.log('[SFU] Requires immediate renegotiation, sending answer...');
      await pc.setRemoteDescription(new RTCSessionDescription(newRemoteTracksResult.sessionDescription));
      await pc.setLocalDescription(await pc.createAnswer());
      const renegotiateResult = await sendWsRequest('sfu_huddle.renegotiate', {
        channel_id: activeChannelId,
        session_id: sessionIdRef.current,
        sdp: pc.localDescription?.sdp
      });
      console.log('[SFU] renegotiation response received:', renegotiateResult);
    }
  }, [sendWsRequest, activeChannelId]);

  // Handle WebSocket responses
  useEffect(() => {
    const unsub1 = registerMessageHandler('sfu_huddle.new_session_success', (data: any, frame: any) => {
      const txId = frame.transaction_id;
      if (txId && txHandlers.current.has(txId)) {
        txHandlers.current.get(txId)!.resolve(frame.payload || data);
        txHandlers.current.delete(txId);
      }
    });

    const unsub2 = registerMessageHandler('sfu_huddle.new_tracks_success', (data: any, frame: any) => {
      const txId = frame.transaction_id;
      if (txId && txHandlers.current.has(txId)) {
        txHandlers.current.get(txId)!.resolve(frame.payload || data);
        txHandlers.current.delete(txId);
      }
    });

    const unsub3 = registerMessageHandler('sfu_huddle.renegotiate_success', (data: any, frame: any) => {
      const txId = frame.transaction_id;
      if (txId && txHandlers.current.has(txId)) {
        txHandlers.current.get(txId)!.resolve(frame.payload || data);
        txHandlers.current.delete(txId);
      }
    });

    const unsub4 = registerMessageHandler('sfu_huddle.error', (_data: any, frame: any) => {
      const txId = frame.transaction_id;
      if (txId && txHandlers.current.has(txId)) {
        const errorObj = new Error(frame.error);
        (errorObj as any).existingCallId = frame.existing_call_id;
        (errorObj as any).existingCreatorId = frame.existing_creator_id;
        txHandlers.current.get(txId)!.reject(errorObj);
        txHandlers.current.delete(txId);
      }
    });

    const unsub5 = registerMessageHandler('sfu_relay', (data: any, frame: any) => {
      const event_type = frame.event_type;
      const payload = data;
      if (event_type === 'sfu_huddle.joined') {
        const user = payload.user;
        setParticipants(prev => {
          if (prev.find(p => String(p.userId) === String(user.id))) return prev;
          return [...prev, { userId: user.id, username: user.username, avatar: user.avatar, isMuted: false }];
        });
      } else if (event_type === 'sfu_huddle.left') {
        setParticipants(prev => prev.filter(p => String(p.userId) !== String(payload.user.id)));
      } else if (event_type === 'sfu_huddle.mute_toggled') {
        setParticipants(prev => prev.map(p => 
          p.userId === payload.user_id ? { ...p, isMuted: payload.is_muted } : p
        ));
      } else if (event_type === 'sfu_huddle.call_ended') {
        if (callId === payload.call_id || String(callId) === String(payload.call_id)) {
          leaveHuddle(true);
          console.warn("[SFU] The call was ended by the creator.");
        }
      } else if (event_type === 'sfu_huddle.publish_tracks') {
        // Someone published tracks. We need to subscribe to them.
        if (payload.session_id !== sessionIdRef.current) {
          const remoteTracks = payload.tracks.map((t: any) => ({
            location: 'remote',
            sessionId: payload.session_id,
            trackName: t.trackName
          }));
          subscribeToRemoteTracks(remoteTracks);
        }
      } else if (event_type === 'sfu_huddle.request_tracks') {
        // Someone joined and is requesting tracks. We should broadcast our published tracks.
        if (publishedTracksRef.current.length > 0 && activeChannelId && sessionIdRef.current) {
          if (payload.user.id !== String(creatorId)) { // Don't reply to our own request
            sendJsonMessage('sfu_huddle.publish_tracks', {
              session_id: sessionIdRef.current,
              tracks: publishedTracksRef.current
            }, undefined, activeChannelId.toString());
          }
        }
      }
    });

    const unsub6 = registerMessageHandler('sfu_huddle.end_call_success', (data: any) => {
      const txId = data.transaction_id;
      if (txId && txHandlers.current.has(txId)) {
        txHandlers.current.get(txId)!.resolve(true);
        txHandlers.current.delete(txId);
      }
    });

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6();
    };
  }, [registerMessageHandler, callId, subscribeToRemoteTracks, activeChannelId, creatorId, sendJsonMessage]);

  const setupWebRTC = async () => {
    console.log('[SFU] Setting up local WebRTC connection and audio stream...');
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      bundlePolicy: 'max-bundle'
    });
    pcRef.current = pc;
    
    pc.ontrack = (event) => {
      console.log('[SFU] Received remote track:', event.track.id);
      
      const audioEl = new Audio();
      audioEl.srcObject = new MediaStream([event.track]);
      audioEl.play().catch(e => console.error('[SFU] Auto-play prevented', e));
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not available. Please ensure you are running on localhost or a secure HTTPS connection.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
    // If the component unmounted while waiting for permissions, pc might be closed.
    if (pc.signalingState === 'closed') {
      stream.getTracks().forEach(t => t.stop());
      return null;
    }

    localStreamRef.current = stream;

    transceiversRef.current = stream.getTracks().map(track => {
      console.log(`[SFU] Adding local track ${track.id} to connection`);
      return pc.addTransceiver(track, { direction: 'sendonly' });
    });

    return pc;
  };

  const publishLocalTracks = async (pc: RTCPeerConnection, targetChannelId: string | number) => {
    let trackObjects = transceiversRef.current.map(transceiver => ({
      location: 'local',
      mid: transceiver.mid,
      trackName: transceiver.sender.track!.id
    }));

    console.log('[SFU] Creating offer to publish tracks...', trackObjects);
    await pc.setLocalDescription(await pc.createOffer());
    const newLocalTracksResult = await sendWsRequest('sfu_huddle.new_tracks', {
      channel_id: targetChannelId,
      session_id: sessionIdRef.current,
      tracks: trackObjects,
      sdp: pc.localDescription?.sdp
    });
    console.log('[SFU] publish tracks response received:', newLocalTracksResult);
    await pc.setRemoteDescription(new RTCSessionDescription(newLocalTracksResult.sessionDescription));
    
    // Save tracks and broadcast to others
    publishedTracksRef.current = trackObjects;
    sendJsonMessage('sfu_huddle.publish_tracks', {
      session_id: sessionIdRef.current,
      tracks: trackObjects
    }, undefined, targetChannelId.toString());
  };

  const connectHuddle = async (targetChannelId: string | number, action: 'start' | 'join' | 'auto') => {
    let pc: RTCPeerConnection | null = null;
    try {
      setActiveChannelId(targetChannelId);
      console.log(`[SFU] ${action} huddle for channel ${targetChannelId}`);
      pc = await setupWebRTC();
      if (!pc) return; // Aborted because component unmounted

      console.log('[SFU] Creating local offer...');
      await pc.setLocalDescription(await pc.createOffer());

      console.log(`[SFU] Sending new_session (${action}) request via WebSocket...`);
      const newSessionResult = await sendWsRequest('sfu_huddle.new_session', {
        channel_id: targetChannelId,
        action: action,
        sdp: pc.localDescription?.sdp
      });
      console.log('[SFU] new_session response received:', newSessionResult);
      
      setCallId(newSessionResult.call_id);
      setCreatorId(newSessionResult.creator_id);
      sessionIdRef.current = newSessionResult.sessionId;
      
      if (newSessionResult.participants) {
        // Filter out ourselves just in case
        const others = newSessionResult.participants.filter((p: any) => String(p.userId) !== String(user?.id));
        setParticipants(others);
      } else {
        setParticipants([]);
      }

      console.log('[SFU] Setting remote description from Cloudflare...');
      await pc.setRemoteDescription(new RTCSessionDescription(newSessionResult.sessionDescription));

      console.log('[SFU] Waiting for ICE connection...');
      await new Promise<void>((resolve, reject) => {
        if (pc) {
          pc.addEventListener('iceconnectionstatechange', () => {
            console.log(`[SFU] ICE State changed to: ${pc?.iceConnectionState}`);
            if (pc?.iceConnectionState === 'connected') resolve();
          });
        }
        setTimeout(() => reject(new Error('ICE timeout')), 5000);
      });

      await publishLocalTracks(pc, targetChannelId);

      // Tell others we are here
      sendJsonMessage('sfu_huddle.joined', {
        channel_id: targetChannelId
      }, undefined, targetChannelId.toString());

      // If we joined an existing call, ask for current tracks
      if (!newSessionResult.created) {
        sendJsonMessage('sfu_huddle.request_tracks', {
          channel_id: targetChannelId
        }, undefined, targetChannelId.toString());
      }

      console.log('[SFU] Huddle fully connected and active!');
      setIsActive(true);
    } catch (err) {
      console.error('[SFU] Failed to connect huddle:', err);
      leaveHuddle();
      throw err;
    }
  };

  const startHuddle = (targetChannelId: string | number) => connectHuddle(targetChannelId, 'start');
  const joinHuddle = (_targetCallId: number, targetChannelId?: string | number) => connectHuddle(targetChannelId!, 'join');
  const autoHuddle = (targetChannelId: string | number) => connectHuddle(targetChannelId, 'auto');

  const leaveHuddle = useCallback((silent?: boolean | any) => {
    if (silent !== true && isActive && activeChannelId && callId) {
      console.log(`[SFU] Emitting sfu_huddle.leave for channel ${activeChannelId}`);
      sendJsonMessage('sfu_huddle.leave', {
        channel_id: activeChannelId,
        call_id: callId
      }, undefined, activeChannelId.toString());
    }
    
    setIsActive(false);
    setCallId(null);
    setActiveChannelId(null);
    publishedTracksRef.current = [];
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, [isActive, activeChannelId, callId, sendJsonMessage]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => {
          t.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  const endCall = async (targetCallId: number) => {
    try {
      await sendWsRequest('sfu_huddle.end_call', { call_id: targetCallId });
      if (String(callId) === String(targetCallId)) {
        leaveHuddle();
      }
    } catch (err) {
      console.error('Failed to end call', err);
      throw err;
    }
  };

  return {
    isActive,
    callId,
    creatorId,
    participants,
    isMuted,
    startHuddle,
    joinHuddle,
    autoHuddle,
    leaveHuddle,
    toggleMute,
    endCall,
    activeChannelId
  };
};
