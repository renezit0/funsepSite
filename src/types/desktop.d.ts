export {};

declare global {
  interface Window {
    funsepDesktop?: {
      checkUpdates: () => Promise<{ ok: boolean; reason?: string }>;
      getMeta: () => Promise<{ isDesktop: boolean; appVersion: string; adminUrl: string; platform: string; framed: boolean }>;
      getWindowState: () => Promise<{ maximized: boolean; minimized: boolean; fullscreen: boolean }>;
      windowControl: (action: "minimize" | "maximize" | "unmaximize" | "toggle-maximize" | "close") => Promise<{ maximized: boolean; minimized: boolean; fullscreen: boolean }>;
      quitAndInstall: () => Promise<void>;
      onAutoUpdateStatus: (handler: (payload: {
        type: string;
        source?: string;
        version?: string;
        message?: string;
      }) => void) => () => void;
      onWindowState: (handler: (payload: {
        maximized: boolean;
        minimized: boolean;
        fullscreen: boolean;
      }) => void) => () => void;
    };
  }
}
