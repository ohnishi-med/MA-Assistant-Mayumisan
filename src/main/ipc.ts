import { ipcMain, app, dialog } from 'electron';
import { db, getDBPath, reloadDB, restoreDB, getDataRoot, setCustomDataPath } from './db';
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
                function (this: any, err: any) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    });

    // Categories: Update
    ipcMain.handle('categories:update', async (_: any, id: number, updates: any) => {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates);
            if (fields.length === 0) {
                resolve(true);
                return;
            }
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = [...Object.values(updates), id];
            db.run(
                `UPDATE categories SET ${setClause} WHERE id = ?`,
                values,
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

    // Categories: Delete Recursive (delete category and all subcategories)
    ipcMain.handle('categories:deleteRecursive', async (_: any, id: number) => {
        console.log(`[deleteRecursive] Starting recursive delete for category ID: ${id}`);
        return new Promise((resolve, reject) => {
            // Recursive function to collect all descendant category IDs
            const collectDescendants = (categoryId: number, callback: (ids: number[]) => void) => {
                const descendants: number[] = [categoryId];

                const processCategory = (catId: number, done: () => void) => {
                    db.all(
                        'SELECT id FROM categories WHERE parent_id = ?',
                        [catId],
                        (err: any, children: any[]) => {
                            if (err) {
                                console.error(`[deleteRecursive] Error fetching children for category ${catId}:`, err);
                                reject(err);
                                return;
                            }

                            console.log(`[deleteRecursive] Category ${catId} has ${children.length} children:`, children.map(c => c.id));

                            if (children.length === 0) {
                                done();
                                return;
                            }

                            let processed = 0;
                            children.forEach(child => {
                                descendants.push(child.id);
                                processCategory(child.id, () => {
                                    processed++;
                                    if (processed === children.length) {
                                        done();
                                    }
                                });
                            });
                        }
                    );
                };

                processCategory(categoryId, () => {
                    console.log(`[deleteRecursive] Collected all descendants:`, descendants);
                    callback(descendants);
                });
            };

            // Collect all descendants and delete them
            collectDescendants(id, (idsToDelete) => {
                console.log(`[deleteRecursive] Will delete ${idsToDelete.length} categories:`, idsToDelete);

                // First, delete all category_manuals relationships for these categories
                const placeholders = idsToDelete.map(() => '?').join(',');
                console.log(`[deleteRecursive] Deleting category_manuals for categories:`, idsToDelete);

                db.run(
                    `DELETE FROM category_manuals WHERE category_id IN (${placeholders})`,
                    idsToDelete,
                    (err: any) => {
                        if (err) {
                            console.error('[deleteRecursive] Error deleting category_manuals:', err);
                            reject(err);
                            return;
                        }

                        console.log('[deleteRecursive] Successfully deleted category_manuals relationships');

                        // Reverse the array to delete children first, then parents
                        const reversedIds = [...idsToDelete].reverse();
                        console.log('[deleteRecursive] Deletion order (children first):', reversedIds);

                        // Delete all categories in order (children first)
                        const deleteNext = (index: number) => {
                            if (index >= reversedIds.length) {
                                console.log('[deleteRecursive] All categories deleted successfully');
                                resolve(true);
                                return;
                            }

                            const categoryId = reversedIds[index];
                            console.log(`[deleteRecursive] Deleting category ${categoryId} (${index + 1}/${reversedIds.length})`);

                            db.run('DELETE FROM categories WHERE id = ?', [categoryId], (err: any) => {
                                if (err) {
                                    console.error(`[deleteRecursive] Error deleting category ${categoryId}:`, err);
                                    reject(err);
                                } else {
                                    console.log(`[deleteRecursive] Successfully deleted category ${categoryId}`);
                                    deleteNext(index + 1);
                                }
                            });
                        };

                        deleteNext(0);
                    }
                );
            });
        });
    });

    // Categories: Fix Icons (utility to update icons for specific category names)
    ipcMain.handle('categories:fixIcons', async () => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Update "その他" to use MoreHorizontal
                db.run(
                    'UPDATE categories SET icon = ? WHERE name = ?',
                    ['MoreHorizontal', 'その他'],
                    (err: any) => {
                        if (err) console.error('Error updating その他 icon:', err);
                    }
                );

                // Update "検査" to use Microscope
                db.run(
                    'UPDATE categories SET icon = ? WHERE name = ?',
                    ['Microscope', '検査'],
                    (err: any) => {
                        if (err) {
                            console.error('Error updating 検査 icon:', err);
                            reject(err);
                        } else {
                            resolve(true);
                        }
                    }
                );
            });
        });
    });


    // Categories: Get Manuals (Alias/Specific for Category)
    ipcMain.handle('categories:getManuals', async (_: any, categoryId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT m.* FROM manuals m INNER JOIN category_manuals cm ON m.id = cm.manual_id WHERE cm.category_id = ? ORDER BY cm.display_order',
                [categoryId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Categories: Global Locks (Placeholders for now if no backend support yet)
    ipcMain.handle('categories:acquireGlobalLock', async () => {
        return { success: true };
    });

    ipcMain.handle('categories:releaseGlobalLock', async () => {
        return true;
    });

    ipcMain.handle('categories:forceReleaseGlobalLock', async () => {
        return true;
    });

    // Categories: Sync Order and Icons (set Navigation order as canonical)
    ipcMain.handle('categories:syncOrder', async () => {
        const categoryOrder = [
            { name: '受付', order: 0, icon: 'UserCheck' },
            { name: '算定', order: 1, icon: 'Calculator' },
            { name: '会計', order: 2, icon: 'BadgeJapaneseYen' },
            { name: '診療補助', order: 3, icon: 'Stethoscope' },
            { name: '書類', order: 4, icon: 'FileText' },
            { name: '検査', order: 5, icon: 'Microscope' },
            { name: '発注', order: 6, icon: 'ShoppingCart' },
            { name: '物品管理', order: 7, icon: 'Package' },
            { name: '送迎', order: 8, icon: 'Car' },
            { name: 'その他', order: 9, icon: 'MoreHorizontal' },
            { name: '予防接種', order: 10, icon: 'Syringe' },
        ];

        return new Promise((resolve) => {
            db.serialize(() => {
                for (const cat of categoryOrder) {
                    db.run(
                        'UPDATE categories SET display_order = ?, icon = ? WHERE name = ? AND parent_id IS NULL',
                        [cat.order, cat.icon, cat.name],
                        (err: any) => {
                            if (err) console.error(`Error updating ${cat.name}:`, err);
                        }
                    );
                }
                resolve(true);
            });
        });
    });

    // Manuals: Get all
    ipcMain.handle('manuals:getAll', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, title, is_favorite, updated_at FROM manuals ORDER BY is_favorite DESC, updated_at DESC', (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Manuals: Get by Category
    ipcMain.handle('manuals:getByCategory', async (_: any, categoryId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT m.* FROM manuals m INNER JOIN category_manuals cm ON m.id = cm.manual_id WHERE cm.category_id = ? ORDER BY cm.display_order',
                [categoryId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Get by ID
    ipcMain.handle('manuals:getById', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM manuals WHERE id = ?', [id], (err: any, row: any) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    });

    // Manuals: Get Unassigned
    ipcMain.handle('manuals:getUnassigned', async () => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM manuals WHERE id NOT IN (SELECT manual_id FROM category_manuals)',
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Get Imported (from special "取込" category)
    ipcMain.handle('manuals:getImported', async () => {
        return new Promise((resolve, reject) => {
            // First, find the "取込" category
            db.get(
                'SELECT id FROM categories WHERE name = ?',
                ['取込'],
                (err: any, category: any) => {
                    if (err) {
                        reject(err);
                    } else if (!category) {
                        // If "取込" category doesn't exist, return empty array
                        resolve([]);
                    } else {
                        // Get all manuals linked to this category
                        db.all(
                            'SELECT m.* FROM manuals m INNER JOIN category_manuals cm ON m.id = cm.manual_id WHERE cm.category_id = ? ORDER BY m.updated_at DESC',
                            [category.id],
                            (err2: any, rows: any[]) => {
                                if (err2) reject(err2);
                                else resolve(rows);
                            }
                        );
                    }
                }
            );
        });
    });


    // Manuals: Create
    ipcMain.handle('manuals:create', async (_: any, manual: any) => {
        return new Promise((resolve, reject) => {
            const { category_id, title, content, flowchart_data, flow_data } = manual;
            db.run(
                'INSERT INTO manuals (title, content, flowchart_data, flow_data) VALUES (?, ?, ?, ?)',
                [title, content, flowchart_data ? JSON.stringify(flowchart_data) : null, flow_data],
                function (this: any, err: any) {
                    if (err) reject(err);
                    else {
                        const newId = this.lastID;
                        if (category_id) {
                            db.run('INSERT INTO category_manuals (category_id, manual_id) VALUES (?, ?)', [category_id, newId], (err2: any) => {
                                if (err2) reject(err2);
                                else resolve(newId);
                            });
                        } else {
                            resolve(newId);
                        }
                    }
                }
            );
        });
    });

    // Manuals: Update
    ipcMain.handle('manuals:update', async (_: any, id: number, updates: any) => {
        const { title, content, flowchart_data, status, version, is_favorite } = updates;

        // Save history before update
        await new Promise<void>((resolve, reject) => {
            db.get('SELECT * FROM manuals WHERE id = ?', [id], (err: any, row: any) => {
                if (err) reject(err);
                else if (row) {
                    db.run(
                        'INSERT INTO manual_history (manual_id, title, content, flowchart_data, flow_data, version) VALUES (?, ?, ?, ?, ?, ?)',
                        [id, row.title, row.content, row.flowchart_data, row.flow_data, row.version],
                        (err2: any) => {
                            if (err2) reject(err2);
                            else resolve();
                        }
                    );
                } else resolve();
            });
        });

        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            if (title !== undefined) { fields.push('title = ?'); values.push(title); }
            if (content !== undefined) { fields.push('content = ?'); values.push(content); }
            if (flowchart_data !== undefined) {
                fields.push('flowchart_data = ?');
                values.push(flowchart_data ? JSON.stringify(flowchart_data) : null);
            }
            if (status !== undefined) { fields.push('status = ?'); values.push(status); }
            if (version !== undefined) { fields.push('version = ?'); values.push(version); }
            if (is_favorite !== undefined) { fields.push('is_favorite = ?'); values.push(is_favorite); }

            fields.push('updated_at = CURRENT_TIMESTAMP');

            if (fields.length === 1) { // Only updated_at
                resolve(true);
                return;
            }

            values.push(id);
            db.run(
                `UPDATE manuals SET ${fields.join(', ')} WHERE id = ?`,
                values,
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Save Version
    ipcMain.handle('manuals:saveVersion', async (_: any, versionData: any) => {
        return new Promise((resolve, reject) => {
            const { parent_id, title, content, flowchart_data, status, version } = versionData;
            db.run(
                'INSERT INTO manuals (parent_id, title, content, flowchart_data, status, version) VALUES (?, ?, ?, ?, ?, ?)',
                [parent_id, title, content, flowchart_data ? JSON.stringify(flowchart_data) : null, status, version],
                function (this: any, err: any) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });

    // Manuals: Delete
    ipcMain.handle('manuals:delete', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('DELETE FROM category_manuals WHERE manual_id = ?', [id]);
                db.run('DELETE FROM manual_history WHERE manual_id = ?', [id]);
                db.run('DELETE FROM manual_images WHERE manual_id = ?', [id]);
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

    // Manuals: Get Categories
    ipcMain.handle('manuals:getCategories', async (_: any, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT c.*, cm.entry_point FROM categories c INNER JOIN category_manuals cm ON c.id = cm.category_id WHERE cm.manual_id = ?',
                [manualId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Link Category
    ipcMain.handle('manuals:linkCategory', async (_: any, manualId: number, categoryId: number, entryPoint?: string) => {
        console.log(`[IPC] manuals:linkCategory - manualId: ${manualId}, categoryId: ${categoryId}, entryPoint: ${entryPoint}`);
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO category_manuals (manual_id, category_id, entry_point) VALUES (?, ?, ?)',
                [manualId, categoryId, entryPoint],
                (err: any) => {
                    if (err) {
                        console.error('[IPC] manuals:linkCategory error:', err);
                        reject(err);
                    } else {
                        console.log(`[IPC] manuals:linkCategory success - manualId: ${manualId} linked to categoryId: ${categoryId}`);
                        resolve(true);
                    }
                }
            );
        });
    });

    // Manuals: Unlink Category
    ipcMain.handle('manuals:unlinkCategory', async (_: any, manualId: number, categoryId: number) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM category_manuals WHERE manual_id = ? AND category_id = ?',
                [manualId, categoryId],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Move Category
    ipcMain.handle('manuals:moveCategory', async (_: any, manualId: number, oldCategoryId: number, newCategoryId: number) => {
        console.log(`[IPC] manuals:moveCategory - manualId: ${manualId}, from: ${oldCategoryId}, to: ${newCategoryId}`);
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE category_manuals SET category_id = ? WHERE manual_id = ? AND category_id = ?',
                [newCategoryId, manualId, oldCategoryId],
                (err: any) => {
                    if (err) {
                        console.error('[IPC] manuals:moveCategory error:', err);
                        reject(err);
                    } else {
                        console.log(`[IPC] manuals:moveCategory success - manualId: ${manualId} moved to categoryId: ${newCategoryId}`);
                        resolve(true);
                    }
                }
            );
        });
    });

    // Manuals: Toggle Favorite
    ipcMain.handle('manuals:toggleFavorite', async (_: any, id: number, isFavorite: boolean) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE manuals SET is_favorite = ? WHERE id = ?',
                [isFavorite ? 1 : 0, id],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Get Versions
    ipcMain.handle('manuals:getVersions', async (_: any, parentId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM manuals WHERE parent_id = ? OR id = ? ORDER BY version DESC',
                [parentId, parentId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Acquire Lock
    ipcMain.handle('manuals:acquireLock', async (_: any, id: number) => {
        const userId = 'staff'; // Mock user ID for now
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO manual_locks (manual_id, user_id) VALUES (?, ?)',
                [id, userId],
                (err: any) => {
                    if (err) {
                        db.get('SELECT user_id, locked_at FROM manual_locks WHERE manual_id = ?', [id], (err2: any, row: any) => {
                            if (err2) reject(err2);
                            else resolve({ success: false, editingBy: row.user_id, editingSince: row.locked_at });
                        });
                    } else {
                        resolve({ success: true });
                    }
                }
            );
        });
    });

    // Manuals: Release Lock
    ipcMain.handle('manuals:releaseLock', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM manual_locks WHERE manual_id = ?', [id], (err: any) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // Manuals: Force Release Lock
    ipcMain.handle('manuals:forceReleaseLock', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM manual_locks WHERE manual_id = ?', [id], (err: any) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // Manuals: Check Lock
    ipcMain.handle('manuals:checkLock', async (_: any, id: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT user_id, locked_at FROM manual_locks WHERE manual_id = ?', [id], (err: any, row: any) => {
                if (err) reject(err);
                else resolve({ editing_by: row?.user_id || null, editing_since: row?.locked_at || null });
            });
        });
    });

    // Manuals: Get History (from history table)
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

    // Media: Upload
    ipcMain.handle('media:upload', async (_, manualId: number, fileName: string, buffer: ArrayBuffer) => {
        try {
            const dataRoot = getDataRoot();
            const mediaDir = path.join(dataRoot, 'media');
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir, { recursive: true });
            }

            const filePath = path.join(mediaDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(buffer));

            return new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO manual_images (manual_id, file_name, file_path) VALUES (?, ?, ?)',
                    [manualId, fileName, filePath],
                    function (this: any, err: any) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID, file_name: fileName, file_path: filePath });
                    }
                );
            });
        } catch (err) {
            console.error('Media upload failed:', err);
            throw err;
        }
    });

    // Media: List
    ipcMain.handle('media:list', async (_, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM manual_images WHERE manual_id = ?', [manualId], (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Media: Delete
    ipcMain.handle('media:delete', async (_: any, imageId: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT file_path FROM manual_images WHERE id = ?', [imageId], (err: any, row: any) => {
                if (err || !row) {
                    reject(err || new Error('Image not found'));
                    return;
                }
                const filePath = (row as any).file_path;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                db.run('DELETE FROM manual_images WHERE id = ?', [imageId], (err2: any) => {
                    if (err2) reject(err2);
                    else resolve(true);
                });
            });
        });
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

    // App: Get User Data Path
    ipcMain.handle('app:getUserDataPath', () => {
        return app.getPath('userData');
    });

    // App: Get Version
    ipcMain.handle('app:getVersion', () => {
        return app.getVersion();
    });

    // DB: Backup
    ipcMain.handle('db:backup', async (_: any, targetPath: string) => {
        try {
            const dbPath = getDBPath();
            fs.copyFileSync(dbPath, targetPath);
            return true;
        } catch (err) {
            console.error('Backup error:', err);
            return false;
        }
    });

    // DB: Restore
    ipcMain.handle('db:restore', async (_: any, sourcePath: string) => {
        try {
            await restoreDB(sourcePath);
            return true;
        } catch (err) {
            console.error('Restore error:', err);
            return false;
        }
    });

    // UI: Save File Dialog
    ipcMain.handle('ui:saveFile', async (_: any, options: any) => {
        const result = await dialog.showSaveDialog(options);
        if (result.canceled) return null;
        return result.filePath;
    });

    // UI: Select File Dialog
    ipcMain.handle('ui:selectFile', async (_: any, options: any) => {
        const result = await dialog.showOpenDialog({
            ...options,
            properties: ['openFile']
        });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    // UI: Select Directory
    ipcMain.handle('ui:selectDirectory', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });

    // Manuals: Import from Directory
    ipcMain.handle('manuals:importFromDirectory', async (_: any, directoryPath: string) => {
        const importRecursive = async (currentPath: string, parentCategoryId: number | null, level: number) => {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            // Sort: Directories first, then files
            items.sort((a, b) => {
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.name.localeCompare(b.name);
            });

            for (const item of items) {
                const fullPath = path.join(currentPath, item.name);

                if (item.isDirectory()) {
                    // Create Category
                    // Use a promise to ensure sequential insertion and ID retrieval
                    const newCategoryId = await new Promise<number>((resolve, reject) => {
                        db.run(
                            'INSERT INTO categories (name, parent_id, level, display_order, path) VALUES (?, ?, ?, ?, ?)',
                            [item.name, parentCategoryId, level, 0, ''],
                            function (this: any, err: any) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    });

                    // Recurse
                    await importRecursive(fullPath, newCategoryId, level + 1);

                } else if (item.isFile() && (item.name.toLowerCase().endsWith('.md') || item.name.toLowerCase().endsWith('.txt'))) {
                    // Create Manual
                    const title = path.parse(item.name).name;
                    const content = fs.readFileSync(fullPath, 'utf-8');

                    const manualId = await new Promise<number>((resolve, reject) => {
                        db.run(
                            'INSERT INTO manuals (title, content, category_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                            [title, content, parentCategoryId],
                            function (this: any, err: any) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    });

                    // Link to Category (Many-to-Many consistency)
                    if (parentCategoryId) {
                        db.run(
                            'INSERT OR REPLACE INTO category_manuals (manual_id, category_id) VALUES (?, ?)',
                            [manualId, parentCategoryId],
                            (err: any) => {
                                if (err) console.error('Failed to link imported manual:', err);
                            }
                        );
                    }
                }
            }
        };

        try {
            // Create root category from the selected folder name
            const rootFolderName = path.basename(directoryPath);

            const rootCategoryId = await new Promise<number>((resolve, reject) => {
                db.run(
                    'INSERT INTO categories (name, parent_id, level, display_order, path) VALUES (?, ?, ?, ?, ?)',
                    [rootFolderName, null, 0, 0, ''],
                    function (this: any, err: any) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            await importRecursive(directoryPath, rootCategoryId, 1);
            return { success: true };
        } catch (error: any) {
            console.error('Import failed:', error);
            return { success: false, error: error.message };
        }
    });



    const importManualsFromData = async (manuals: any[]) => {
        // Ensure Root "取込" Category existing

        // Ensure "未分類" (Uncategorized) -> "取込" (Import) hierarchy exists
        let rootUncategorizedId: number;
        const rootName = '未分類';

        // 1. Get or Create "未分類" Root
        const rootExisting: any = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM categories WHERE name = ? AND parent_id IS NULL', [rootName], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (rootExisting) {
            rootUncategorizedId = rootExisting.id;
        } else {
            rootUncategorizedId = await new Promise<number>((resolve, reject) => {
                db.run(
                    'INSERT INTO categories (name, parent_id, level, display_order, path) VALUES (?, ?, ?, ?, ?)',
                    [rootName, null, 1, 0, ''],
                    function (this: any, err: any) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        }

        // 2. Get or Create "取込" under "未分類"
        let importCategoryId: number;
        const importName = '取込';

        const importExisting: any = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM categories WHERE name = ? AND parent_id = ?', [importName, rootUncategorizedId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (importExisting) {
            importCategoryId = importExisting.id;
        } else {
            importCategoryId = await new Promise<number>((resolve, reject) => {
                db.run(
                    'INSERT INTO categories (name, parent_id, level, display_order, path) VALUES (?, ?, ?, ?, ?)',
                    [importName, rootUncategorizedId, 2, 0, ''],
                    function (this: any, err: any) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        }

        for (const manual of manuals) {
            if (!manual.title) continue;

            // Default to "未分類/取込" if no category is specified
            let categoryId: number | null = importCategoryId;

            // Handle Category Path
            if (manual.category) {
                const parts = manual.category.split('/').filter((p: string) => p.trim() !== '');
                let currentParentId: number | null = null;
                let currentLevel = 1;

                for (const part of parts) {
                    // Check if category exists
                    const existing: any = await new Promise((resolve, reject) => {
                        db.get(
                            'SELECT id FROM categories WHERE name = ? AND parent_id IS ?',
                            [part, currentParentId],
                            (err, row) => {
                                if (err) reject(err);
                                else resolve(row);
                            }
                        );
                    });

                    if (existing) {
                        currentParentId = existing.id;
                    } else {
                        // Create new category
                        const newId = await new Promise<number>((resolve, reject) => {
                            db.run(
                                'INSERT INTO categories (name, parent_id, level, display_order, path) VALUES (?, ?, ?, ?, ?)',
                                [part, currentParentId, currentLevel, 0, ''],
                                function (this: any, err: any) {
                                    if (err) reject(err);
                                    else resolve(this.lastID);
                                }
                            );
                        });
                        currentParentId = newId;
                    }
                    currentLevel++;
                }
                categoryId = currentParentId;
            }

            // Create Manual
            const manualId = await new Promise<number>((resolve, reject) => {
                // Generate flowchart_data if steps are provided
                let flowchartDataStr = null;
                if (manual.steps && Array.isArray(manual.steps) && manual.steps.length > 0) {
                    const nodes = manual.steps.map((step: any, index: number) => ({
                        id: `step_${index + 1}`,
                        type: 'step',
                        position: { x: 100, y: 100 + (index * 150) },
                        data: {
                            label: step.label || `Step ${index + 1}`,
                            comment: step.content || ''
                        }
                    }));

                    const edges = manual.steps.slice(0, -1).map((_: any, index: number) => ({
                        id: `e_${index + 1}_${index + 2}`,
                        source: `step_${index + 1}`,
                        target: `step_${index + 2}`,
                        type: 'smoothstep'
                    }));

                    flowchartDataStr = JSON.stringify({ nodes, edges });
                }

                db.run(
                    'INSERT INTO manuals (title, content, category_id, flowchart_data, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                    [manual.title, manual.content || '', categoryId, flowchartDataStr],
                    function (this: any, err: any) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            // Link to Category
            if (categoryId) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT OR REPLACE INTO category_manuals (manual_id, category_id) VALUES (?, ?)',
                        [manualId, categoryId],
                        (err: any) => {
                            if (err) reject(err);
                            else resolve(true);
                        }
                    );
                });
            }
        }
    };

    // Manuals: Import from JSON File
    ipcMain.handle('manuals:importFromJson', async (_: any, filePath: string) => {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const manuals = JSON.parse(fileContent);

            if (!Array.isArray(manuals)) {
                return { success: false, error: 'JSON format error: Root must be an array.' };
            }

            await importManualsFromData(manuals);
            return { success: true };

        } catch (error: any) {
            console.error('JSON Import failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Manuals: Import from JSON String
    ipcMain.handle('manuals:importFromJsonString', async (_: any, jsonString: string) => {
        try {
            // Strip markdown code blocks if present
            const cleanJsonString = jsonString.replace(/^```json\s*|\s*```$/g, '').trim();
            const manuals = JSON.parse(cleanJsonString);

            if (!Array.isArray(manuals)) {
                return { success: false, error: 'JSON format error: Root must be an array.' };
            }

            await importManualsFromData(manuals);
            return { success: true };

        } catch (error: any) {
            console.error('JSON String Import failed:', error);
            return { success: false, error: error.message };
        }
    });

}
