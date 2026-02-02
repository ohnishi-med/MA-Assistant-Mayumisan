import sqlite3 from 'sqlite3';
import { app } from 'electron';
import path from 'path';

// Store DB in userData directory
const dbPath = path.join(app.getPath('userData'), 'mayumisan.db');

// Use verbose mode for development
if (!app.isPackaged) {
    sqlite3.verbose();
}

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
    }
});

export function initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("PRAGMA foreign_keys = ON");

            // Categories (Recursive structure)
            db.run(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
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
            `, (err) => {
                if (err) return reject(err);

                // --- Migrations for existing tables ---
                db.serialize(() => {
                    // Check if parent_id exists in manuals
                    db.get("PRAGMA table_info(manuals)", (infoErr) => {
                        if (infoErr) return;
                        db.all("PRAGMA table_info(manuals)", (colsErr, cols: any[]) => {
                            if (colsErr) return;
                            const hasParentId = cols.some(c => c.name === 'parent_id');
                            const hasVersion = cols.some(c => c.name === 'version');

                            if (!hasParentId) {
                                console.log('[DB] Adding parent_id column to manuals...');
                                db.run("ALTER TABLE manuals ADD COLUMN parent_id INTEGER", (err) => {
                                    if (!err) {
                                        db.run("UPDATE manuals SET parent_id = id WHERE parent_id IS NULL");
                                    }
                                });
                            }
                            if (!hasVersion) {
                                console.log('[DB] Adding version column to manuals...');
                                db.run("ALTER TABLE manuals ADD COLUMN version INTEGER DEFAULT 1");
                            }

                            // Finish initialization
                            seedInitialData().then(resolve).catch(reject);
                        });
                    });
                });
            });
        });
    });
}

async function seedInitialData(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM categories', (err, row: any) => {
            if (err) return reject(err);
            if (row.count > 0) return resolve();

            console.log('Seeding initial data...');
            db.serialize(() => {
                // Initial Categories
                const categories = [
                    { name: '受付・会計', level: 1, display_order: 1 },
                    { name: '保険請求 (レセプト)', level: 1, display_order: 2 },
                    { name: '公費・助成制度', level: 1, display_order: 3 },
                    { name: 'システム操作 (Digikar)', level: 1, display_order: 4 },
                    { name: '電話対応・接遇', level: 1, display_order: 5 }
                ];

                const stmt = db.prepare('INSERT INTO categories (name, level, display_order) VALUES (?, ?, ?)');
                categories.forEach(c => stmt.run(c.name, c.level, c.display_order));
                stmt.finalize();

                // Initial Sample Manual
                const sampleManual = {
                    title: '新患受付フロー (サンプル)',
                    content: '初めて来院された患者様の受付手順です。',
                    flowchart_data: JSON.stringify({
                        nodes: [
                            { id: 'start', type: 'input', data: { label: '保険証の確認' }, position: { x: 250, y: 0 } },
                            { id: 'q1', type: 'default', data: { label: 'お薬手帳はありますか？' }, position: { x: 250, y: 100 } },
                            { id: 'end', type: 'output', data: { label: 'カルテ作成' }, position: { x: 250, y: 200 } }
                        ],
                        edges: [
                            { id: 'e1', source: 'start', target: 'q1' },
                            { id: 'e2', source: 'q1', target: 'end', label: 'はい' }
                        ]
                    })
                };

                db.run(
                    'INSERT INTO manuals (title, content, flowchart_data) VALUES (?, ?, ?)',
                    [sampleManual.title, sampleManual.content, sampleManual.flowchart_data],
                    function (this: any, err) {
                        if (err) return reject(err);
                        const manualId = this.lastID;
                        // Set parent_id to itself for the first version
                        db.run('UPDATE manuals SET parent_id = ? WHERE id = ?', [manualId, manualId]);

                        // Link to '受付・会計' (Assuming ID 1)
                        db.run('INSERT INTO category_manuals (category_id, manual_id, entry_point) VALUES (1, ?, ?)', [manualId, 'start'], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                );
            });
        });
    });
}
