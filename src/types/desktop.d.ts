export {};

declare global {
  interface Window {
    funsepDesktop?: {
      checkUpdates: () => Promise<{ ok: boolean; reason?: string }>;
      getMeta: () => Promise<{ isDesktop: boolean; appVersion: string; adminUrl: string }>;
      quitAndInstall: () => Promise<void>;
      onAutoUpdateStatus: (handler: (payload: {
        type: string;
        source?: string;
        version?: string;
        message?: string;
      }) => void) => () => void;
    };
  }
}
