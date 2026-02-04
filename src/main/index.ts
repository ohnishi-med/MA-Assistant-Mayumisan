import { app, shell, BrowserWindow } from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import { join } from 'path';
// import { electronApp, optimizer } from '@electron-toolkit/utils';
import { initDB } from './db';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindowType | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.cjs'),
            sandbox: false,
            contextIsolation: true, // Restored to true to ensure contextBridge works
            webSecurity: false, // Keep disabled to allow file:// access
        },
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
        if (!app.isPackaged) {
            mainWindow?.webContents.openDevTools();
        }
    });

    // Mirror renderer console to terminal
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        console.log(`[Renderer ${levels[level] || 'LOG'}] ${message} (${sourceId}:${line})`);
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load URL: ${validatedURL}, Error: ${errorDescription} (${errorCode})`);
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    let rendererUrl = process.env['ELECTRON_RENDERER_URL'];
    if (!app.isPackaged && !rendererUrl) {
        rendererUrl = 'http://localhost:5173';
    }

    if (rendererUrl) {
        console.log('Loading Renderer URL:', rendererUrl);
        mainWindow.loadURL(rendererUrl);
    } else {
        const filePath = join(__dirname, '../renderer/index.html');
        console.log('Loading Static File:', filePath);
        mainWindow.loadFile(filePath);
    }
}

app.whenReady().then(() => {
    // Media protocol handler removed as we switched to file:// protocol

    // electronApp.setAppUserModelId('com.electron');
    app.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
        // optimizer.watchWindowShortcuts(window);
    });

    initDB().then(() => {
        console.log('Database initialized');
        registerIpcHandlers();
        createWindow();
    }).catch(err => {
        console.error('Failed to initialize database:', err);
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
