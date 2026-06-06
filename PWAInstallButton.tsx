import { Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "floating" | "footer" | "inline";
}

export function PWAInstallButton({ variant = "inline" }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  if (variant === "floating") {
    return (
      <button
        onClick={promptInstall}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium rounded-full shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105 animate-pulse-slow"
        aria-label="Install Inkseries App"
      >
        <Download className="w-5 h-5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (variant === "footer") {
    return (
      <button
        onClick={promptInstall}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Smartphone className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  // inline variant
  return (
    <button
      onClick={promptInstall}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      <Download className="w-4 h-4" />
      Install App
    </button>
  );
}
