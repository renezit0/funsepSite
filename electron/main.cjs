const { app, BrowserWindow, shell, ipcMain, dialog, Menu } = require('electron');
const path = require('path');

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

const isDev = !app.isPackaged;
const isWindows = process.platform === 'win32';
let mainWindow = null;
let autoUpdateInterval = null;
let autoUpdateCheckInProgress = false;
let lastUpdateCheckSource = 'startup';

const APP_NAME = 'FUNSEP Admin';
const GITHUB_OWNER = process.env.ELECTRON_UPDATER_OWNER || 'renezit0';
const GITHUB_REPO = process.env.ELECTRON_UPDATER_REPO || 'funsepSite';
function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function getWindowUrl() {
  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    return startUrl;
  }
  return 'http://localhost:8080/#/admin';
}

function getWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { maximized: false, minimized: false, fullscreen: false };
  }

  return {
    maximized: mainWindow.isMaximized(),
    minimized: mainWindow.isMinimized(),
    fullscreen: mainWindow.isFullScreen(),
  };
}

function sendWindowState() {
  sendToRenderer('desktop:window-state', getWindowState());
}

async function runAutoUpdateCheck(source = 'manual') {
  if (!autoUpdater || !app.isPackaged) {
    return { ok: false, reason: 'indisponivel' };
  }
  if (autoUpdateCheckInProgress) {
    return { ok: false, reason: 'busy' };
  }

  autoUpdateCheckInProgress = true;
  lastUpdateCheckSource = source;
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error?.message || 'Falha ao verificar atualização') };
  } finally {
    autoUpdateCheckInProgress = false;
  }
}

function setupAutoUpdater() {
  if (!autoUpdater || !app.isPackaged) return;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    releaseType: 'release',
  });

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('desktop:auto-update-status', {
      type: 'checking',
      source: lastUpdateCheckSource,
      message: 'Verificando atualização...',
    });
  });

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('desktop:auto-update-status', {
      type: 'available',
      source: lastUpdateCheckSource,
      version: info?.version || '',
      message: `Nova versão encontrada${info?.version ? ` (${info.version})` : ''}. Baixando...`,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('desktop:auto-update-status', {
      type: 'not-available',
      source: lastUpdateCheckSource,
      message: 'Aplicativo já atualizado.',
    });
  });

  autoUpdater.on('error', (error) => {
    sendToRenderer('desktop:auto-update-status', {
      type: 'error',
      source: lastUpdateCheckSource,
      message: String(error?.message || 'Falha no atualizador.'),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('desktop:auto-update-status', {
      type: 'downloaded',
      source: lastUpdateCheckSource,
      version: info?.version || '',
      message: 'Atualização baixada. Reiniciando para aplicar...',
    });

    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 1200);
  });

  runAutoUpdateCheck('startup');

  if (autoUpdateInterval) clearInterval(autoUpdateInterval);
  autoUpdateInterval = setInterval(() => {
    runAutoUpdateCheck('interval');
  }, 15 * 60 * 1000);
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icons', isWindows ? 'icon.ico' : 'icon.png');
  const startUrl = getWindowUrl();

  mainWindow = new BrowserWindow({
    title: `${APP_NAME} - v${app.getVersion()}`,
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 680,
    icon: iconPath,
    frame: !isWindows,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
    trafficLightPosition: process.platform === 'darwin' ? { x: 14, y: 12 } : undefined,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { hash: '/admin' });
  } else {
    mainWindow.loadURL(startUrl);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on('focus', () => {
    runAutoUpdateCheck('focus');
  });
  mainWindow.on('maximize', sendWindowState);
  mainWindow.on('unmaximize', sendWindowState);
  mainWindow.on('enter-full-screen', sendWindowState);
  mainWindow.on('leave-full-screen', sendWindowState);
  mainWindow.on('minimize', sendWindowState);
  mainWindow.on('restore', sendWindowState);
  mainWindow.once('ready-to-show', sendWindowState);
}

app.whenReady().then(() => {
  app.setAppUserModelId('br.com.funsep.admin.desktop');

  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
  }

  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('desktop:check-updates', async () => {
  return runAutoUpdateCheck('manual');
});

ipcMain.handle('desktop:get-meta', () => {
  return {
    isDesktop: true,
    appVersion: app.getVersion(),
    adminUrl: app.isPackaged ? '#/admin' : getWindowUrl(),
    platform: process.platform,
    framed: !isWindows,
  };
});

ipcMain.handle('desktop:quit-and-install', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall(false, true);
  }
});

ipcMain.handle('desktop:get-window-state', async () => getWindowState());

ipcMain.handle('desktop:window-control', async (_event, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) return getWindowState();

  const action = String(payload?.action || '');
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'maximize') mainWindow.maximize();
  if (action === 'unmaximize') mainWindow.unmaximize();
  if (action === 'toggle-maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
  if (action === 'close') mainWindow.close();

  return getWindowState();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
