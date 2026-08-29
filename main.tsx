import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  document.body.innerHTML =
    '<p style="color:#fff;font:14px system-ui;padding:24px">Missing #root element.</p>';
}

/* PWA: register the service worker (offline app shell + music cache).
   Never allowed to break the app — registration failures are logged only. */
const secureContext =
  window.isSecureContext && "serviceWorker" in navigator;

if (secureContext) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .catch((err) => console.warn("VibroX: service worker registration skipped", err));
  });
}
