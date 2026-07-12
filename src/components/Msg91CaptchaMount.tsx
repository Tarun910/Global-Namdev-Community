import { useEffect, useRef, useState } from 'react';

/** Captcha slot for MSG91 widget — collapses when no captcha is rendered */
export default function Msg91CaptchaMount() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasCaptcha, setHasCaptcha] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const sync = () => {
      setHasCaptcha(el.childElementCount > 0 || el.querySelector('iframe') !== null);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={hasCaptcha ? 'space-y-1.5 w-full pt-0.5' : 'w-full h-0 overflow-hidden'}>
      {hasCaptcha && (
        <p className="text-[10px] text-slate-500 text-center leading-snug">
          Complete the captcha before sending OTP.
        </p>
      )}
      <div
        ref={mountRef}
        id="msg91-captcha"
        className="flex justify-center w-full"
        aria-label="Captcha verification"
        aria-hidden={!hasCaptcha}
      />
    </div>
  );
}
