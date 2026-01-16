import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./styles/scrollbar.css";
import faviconUrl from "./assets/favicon.png";

const ensureFavicon = () => {
    const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (existing) existing.href = faviconUrl;
    else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = faviconUrl;
        document.head.appendChild(link);
    }
};
ensureFavicon();

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
