// Type definitions for File System Access API
// This extends the global Window interface to include the File System Access API

interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}
