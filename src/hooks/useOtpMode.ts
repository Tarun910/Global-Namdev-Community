import { useEffect, useState } from 'react';
import { getOtpConfig, isWidgetOtpConfig } from '../lib/otpConfig';

export function useOtpMode() {
  const [widgetMode, setWidgetMode] = useState(false);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getOtpConfig().then((config) => {
      if (cancelled) return;
      const enabled = isWidgetOtpConfig(config);
      setWidgetMode(enabled);
      setLive(config.live);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { widgetMode, live, ready };
}
