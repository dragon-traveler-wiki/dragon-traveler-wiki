import { Alert, Center, Loader } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useDarkMode, useGradientAccent } from '@/hooks';

const SCRIPT_ID = 'cloudflare-turnstile-script';

export default function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [ready, setReady] = useState(() => Boolean(window.turnstile));
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();

  useEffect(() => {
    if (window.turnstile) {
      return;
    }
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const handleLoad = () => setReady(true);
    script.addEventListener('load', handleLoad);
    return () => script?.removeEventListener('load', handleLoad);
  }, []);

  useEffect(() => {
    if (!ready || !siteKey || !window.turnstile || !elementRef.current) return;
    widgetRef.current = window.turnstile.render(elementRef.current, {
      sitekey: siteKey,
      theme: isDark ? 'dark' : 'light',
      callback: (token: string) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    });
    return () => {
      if (widgetRef.current && window.turnstile)
        window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [isDark, onToken, ready, siteKey]);

  if (!siteKey)
    return (
      <Alert color={accent.primary} variant="light">
        Turnstile is not configured for this deployment.
      </Alert>
    );
  return (
    <Center mih={65}>
      {!ready && <Loader size="sm" color={accent.primary} />}
      <div ref={elementRef} />
    </Center>
  );
}
