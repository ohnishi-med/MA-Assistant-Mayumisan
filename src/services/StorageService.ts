export class StorageService {
    static async saveFile(directoryHandle: FileSystemDirectoryHandle, fileName: string, content: string) {
        try {
            const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (error) {
            console.error(`Error saving ${fileName}:`, error);
            return false;
        }
    }

    static async readFile(directoryHandle: FileSystemDirectoryHandle, fileName: string): Promise<string | null> {
        try {
            const fileHandle = await directoryHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.error(`Error reading ${fileName}:`, error);
            return null;
        }
    }

    static async verifyPermission(handle: FileSystemHandle, readWrite: boolean) {
        const options: FileSystemHandlePermissionDescriptor = {};
        if (readWrite) {
            options.mode = 'readwrite';
        }
        // Check if permission was already granted. If so, return true.
        if ((await handle.queryPermission(options)) === 'granted') {
            return true;
        }
        // Request permission. If the user grants permission, return true.
        if ((await handle.requestPermission(options)) === 'granted') {
            return true;
        }
        // The user didn't grant permission, so return false.
        return false;
    }
}
