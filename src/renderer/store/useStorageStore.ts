import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StorageState {
    directoryHandle: FileSystemDirectoryHandle | null;
    setDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void;
    isAutoSaveEnabled: boolean;
    toggleAutoSave: () => void;
}

export const useStorageStore = create<StorageState>()(
    persist(
        (set) => ({
            directoryHandle: null,
            setDirectoryHandle: (handle) => set({ directoryHandle: handle }),
            isAutoSaveEnabled: true,
            toggleAutoSave: () => set((state) => ({ isAutoSaveEnabled: !state.isAutoSaveEnabled })),
        }),
        {
            name: 'mayumi-storage-settings',
            partialize: (state) => ({
                isAutoSaveEnabled: state.isAutoSaveEnabled
                // Note: directoryHandle cannot be serialized to localStorage automatically
            }),
        }
    )
);
