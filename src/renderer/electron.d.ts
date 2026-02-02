export interface IElectronAPI {
    ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
        on(channel: string, listener: (event: any, ...args: any[]) => void): void;
        removeAllListeners(channel: string): void;
    };
}

declare global {
    interface Window {
        electron: IElectronAPI;
    }
}
