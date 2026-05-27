import { useState, useEffect } from 'react';

export interface PWAInstallHook {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  dismiss: () => void;
  isDismissed: boolean;
}

const DISMISSED_KEY = 'vaultify-pwa-dismissed';

// Capture the event as early as possible — before React even mounts.
// This runs the moment this module is imported.
let _deferredPrompt: any = null;

function capturePrompt(e: Event) {
  e.preventDefault();
  _deferredPrompt = e;
  // Notify any mounted hook instances
  window.dispatchEvent(new CustomEvent('vaultify-pwa-ready'));
}

window.addEventListener('beforeinstallprompt', capturePrompt);

function checkIsInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export const usePWAInstall = (): PWAInstallHook => {
  const [canInstall, setCanInstall] = useState(() => !!_deferredPrompt && !checkIsInstalled());
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );

  useEffect(() => {
    if (checkIsInstalled()) {
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    // Sync in case the prompt arrived before this hook mounted
    if (_deferredPrompt) setCanInstall(true);

    const onReady = () => {
      if (_deferredPrompt) setCanInstall(true);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      _deferredPrompt = null;
      localStorage.removeItem(DISMISSED_KEY);
    };

    const mq = window.matchMedia('(display-mode: standalone)');
    const onMqChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    window.addEventListener('vaultify-pwa-ready', onReady);
    window.addEventListener('appinstalled', onInstalled);
    mq.addEventListener('change', onMqChange);

    return () => {
      window.removeEventListener('vaultify-pwa-ready', onReady);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener('change', onMqChange);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!_deferredPrompt) return false;
    try {
      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      _deferredPrompt = null;
      setCanInstall(false);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.removeItem(DISMISSED_KEY);
        return true;
      }
      return false;
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
