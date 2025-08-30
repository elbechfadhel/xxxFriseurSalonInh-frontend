/// <reference types="vite/client" />

// Tell TS about the virtual module
declare module 'virtual:pwa-register' {
    export type RegisterSWOptions = {
        immediate?: boolean
        onNeedRefresh?: () => void
        onOfflineReady?: () => void
    }

    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void
}
/// <reference types="vite/client" />
