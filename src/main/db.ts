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
                    title TEXT NOT NULL,
                    content TEXT,
                    flowchart_data TEXT, -- Store JSON as string
                    version INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'draft',
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                if (err) reject(err);
                else resolve();
            });
        });
    });
}
