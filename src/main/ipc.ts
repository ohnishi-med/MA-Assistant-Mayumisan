import { ipcMain, app } from 'electron';
import { db, reloadDB } from './db';
import * as fs from 'fs';
import * as path from 'path';

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
    ipcMain.handle('categories:create', async (_, category: any) => {
        return new Promise((resolve, reject) => {
            const { name, parent_id, icon, level, path, display_order } = category;
            db.run(
                'INSERT INTO categories (name, parent_id, icon, level, path, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                [name, parent_id, icon, level, path, display_order],
                function (this: any, err: any) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });

    // Categories: Update
    ipcMain.handle('categories:update', async (_, id: number, updates: any) => {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            if (updates.name !== undefined) {
                fields.push('name = ?');
                values.push(updates.name);
            }
            if (updates.icon !== undefined) {
                fields.push('icon = ?');
                values.push(updates.icon);
            }
            if (updates.display_order !== undefined) {
                fields.push('display_order = ?');
                values.push(updates.display_order);
            }
            if ('parent_id' in updates) {
                fields.push('parent_id = ?');
                values.push(updates.parent_id);
            }

            if (fields.length === 0) {
                resolve(true);
                return;
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
            values.push(id);

            db.run(sql, values, (err: any) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // Categories: Delete
    ipcMain.handle('categories:delete', async (_, id: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM categories WHERE id = ?', [id], (err: any) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // Manuals: Get all
    ipcMain.handle('manuals:getAll', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, title, status, version, is_favorite, updated_at FROM manuals', (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Manuals: Get Unassigned (Manuals with no category links)
    ipcMain.handle('manuals:getUnassigned', async () => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT m.id, m.title, m.status, m.version, m.is_favorite, m.updated_at FROM manuals m ' +
                'LEFT JOIN category_manuals cm ON m.id = cm.manual_id ' +
                'WHERE cm.id IS NULL',
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Get by ID
    ipcMain.handle('manuals:getById', async (_, id: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM manuals WHERE id = ?', [id], (err: any, row: any) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    });

    // Manuals: Create
    ipcMain.handle('manuals:create', async (_, manual: any) => {
        return new Promise((resolve, reject) => {
            const { title, content, flowchart_data, status, parent_id } = manual;
            db.run(
                'INSERT INTO manuals (title, content, flowchart_data, status, parent_id) VALUES (?, ?, ?, ?, ?)',
                [title, content, JSON.stringify(flowchart_data), status, parent_id],
                function (this: any, err: any) {
                    if (err) {
                        reject(err);
                    } else {
                        const newId = this.lastID;
                        // If no parent_id was provided, it's a root manual, so point it to itself
                        if (!parent_id) {
                            db.run('UPDATE manuals SET parent_id = ? WHERE id = ?', [newId, newId], (uErr: any) => {
                                if (uErr) reject(uErr);
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

    // Manuals: Update (Overwrite current version)
    ipcMain.handle('manuals:update', async (_, id: number, updates: any) => {
        return new Promise((resolve, reject) => {
            const { title, content, flowchart_data, status, version } = updates;
            db.run(
                'UPDATE manuals SET title = ?, content = ?, flowchart_data = ?, status = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, content, JSON.stringify(flowchart_data), status, version, id],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Save as New Version
    ipcMain.handle('manuals:saveVersion', async (_, manualData: any) => {
        return new Promise((resolve, reject) => {
            const { parent_id, title, content, flowchart_data, status, version } = manualData;
            db.run(
                'INSERT INTO manuals (parent_id, title, content, flowchart_data, status, version) VALUES (?, ?, ?, ?, ?, ?)',
                [parent_id, title, content, JSON.stringify(flowchart_data), status, version],
                function (this: any, err: any) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });

    // Manuals: Get all versions for a manual
    ipcMain.handle('manuals:getVersions', async (_, parentId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM manuals WHERE parent_id = ? ORDER BY version DESC, created_at DESC',
                [parentId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Toggle Favorite
    ipcMain.handle('manuals:toggleFavorite', async (_, manualId: number, isFavorite: boolean) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE manuals SET is_favorite = ? WHERE id = ?',
                [isFavorite ? 1 : 0, manualId],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Link Category
    ipcMain.handle('manuals:linkCategory', async (_, manualId: number, categoryId: number, entryPoint?: string) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR REPLACE INTO category_manuals (manual_id, category_id, entry_point) VALUES (?, ?, ?)',
                [manualId, categoryId, entryPoint],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Unlink Category
    ipcMain.handle('manuals:unlinkCategory', async (_, manualId: number, categoryId: number) => {
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

    // Manuals: Move to New Category
    ipcMain.handle('manuals:moveCategory', async (_, manualId: number, oldCategoryId: number, newCategoryId: number) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE category_manuals SET category_id = ? WHERE manual_id = ? AND category_id = ?',
                [newCategoryId, manualId, oldCategoryId],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Categories: Get manuals in category
    ipcMain.handle('categories:getManuals', async (_, categoryId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT m.id, m.title, m.status, m.version, m.is_favorite, m.updated_at FROM manuals m ' +
                'JOIN category_manuals cm ON m.id = cm.manual_id ' +
                'WHERE cm.category_id = ?',
                [categoryId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Get categories for manual (Reverse lookup)
    ipcMain.handle('manuals:getCategories', async (_, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT c.*, cm.entry_point FROM categories c JOIN category_manuals cm ON c.id = cm.category_id WHERE cm.manual_id = ?',
                [manualId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Media: Upload
    ipcMain.handle('media:upload', async (_, manualId: number, fileName: string, buffer: any) => {
        const mediaDir = path.join(app.getPath('userData'), 'media', `manual_${manualId}`);
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        const filePath = path.join(mediaDir, fileName);
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(new Uint8Array(buffer));
        fs.writeFileSync(filePath, nodeBuffer);

        const stats = fs.statSync(filePath);

        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO manual_images (manual_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
                [manualId, fileName, filePath, stats.size, 'image/auto'],
                function (this: any, err: any) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, fileName, filePath });
                }
            );
        });
    });

    // Media: List
    ipcMain.handle('media:list', async (_, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM manual_images WHERE manual_id = ? ORDER BY display_order ASC',
                [manualId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Media: Delete
    ipcMain.handle('media:delete', async (_, imageId: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT file_path FROM manual_images WHERE id = ?', [imageId], (err: any, row: any) => {
                if (err || !row) {
                    reject(err || new Error('Image not found'));
                    return;
                }

                const filePath = row.file_path;
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

    // DB: Backup (Export)
    ipcMain.handle('db:backup', async () => {
        const dbPath = path.join(app.getPath('userData'), 'mayumisan.db');
        if (fs.existsSync(dbPath)) {
            return fs.readFileSync(dbPath);
        }
        throw new Error('Database file not found');
    });

    // DB: Restore (Import)
    ipcMain.handle('db:restore', async (_, buffer: Buffer) => {
        const dbPath = path.join(app.getPath('userData'), 'mayumisan.db');
        // Back up current DB just in case
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, dbPath + '.bak');
        }

        try {
            fs.writeFileSync(dbPath, buffer);
            await reloadDB();
            return true;
        } catch (error) {
            console.error('Restore error in main:', error);
            throw error;
        }
    });

    // Tags: Get all
    ipcMain.handle('tags:getAll', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tags ORDER BY name', (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Tags: Create
    ipcMain.handle('tags:create', async (_, tag: any) => {
        return new Promise((resolve, reject) => {
            const { name, color } = tag;
            db.run(
                'INSERT INTO tags (name, color) VALUES (?, ?)',
                [name, color],
                function (this: any, err: any) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });

    // Manuals: Add Tag
    ipcMain.handle('manuals:addTag', async (_, manualId: number, tagId: number) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO manual_tags (manual_id, tag_id) VALUES (?, ?)',
                [manualId, tagId],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Remove Tag
    ipcMain.handle('manuals:removeTag', async (_, manualId: number, tagId: number) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM manual_tags WHERE manual_id = ? AND tag_id = ?',
                [manualId, tagId],
                (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Manuals: Get Tags
    ipcMain.handle('manuals:getTags', async (_, manualId: number) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT t.* FROM tags t JOIN manual_tags mt ON t.id = mt.tag_id WHERE mt.manual_id = ?',
                [manualId],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });

    // Manuals: Search
    ipcMain.handle('manuals:search', async (_, query: string) => {
        return new Promise((resolve, reject) => {
            const searchTerm = `%${query}%`;
            db.all(
                'SELECT id, title, status, version, is_favorite, updated_at FROM manuals ' +
                'WHERE title LIKE ? OR content LIKE ? OR flowchart_data LIKE ? ' +
                'ORDER BY is_favorite DESC, updated_at DESC',
                [searchTerm, searchTerm, searchTerm],
                (err: any, rows: any[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });
}
