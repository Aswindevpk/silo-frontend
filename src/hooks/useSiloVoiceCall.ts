import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export function useSiloVoiceCall(workspaceId: number, channelId: number, targetUserId: number | undefined, onRemoteStreamReceived: (stream: MediaStream) => void) {
  const { sendJsonMessage, registerMessageHandler } = useWebSocket();
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const initiateCallTrack = useCallback(async () => {
    if (!targetUserId) return;

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.getTracks().forEach(track => peerConnectionRef.current?.addTrack(track, localStream));
    } catch (err) {
      console.warn("No mic", err);
    }

    peerConnectionRef.current.ontrack = (event) => {
      if (onRemoteStreamReceived && event.streams[0]) {
        onRemoteStreamReceived(event.streams[0]);
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendJsonMessage('calls', {
          type: 'ice_candidate',
          workspace_id: workspaceId,
          channel_id: channelId,
          receiver_id: targetUserId,
          candidate: event.candidate
        });
      }
    };

    const callOffer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(callOffer);

    sendJsonMessage('calls', {
      type: 'webrtc_signal',
      workspace_id: workspaceId,
      channel_id: channelId,
      receiver_id: targetUserId,
      sdp: callOffer
    });
  }, [sendJsonMessage, workspaceId, channelId, targetUserId, onRemoteStreamReceived]);

  useEffect(() => {
    const cleanupSignal = registerMessageHandler('calls', 'webrtc_signal', async (data: any) => {
      // Basic relay adapter
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
      }
      const pc = peerConnectionRef.current;

      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          sendJsonMessage('calls', {
            type: 'webrtc_signal',
            receiver_id: data.sender_id,
            sdp: answer
          });
        }
      }
    });

    const cleanupIce = registerMessageHandler('calls', 'ice_candidate', async (data: any) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      }
    });

    return () => {
      cleanupSignal();
      cleanupIce();
    };
  }, [registerMessageHandler, sendJsonMessage]);

  return { initiateCallTrack, peerConnectionRef };
}
