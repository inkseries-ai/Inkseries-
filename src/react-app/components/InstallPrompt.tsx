import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < threeDays) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // For iOS, show custom instructions after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <img 
            src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
            alt="Inkseries" 
            className="w-8 h-8"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">Install Inkseries</h3>
          
          {isIOS ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Add Inkseries to your home screen for the best experience:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the share button <span className="inline-block px-1 bg-muted rounded">⎙</span></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Read your favorite African stories offline, get notifications for new chapters.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Install App
                </Button>
                <Button onClick={handleDismiss} variant="ghost" size="sm">
                  Not now
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <Smartphone className="w-3 h-3" />
        <span>Works offline • No app store needed</span>
      </div>
    </div>
  );
}
