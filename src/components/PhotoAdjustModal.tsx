import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, X } from 'lucide-react';
import {
  PHOTO_CROP_VIEW_SIZE,
  clampPhotoOffset,
  computeCoverTransform,
  exportMemberPhoto,
  getCenteredPhotoOffset,
  revokePhotoObjectUrl,
} from '../lib/memberPhoto';

interface PhotoAdjustModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  hint?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

const NUDGE = 12;

export default function PhotoAdjustModal({
  open,
  imageSrc,
  onClose,
  onSave,
  title = 'Adjust Photo',
  hint = 'Drag or use arrows to position your face inside the circle.',
  saveLabel = 'Save Photo',
  cancelLabel = 'Cancel',
}: PhotoAdjustModalProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scaledWidth, setScaledWidth] = useState(PHOTO_CROP_VIEW_SIZE);
  const [scaledHeight, setScaledHeight] = useState(PHOTO_CROP_VIEW_SIZE);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const applyOffset = useCallback(
    (nextX: number, nextY: number) => {
      const clamped = clampPhotoOffset(nextX, nextY, scaledWidth, scaledHeight, PHOTO_CROP_VIEW_SIZE);
      setOffsetX(clamped.offsetX);
      setOffsetY(clamped.offsetY);
    },
    [scaledWidth, scaledHeight]
  );

  useEffect(() => {
    if (!open || !imageSrc) return;

    const image = new Image();
    image.onload = () => {
      const transform = computeCoverTransform(image.width, image.height, PHOTO_CROP_VIEW_SIZE);
      setScaledWidth(transform.scaledWidth);
      setScaledHeight(transform.scaledHeight);
      const centered = getCenteredPhotoOffset(
        transform.scaledWidth,
        transform.scaledHeight,
        PHOTO_CROP_VIEW_SIZE
      );
      setOffsetX(centered.offsetX);
      setOffsetY(centered.offsetY);
    };
    image.src = imageSrc;
  }, [open, imageSrc]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const deltaX = clientX - dragStart.current.x;
      const deltaY = clientY - dragStart.current.y;
      applyOffset(dragStart.current.offsetX + deltaX, dragStart.current.offsetY + deltaY);
    };

    const onMouseMove = (event: MouseEvent) => handleMove(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    };
    const stopDrag = () => setDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging, applyOffset]);

  const startDrag = (clientX: number, clientY: number) => {
    dragStart.current = { x: clientX, y: clientY, offsetX, offsetY };
    setDragging(true);
  };

  const handleSave = async () => {
    if (!imageSrc) return;
    setSaving(true);
    try {
      const dataUrl = await exportMemberPhoto(imageSrc, offsetX, offsetY, PHOTO_CROP_VIEW_SIZE);
      onSave(dataUrl);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (imageSrc?.startsWith('blob:')) {
      revokePhotoObjectUrl(imageSrc);
    }
    onClose();
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-sans text-sm font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            aria-label={cancelLabel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative rounded-full overflow-hidden border-4 border-primary/30 shadow-lg bg-slate-100 touch-none select-none cursor-grab active:cursor-grabbing"
              style={{ width: PHOTO_CROP_VIEW_SIZE, height: PHOTO_CROP_VIEW_SIZE }}
              onMouseDown={(event) => startDrag(event.clientX, event.clientY)}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                if (touch) startDrag(touch.clientX, touch.clientY);
              }}
            >
              <img
                src={imageSrc}
                alt="Adjust"
                draggable={false}
                className="absolute max-w-none pointer-events-none"
                style={{
                  width: scaledWidth,
                  height: scaledHeight,
                  left: offsetX,
                  top: offsetY,
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div />
              <button
                type="button"
                onClick={() => applyOffset(offsetX, offsetY + NUDGE)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                aria-label="Move up"
              >
                <ArrowUp className="w-4 h-4 mx-auto text-slate-600" />
              </button>
              <div />
              <button
                type="button"
                onClick={() => applyOffset(offsetX + NUDGE, offsetY)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                aria-label="Move left"
              >
                <ArrowLeft className="w-4 h-4 mx-auto text-slate-600" />
              </button>
              <div className="p-2 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-center">
                Move
              </div>
              <button
                type="button"
                onClick={() => applyOffset(offsetX - NUDGE, offsetY)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                aria-label="Move right"
              >
                <ArrowRight className="w-4 h-4 mx-auto text-slate-600" />
              </button>
              <div />
              <button
                type="button"
                onClick={() => applyOffset(offsetX, offsetY - NUDGE)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                aria-label="Move down"
              >
                <ArrowDown className="w-4 h-4 mx-auto text-slate-600" />
              </button>
              <div />
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">{hint}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
