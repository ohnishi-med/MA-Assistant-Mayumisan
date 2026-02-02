import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => ipcRenderer.on(channel, listener),
        removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
    }
});
