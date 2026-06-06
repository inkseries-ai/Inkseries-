import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";
import { clearNovelsCache } from "@/react-app/hooks/useNovelsCache";

// Register service worker for PWA with aggressive update handling
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
        
        // Check for updates immediately
        registration.update();
        
        // When a new service worker is waiting, activate it immediately
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available, skip waiting and take over
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
  
  // Reload page when new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Clear API cache when coming online (fresh content)
  window.addEventListener("online", () => {
    clearNovelsCache(); // Clear in-memory cache too
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({ type: "CLEAR_API_CACHE" });
    });
  });

  // Clear API cache when user returns to the app
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      clearNovelsCache(); // Clear in-memory cache too
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: "CLEAR_API_CACHE" });
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
