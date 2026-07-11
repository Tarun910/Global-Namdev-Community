import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import {
  capturePhotoFromCameraStream,
  isCameraSupported,
  stopMediaStream,
} from '../lib/memberPhoto';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCaptured: (objectUrl: string) => void;
  title?: string;
  captureLabel?: string;
  cancelLabel?: string;
  fallbackHint?: string;
}

export default function CameraCaptureModal({
  open,
  onClose,
  onCaptured,
  title = 'Take Photo',
  captureLabel = 'Capture',
  cancelLabel = 'Cancel',
  fallbackHint = 'Allow camera access when prompted. Use Upload Photo if the camera does not open.',
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError('');
      return;
    }

    if (!isCameraSupported()) {
      setError('Camera is not available in this browser. Please use Upload Photo instead.');
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setReady(true);
        setError('');
      } catch {
        if (!cancelled) {
          setError('Could not open camera. Check permissions or use Upload Photo.');
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    setCapturing(true);
    setError('');

    try {
      const objectUrl = await capturePhotoFromCameraStream(video);
      stopCamera();
      onCaptured(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not capture photo.');
    } finally {
      setCapturing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="font-sans text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            aria-label={cancelLabel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative aspect-[3/4] max-h-[420px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover mirror-video"
            />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xs font-medium">
                Opening camera…
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-white/90 bg-slate-900/90">
                {error}
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">{fallbackHint}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={!ready || capturing || Boolean(error)}
              onClick={() => void handleCapture()}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {capturing ? 'Capturing…' : captureLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .mirror-video {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
