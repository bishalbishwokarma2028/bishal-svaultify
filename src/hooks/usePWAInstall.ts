import { useState, useEffect, useRef } from 'react';

export interface PWAInstallHook {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  dismiss: () => void;
  isDismissed: boolean;
}

const DISMISSED_KEY = 'vaultify-pwa-dismissed';

function checkIsInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export const usePWAInstall = (): PWAInstallHook => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    if (checkIsInstalled()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
      localStorage.removeItem(DISMISSED_KEY);
    };

    const mq = window.matchMedia('(display-mode: standalone)');
    const mqHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    mq.addEventListener('change', mqHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      mq.removeEventListener('change', mqHandler);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt.current) return false;
    try {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
      setCanInstall(false);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.removeItem(DISMISSED_KEY);
      }
      return outcome === 'accepted';
    } catch {
      return false;
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  return { canInstall, isInstalled, promptInstall, dismiss, isDismissed };
};
