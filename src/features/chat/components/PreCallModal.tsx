import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface PreCallModalProps {
  onJoin: (isMuted: boolean) => void;
  onCancel: () => void;
}

export const PreCallModal: React.FC<PreCallModalProps> = ({ onJoin, onCancel }) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [alwaysShow, setAlwaysShow] = useState(
    localStorage.getItem('syncup_always_show_preview') !== 'false'
  );

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Save preference when toggled
    localStorage.setItem('syncup_always_show_preview', alwaysShow ? 'true' : 'false');
  }, [alwaysShow]);

  useEffect(() => {
    let mounted = true;

    const setupDevices = async () => {
      try {
        // Request initial permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        const outputs = devices.filter(d => d.kind === 'audiooutput');

        setAudioInputs(inputs);
        setAudioOutputs(outputs);

        if (inputs.length > 0) setSelectedInput(inputs[0].deviceId);
        if (outputs.length > 0) setSelectedOutput(outputs[0].deviceId);

        // Setup audio visualizer
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!mounted) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setVolumeLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();

      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    setupDevices();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleJoin = () => {
    // Stop local preview tracks before joining
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onJoin(isMuted);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Mic className="h-5 w-5 text-teal-600" />
            SyncUp in Team Space
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Preview Avatar Area */}
          <div className="bg-gray-50 rounded-xl h-48 flex items-center justify-center relative mb-6">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-sm z-10 relative">
              <AvatarFallback className="bg-gray-800 text-white text-2xl font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Audio level indicator circle */}
            {!isMuted && volumeLevel > 5 && (
              <div 
                className="absolute inset-0 m-auto rounded-full bg-teal-400/20 transition-all duration-75"
                style={{
                  width: `${80 + (volumeLevel / 2)}px`,
                  height: `${80 + (volumeLevel / 2)}px`,
                }}
              />
            )}
          </div>

          {/* Core Controls */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="lg"
              className={`h-12 w-24 rounded-xl border-2 transition-colors ${
                isMuted 
                  ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-50 hover:text-red-600' 
                  : 'border-teal-500 bg-teal-500 text-white hover:bg-teal-600 hover:border-teal-600'
              }`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>

          {/* Device Selection */}
          <div className="space-y-4 mb-6 text-sm">
            <div className="flex items-center gap-3">
              <Mic className="h-4 w-4 text-gray-400 shrink-0" />
              <Select value={selectedInput} onValueChange={setSelectedInput}>
                <SelectTrigger className="w-full h-10 border-gray-200">
                  <SelectValue placeholder="Select Microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioInputs.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-gray-400 shrink-0" />
              <Select value={selectedOutput} onValueChange={setSelectedOutput}>
                <SelectTrigger className="w-full h-10 border-gray-200">
                  <SelectValue placeholder="Select Speaker" />
                </SelectTrigger>
                <SelectContent>
                  {audioOutputs.length > 0 ? audioOutputs.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  )) : (
                    <SelectItem value="default">Default System Speaker</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Always Show Toggle */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
            <Switch 
              checked={alwaysShow}
              onCheckedChange={setAlwaysShow}
              id="always-show"
            />
            <label htmlFor="always-show" className="cursor-pointer">
              Always show preview before joining
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl" onClick={handleJoin}>
              Join SyncUp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
