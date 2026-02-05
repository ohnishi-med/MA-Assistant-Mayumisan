import { app } from 'electron';
import path from 'path';
import { createRequire } from 'module';
import type { Database } from 'sqlite3';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3');

// Store DB in userData directory
let dbPath: string;
export let db: Database;

export function getDBPath(): string {
    if (!dbPath) {
        dbPath = path.join(app.getPath('userData'), 'mayumisan.db');
    }
    return dbPath;
}

export function reloadDB(): Promise<void> {
    const path = getDBPath();
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err: any) => {
                if (err) {
                    console.error('Error closing database:', err);
                }
                db = new sqlite3.Database(path, (err2: any) => {
                    if (err2) {
                        console.error('Failed to reconnect to database:', err2);
                        reject(err2);
                    } else {
                        console.log('Reloaded SQLite database at:', path);
                        db.run("PRAGMA foreign_keys = ON", () => {
                            resolve();
                        });
                    }
                });
            });
        } else {
            db = new sqlite3.Database(path, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
    });
}

export function initDB(): Promise<void> {
    const path = getDBPath();

    // Use verbose mode for development
    if (!app.isPackaged) {
        sqlite3.verbose();
    }

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(path, (err: any) => {
            if (err) {
                console.error('Failed to connect to database:', err);
                return reject(err);
            }
            console.log('Connected to SQLite database at:', path);

            db.serialize(() => {
                db.run("PRAGMA foreign_keys = ON");

                // Categories (Recursive structure)
                db.run(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    icon TEXT,
                    parent_id INTEGER,
                    level INTEGER CHECK (level BETWEEN 1 AND 5),
                    path TEXT,
                    display_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES categories(id)
                )
                `);

                db.run(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path)`);

                // Manuals
                db.run(`
                CREATE TABLE IF NOT EXISTS manuals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    parent_id INTEGER, -- For version grouping (null means it's the root)
                    title TEXT NOT NULL,
                    content TEXT,
                    flowchart_data TEXT, -- Store JSON as string
                    version INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'draft',
                    is_favorite INTEGER DEFAULT 0,
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES manuals(id) ON DELETE CASCADE
                )
                `);

                db.run(`CREATE INDEX IF NOT EXISTS idx_manuals_status ON manuals(status)`);

                // Category-Manual relations (Multi-path access)
                db.run(`
                CREATE TABLE IF NOT EXISTS category_manuals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    manual_id INTEGER NOT NULL,
                    entry_point TEXT,
                    display_order INTEGER DEFAULT 0,
                    UNIQUE(category_id, manual_id),
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                    FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE
                )
                `);

                // Tags
                db.run(`
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                `);

                // Manual-Tag relations
                db.run(`
                CREATE TABLE IF NOT EXISTS manual_tags (
                    manual_id INTEGER NOT NULL,
                    tag_id INTEGER NOT NULL,
                    PRIMARY KEY (manual_id, tag_id),
                    FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
                `);

                // Manual Images
                db.run(`
                CREATE TABLE IF NOT EXISTS manual_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    manual_id INTEGER NOT NULL,
                    file_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER,
                    mime_type TEXT,
                    alt_text TEXT,
                    display_order INTEGER DEFAULT 0,
                    uploaded_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (manual_id) REFERENCES manuals(id) ON DELETE CASCADE
                )
                `, (err: any) => {
                    if (err) return reject(err);

                    // --- Migrations for existing tables ---
                    db.serialize(() => {
                        // Check columns for categories and manuals
                        db.all("PRAGMA table_info(categories)", (err2: any, catCols: any[]) => {
                            if (err2) return;
                            const hasIcon = catCols.some(c => c.name === 'icon');
                            if (!hasIcon) {
                                console.log('[DB] Adding icon column to categories...');
                                db.run("ALTER TABLE categories ADD COLUMN icon TEXT");
                            }

                            db.all("PRAGMA table_info(manuals)", (colsErr: any, manualCols: any[]) => {
                                if (colsErr) return;
                                const hasParentId = manualCols.some(c => c.name === 'parent_id');
                                const hasVersion = manualCols.some(c => c.name === 'version');
                                const hasFavorite = manualCols.some(c => c.name === 'is_favorite');

                                if (!hasParentId) {
                                    console.log('[DB] Adding parent_id column to manuals...');
                                    db.run("ALTER TABLE manuals ADD COLUMN parent_id INTEGER", (err3: any) => {
                                        if (!err3) {
                                            db.run("UPDATE manuals SET parent_id = id WHERE parent_id IS NULL");
                                        }
                                    });
                                }
                                if (!hasVersion) {
                                    console.log('[DB] Adding version column to manuals...');
                                    db.run("ALTER TABLE manuals ADD COLUMN version INTEGER DEFAULT 1");
                                }
                                if (!hasFavorite) {
                                    console.log('[DB] Adding is_favorite column to manuals...');
                                    db.run("ALTER TABLE manuals ADD COLUMN is_favorite INTEGER DEFAULT 0");
                                }

                                // Migrate icons for existing categories to match new defaults
                                db.run("UPDATE categories SET icon = 'Folder' WHERE name = '検査' AND (icon = 'TestTube2' OR icon IS NULL)");
                                db.run("UPDATE categories SET icon = 'Folder' WHERE name = 'その他' AND (icon = 'MoreHorizontal' OR icon IS NULL)");

                                // Finish initialization
                                seedInitialData().then(resolve).catch(reject);
                            });
                        });
                    });
                });
            });
        });
    });
}

async function seedInitialData(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM categories', (err: any, row: any) => {
            if (err) return reject(err);
            if (row.count > 0) return resolve();

            console.log('Seeding initial data...');
            db.serialize(() => {
                // Requested Root Categories with default icons
                const rootCategories = [
                    { name: '受付', icon: 'UserCheck' },
                    { name: '算定', icon: 'Calculator' },
                    { name: '会計', icon: 'BadgeJapaneseYen' },
                    { name: '診療補助', icon: 'Stethoscope' },
                    { name: '書類', icon: 'FileText' },
                    { name: '検査', icon: 'Folder' },
                    { name: '発注', icon: 'ShoppingCart' },
                    { name: '物品管理', icon: 'Package' },
                    { name: '送迎', icon: 'Car' },
                    { name: 'その他', icon: 'Folder' }
                ];

                rootCategories.forEach((cat, index) => {
                    const displayOrder = index + 1;
                    db.run('INSERT INTO categories (name, icon, level, display_order) VALUES (?, ?, 1, ?)', [cat.name, cat.icon, displayOrder], function (this: any, err4: any) {
                        if (err4) return;
                        const parentId = this.lastID;

                        // Create 3 placeholder subfolders for each
                        for (let i = 1; i <= 3; i++) {
                            db.run('INSERT INTO categories (name, level, display_order, parent_id) VALUES (?, 2, ?, ?)',
                                [`${cat.name}サブフォルダ ${i}`, i, parentId]);
                        }

                        // Create a sample manual for the category
                        const sampleManual = {
                            title: `${cat.name}業務 基本マニュアル`,
                            content: `${cat.name}に関する基本的な手順を記載します。`,
                            flowchart_data: JSON.stringify({
                                nodes: [
                                    { id: 'start', type: 'input', data: { label: '開始' }, position: { x: 250, y: 0 } },
                                    { id: 'step1', type: 'default', data: { label: '一次確認' }, position: { x: 250, y: 100 } },
                                    { id: 'end', type: 'output', data: { label: '完了' }, position: { x: 250, y: 200 } }
                                ],
                                edges: [{ id: 'e1', source: 'start', target: 'step1' }, { id: 'e2', source: 'step1', target: 'end' }]
                            })
                        };

                        db.run(
                            'INSERT INTO manuals (title, content, flowchart_data) VALUES (?, ?, ?)',
                            [sampleManual.title, sampleManual.content, sampleManual.flowchart_data],
                            function (this: any, err5: any) {
                                if (err5) return;
                                const manualId = this.lastID;
                                db.run('UPDATE manuals SET parent_id = ? WHERE id = ?', [manualId, manualId]);
                                db.run('INSERT INTO category_manuals (category_id, manual_id, entry_point) VALUES (?, ?, ?)', [parentId, manualId, 'start']);
                            }
                        );
                    });
                });

                resolve();
            });
        });
    });
}
