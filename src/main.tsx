import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './rtl.css';
import App from './App.tsx';
import './i18n';

// 👇 import service worker register helper from vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// 👇 call it once when the app starts
registerSW({
    immediate: true, // register immediately at startup
    onNeedRefresh() {
        console.log('New content available, please refresh.');
    },
    onOfflineReady() {
        console.log('App ready to work offline');
    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
