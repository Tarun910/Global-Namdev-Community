import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Pencil, Trash2, User } from 'lucide-react';
import CameraCaptureModal from './CameraCaptureModal';
import PhotoAdjustModal from './PhotoAdjustModal';
import {
  createPhotoObjectUrl,
  isCameraSupported,
  revokePhotoObjectUrl,
} from '../lib/memberPhoto';

interface MemberPhotoUploadProps {
  value?: string;
  onChange: (photoUrl: string | undefined) => void;
  error?: string;
  label?: string;
  hint?: string;
  takePhotoLabel?: string;
  uploadPhotoLabel?: string;
  removePhotoLabel?: string;
  adjustPhotoLabel?: string;
  cameraTitle?: string;
  cameraCaptureLabel?: string;
  adjustTitle?: string;
  adjustHint?: string;
  savePhotoLabel?: string;
  cancelLabel?: string;
  cameraFallbackHint?: string;
}

export default function MemberPhotoUpload({
  value,
  onChange,
  error,
  label = 'Member Photo *',
  hint = 'Use a clear front-facing photo. JPG, PNG, or WebP up to 5 MB.',
  takePhotoLabel = 'Take Photo',
  uploadPhotoLabel = 'Upload Photo',
  removePhotoLabel = 'Remove',
  adjustPhotoLabel = 'Adjust Photo',
  cameraTitle = 'Take Photo',
  cameraCaptureLabel = 'Capture',
  adjustTitle = 'Adjust Photo',
  adjustHint = 'Drag or use arrows to position your face inside the circle.',
  savePhotoLabel = 'Save Photo',
  cancelLabel = 'Cancel',
  cameraFallbackHint = 'Allow camera access when prompted.',
}: MemberPhotoUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pendingSrcRef = useRef<string | null>(null);

  const [localError, setLocalError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);

  const displayError = error || localError;

  const clearPendingImage = () => {
    if (pendingSrcRef.current) {
      revokePhotoObjectUrl(pendingSrcRef.current);
      pendingSrcRef.current = null;
    }
    setPendingImageSrc(null);
  };

  const openAdjustWithSource = (src: string) => {
    clearPendingImage();
    pendingSrcRef.current = src;
    setPendingImageSrc(src);
    setAdjustOpen(true);
  };

  const handleGalleryFile = (file: File | undefined) => {
    if (!file) return;

    setLocalError('');
    try {
      const src = createPhotoObjectUrl(file);
      openAdjustWithSource(src);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not load photo.');
    }
  };

  const handleTakePhotoClick = () => {
    setLocalError('');
    if (isCameraSupported()) {
      setCameraOpen(true);
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleAdjustExisting = () => {
    if (!value) return;
    openAdjustWithSource(value);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3 py-2">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider self-start">
          {label}
        </label>

        <div
          className={`relative w-28 h-28 rounded-full border-4 overflow-hidden shadow-md ${
            displayError ? 'border-red-400' : 'border-primary/25'
          } bg-slate-100`}
        >
          {value ? (
            <img src={value} alt="Member" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
              <User className="w-12 h-12" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleTakePhotoClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-[11px] font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            {takePhotoLabel}
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-primary" />
            {uploadPhotoLabel}
          </button>

          {value && (
            <>
              <button
                type="button"
                onClick={handleAdjustExisting}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-primary" />
                {adjustPhotoLabel}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocalError('');
                  onChange(undefined);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 text-[11px] font-bold rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {removePhotoLabel}
              </button>
            </>
          )}
        </div>

        <p className="text-[10px] text-slate-500 text-center max-w-sm leading-relaxed">{hint}</p>
        {displayError && <p className="text-[10px] text-red-500 font-medium text-center">{displayError}</p>}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            handleGalleryFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            handleGalleryFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCaptured={(objectUrl) => {
          setCameraOpen(false);
          openAdjustWithSource(objectUrl);
        }}
        title={cameraTitle}
        captureLabel={cameraCaptureLabel}
        cancelLabel={cancelLabel}
        fallbackHint={cameraFallbackHint}
      />

      <PhotoAdjustModal
        open={adjustOpen}
        imageSrc={pendingImageSrc}
        onClose={() => {
          setAdjustOpen(false);
          clearPendingImage();
        }}
        onSave={(dataUrl) => {
          onChange(dataUrl);
          setAdjustOpen(false);
          clearPendingImage();
          setLocalError('');
        }}
        title={adjustTitle}
        hint={adjustHint}
        saveLabel={savePhotoLabel}
        cancelLabel={cancelLabel}
      />
    </>
  );
}
