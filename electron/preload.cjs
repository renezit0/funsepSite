const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('funsepDesktop', {
  checkUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
  getMeta: () => ipcRenderer.invoke('desktop:get-meta'),
  quitAndInstall: () => ipcRenderer.invoke('desktop:quit-and-install'),
  onAutoUpdateStatus: (handler) => {
    if (typeof handler !== 'function') return () => {};

    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('desktop:auto-update-status', listener);
    return () => ipcRenderer.removeListener('desktop:auto-update-status', listener);
  },
});
