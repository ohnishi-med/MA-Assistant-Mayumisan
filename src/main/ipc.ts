import { ipcMain, app, dialog } from 'electron';
import { db, getDBPath, reloadDB, getDataRoot, setCustomDataPath } from './db';
import path from 'path';
import fs from 'fs';

export function registerIpcHandlers() {
    // Categories: Get all
    ipcMain.handle('categories:getAll', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM categories ORDER BY level, display_order', (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Categories: Create
    ipcMain.handle('categories:create', async (_: any, category: any) => {
        return new Promise((resolve, reject) => {
            const { name, parent_id, icon, level, path: categoryPath, display_order } = category;
            db.run(
                'INSERT INTO categories (name, parent_id, icon, level, path, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                [name, parent_id, icon, level, categoryPath, display_order],
                function (err: any) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    });

    // Categories: Update
    ipcMain.handle('categories:update', async (_: any, category: any) => {
        return new Promise((resolve, reject) => {
            const { id, name, parent_id, icon, level, path: categoryPath, display_order } = category;
            db.run(
                'UPDATE categories SET name = ?, parent_id = ?, icon = ?, level = ?, path = ?, display_order = ? WHERE id = ?',
                [name, parent_id, icon, level, categoryPath, display_order, id],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Categories: Delete
    ipcMain.handle('categories:delete', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM categories WHERE id = ?', [id], (err: any) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // Manuals: Get by Category
    ipcMain.handle('manuals:getByCategory', async (_: any, categoryId: number) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM manuals WHERE category_id = ?', [categoryId], (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Manuals: Get one
    ipcMain.handle('manuals:getOne', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM manuals WHERE id = ?', [id], (err: any, row: any) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    });

    // Manuals: Create
    ipcMain.handle('manuals:create', async (_: any, manual: any) => {
        return new Promise((resolve, reject) => {
            const { category_id, title, content, flow_data } = manual;
            db.run(
                'INSERT INTO manuals (category_id, title, content, flow_data) VALUES (?, ?, ?, ?)',
                [category_id, title, content, flow_data],
                function (err: any) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    });

    // Manuals: Update
    ipcMain.handle('manuals:update', async (_: any, manual: any) => {
        const { id, category_id, title, content, flow_data, status } = manual;

        // 変更前に現在の状態を履歴として保存 (Version History)
        await new Promise<void>((resolve, reject) => {
            db.get('SELECT content, flow_data FROM manuals WHERE id = ?', [id], (err: any, row: any) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    db.run(
                        'INSERT INTO manual_history (manual_id, content, flow_data) VALUES (?, ?, ?)',
                        [id, row.content, row.flow_data],
                        (err2: any) => {
                            if (err2) reject(err2);
                            else resolve();
                        }
                    );
                } else {
                    resolve();
                }
            });
        });

        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE manuals SET category_id = ?, title = ?, content = ?, flow_data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [category_id, title, content, flow_data, status, id],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Delete
    ipcMain.handle('manuals:delete', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('DELETE FROM manual_history WHERE manual_id = ?', [id]);
                db.run('DELETE FROM manuals WHERE id = ?', [id], (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        });
    });

    // Manuals: Search
    ipcMain.handle('manuals:search', async (_: any, query: string) => {
        return new Promise((resolve, reject) => {
            const searchPattern = `%${query}%`;
            db.all(
                'SELECT * FROM manuals WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC',
                [searchPattern, searchPattern],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Get History
    ipcMain.handle('manuals:getHistory', async (_: any, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM manual_history WHERE manual_id = ? ORDER BY created_at DESC',
                [manualId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Database: Get path
    ipcMain.handle('db:getPath', () => {
        return getDBPath();
    });

    // Database: Backup
    ipcMain.handle('db:backup', async (_: any, destPath: string) => {
        const sourcePath = getDBPath();
        try {
            await fs.promises.copyFile(sourcePath, destPath);
            return true;
        } catch (err) {
            console.error('Backup failed:', err);
            return false;
        }
    });

    // Database: Restore
    ipcMain.handle('db:restore', async (_: any, sourcePath: string) => {
        const destPath = getDBPath();
        try {
            await fs.promises.copyFile(sourcePath, destPath);
            await reloadDB();
            return true;
        } catch (err) {
            console.error('Restore failed:', err);
            return false;
        }
    });

    // Config: Get Data Root
    ipcMain.handle('config:getDataRoot', () => {
        return getDataRoot();
    });

    // Config: Set Custom Data Path
    ipcMain.handle('config:setCustomDataPath', async (_: any, newPath: string | null) => {
        setCustomDataPath(newPath);
        await reloadDB();
        return getDataRoot();
    });

    // UI: Open Folder Dialog
    ipcMain.handle('ui:selectFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory']
        });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    // UI: Open File Dialog
    ipcMain.handle('ui:selectFile', async (_: any, options: any) => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            ...options
        });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    // UI: Save File Dialog
    ipcMain.handle('ui:saveFile', async (_: any, options: any) => {
        const result = await dialog.showSaveDialog(options);
        if (result.canceled) return null;
        return result.filePath;
    });

    // Manual Locks: Acquire
    ipcMain.handle('manuals:lock', async (_: any, { manualId, userId }: { manualId: number, userId: string }) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO manual_locks (manual_id, user_id) VALUES (?, ?)',
                [manualId, userId],
                (err: any) => {
                    if (err) {
                        // If already locked, check if it's the same user or if we should return the locker
                        db.get('SELECT user_id, locked_at FROM manual_locks WHERE manual_id = ?', [manualId], (err2: any, row: any) => {
                            if (err2) reject(err2);
                            else resolve({ success: false, lockedBy: row.user_id, lockedAt: row.locked_at });
                        });
                    } else {
                        resolve({ success: true });
                    }
                }
            );
        });
    });

    // Manual Locks: Release
    ipcMain.handle('manuals:unlock', async (_: any, { manualId, userId }: { manualId: number, userId: string }) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM manual_locks WHERE manual_id = ? AND user_id = ?',
                [manualId, userId],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manual Locks: Force Unlock
    ipcMain.handle('manuals:forceUnlock', async (_: any, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM manual_locks WHERE manual_id = ?', [manualId], (err: any) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // App: Get User Data Path
    ipcMain.handle('app:getUserDataPath', () => {
        return app.getPath('userData');
    });

    // App: Open External URL
    ipcMain.handle('app:openExternal', async (_: any, url: string) => {
        await shell.openExternal(url);
    });
}

// Helper to use shell easily within handlers
import { shell } from 'electron';
