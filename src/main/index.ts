import { app, shell, BrowserWindow } from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const { join } = path;
import { initDB } from './db';
import { registerIpcHandlers } from './ipc';
import { runAutomatedBackup } from './backupService';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
            contextIsolation: true,
            webSecurity: false,
        },
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
        if (!app.isPackaged) {
            mainWindow?.webContents.openDevTools();
        }
    });

    // Mirror renderer console to terminal
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        console.log(`[Renderer ${levels[level] || 'LOG'}] ${message} (${sourceId}:${line})`);
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
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
        const filePath = path.join(__dirname, '../renderer/index.html');
        console.log('Loading Static File:', filePath);
        mainWindow.loadFile(filePath);
    }
}

// Ensure startup only happens after app is ready
app.whenReady().then(() => {
    app.setAppUserModelId('com.electron');

    // Initialize database and start app
    initDB().then(() => {
        console.log('System initialized successfully');
        registerIpcHandlers();
        createWindow();
        runAutomatedBackup();
    }).catch(err => {
        console.error('Failed to initialize system:', err);
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
