import { ipcMain } from 'electron';
import { db } from './db';

export function registerIpcHandlers() {
    // Categories: Get all
    ipcMain.handle('categories:getAll', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM categories ORDER BY display_order ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Categories: Create
    ipcMain.handle('categories:create', async (_, category: any) => {
        return new Promise((resolve, reject) => {
            const { name, parent_id, level, path, display_order } = category;
            db.run(
                'INSERT INTO categories (name, parent_id, level, path, display_order) VALUES (?, ?, ?, ?, ?)',
                [name, parent_id, level, path, display_order],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });

    // Categories: Update
    ipcMain.handle('categories:update', async (_, id: number, updates: any) => {
        return new Promise((resolve, reject) => {
            const { name, display_order } = updates;
            db.run(
                'UPDATE categories SET name = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, display_order, id],
                (err) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    });

    // Categories: Delete
    ipcMain.handle('categories:delete', async (_, id: number) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    // Manuals: Get all
    ipcMain.handle('manuals:getAll', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, title, status, version, updated_at FROM manuals', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    });

    // Manuals: Get by ID
    ipcMain.handle('manuals:getById', async (_, id: number) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM manuals WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    });

    // Manuals: Create
    ipcMain.handle('manuals:create', async (_, manual: any) => {
        return new Promise((resolve, reject) => {
            const { title, content, flowchart_data, status } = manual;
            db.run(
                'INSERT INTO manuals (title, content, flowchart_data, status) VALUES (?, ?, ?, ?)',
                [title, content, JSON.stringify(flowchart_data), status],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });

    // Manuals: Update
    ipcMain.handle('manuals:update', async (_, id: number, updates: any) => {
        return new Promise((resolve, reject) => {
            const { title, content, flowchart_data, status } = updates;
            db.run(
                'UPDATE manuals SET title = ?, content = ?, flowchart_data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, content, JSON.stringify(flowchart_data), status, id],
                (err) => {
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
                (err) => {
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
                (err) => {
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
                'SELECT m.id, m.title, m.status, cm.entry_point FROM manuals m JOIN category_manuals cm ON m.id = cm.manual_id WHERE cm.category_id = ?',
                [categoryId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    });
}
