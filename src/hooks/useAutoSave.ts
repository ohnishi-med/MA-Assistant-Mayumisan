import { useEffect } from 'react';
import { useStorageStore } from '../store/useStorageStore';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useMasterStore } from '../store/useMasterStore';
import { StorageService } from '../services/StorageService';

export const useAutoSave = () => {
    const { directoryHandle, isAutoSaveEnabled } = useStorageStore();
    const workflowStore = useWorkflowStore();
    const masterStore = useMasterStore();

    useEffect(() => {
        if (!isAutoSaveEnabled || !directoryHandle) return;

        const saveData = async () => {
            const hasPermission = await StorageService.verifyPermission(directoryHandle, true);
            if (!hasPermission) return;

            const workflowData = JSON.stringify({
                flows: workflowStore.flows,
                activeFlowId: workflowStore.activeFlowId,
                activeFlowPath: workflowStore.activeFlowPath
            }, null, 2);
            const masterData = JSON.stringify(masterStore.items, null, 2);

            await StorageService.saveFile(directoryHandle, 'workflow_data.json', workflowData);
            await StorageService.saveFile(directoryHandle, 'master_data.json', masterData);
        };

        // Debounce auto-save to avoid excessive writes
        const timeoutId = setTimeout(saveData, 2000);
        return () => clearTimeout(timeoutId);
    }, [workflowStore.flows, masterStore.items, directoryHandle, isAutoSaveEnabled]);
};
