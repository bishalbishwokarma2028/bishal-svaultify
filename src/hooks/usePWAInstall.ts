import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'vaultify-pwa-dismissed';

export interface PWAInstallHook {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  dismiss: () => void;
  isDismissed: boolean;
}

let deferredPrompt: any = null;

export const usePWAInstall = (): PWAInstallHook => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );

  useEffect(() => {
    const checkInstalled = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(standalone);
      return standalone;
    };

    if (checkInstalled()) return;

    if (deferredPrompt) {
      setCanInstall(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const mq = window.matchMedia('(display-mode: standalone)');
    const mqHandler = (e: MediaQueryListEvent) => {
      if (e.matches) { setIsInstalled(true); setCanInstall(false); }
    };
    mq.addEventListener('change', mqHandler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mq.removeEventListener('change', mqHandler);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      setCanInstall(false);
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
