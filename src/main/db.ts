import { app } from 'electron';
import path from 'path';
import { createRequire } from 'module';
import type { Database } from 'sqlite3';

const cjsRequire = createRequire(import.meta.url);
const sqlite3 = cjsRequire('sqlite3');
const fs = cjsRequire('fs');

function getConfigPath() {
    return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (err) {
        console.error('Failed to load config:', err);
    }
    return {};
}

function saveConfig(config: any) {
    try {
        const configPath = getConfigPath();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Failed to save config:', err);
    }
}

export let db: Database;

export function getDBPath(): string {
    const root = getDataRoot();
    return path.join(root, 'mayumisan.db');
}

export function getDataRoot(): string {
    const config = loadConfig();
    if (config.customDataPath) {
        if (!fs.existsSync(config.customDataPath)) {
            try {
                fs.mkdirSync(config.customDataPath, { recursive: true });
            } catch (err) {
                console.error('Failed to create custom directory, fallback to default:', err);
                return app.getPath('userData');
            }
        }
        return config.customDataPath;
    }
    return app.getPath('userData');
}

export function setCustomDataPath(newPath: string | null): void {
    const config = loadConfig();
    if (newPath) {
        config.customDataPath = newPath;
    } else {
        delete config.customDataPath;
    }
    saveConfig(config);
}

export function reloadDB(): Promise<void> {
    const dbPath = getDBPath();
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err: any) => {
                if (err) {
                    console.error('Error closing database:', err);
                }
                db = new sqlite3.Database(dbPath, (err2: any) => {
                    if (err2) {
                        console.error('Failed to reconnect to database:', err2);
                        reject(err2);
                    } else {
                        console.log('Reloaded SQLite database at:', dbPath);
                        db.run("PRAGMA foreign_keys = ON", () => {
                            resolve();
                        });
                    }
                });
            });
        } else {
            db = new sqlite3.Database(dbPath, (err: any) => {
                if (err) {
                    console.error('Failed to connect to database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database at:', dbPath);
                    db.run("PRAGMA foreign_keys = ON", () => {
                        resolve();
                    });
                }
            });
        }
    });
}

export async function restoreDB(sourcePath: string): Promise<void> {
    const dbPath = getDBPath();
    return new Promise((resolve, reject) => {
        const performRestore = () => {
            try {
                fs.copyFileSync(sourcePath, dbPath);
                db = new sqlite3.Database(dbPath, async (err: any) => {
                    if (err) {
                        console.error('Failed to reconnect after restore:', err);
                        reject(err);
                    } else {
                        console.log('Restored database from:', sourcePath);
                        db.run("PRAGMA foreign_keys = ON", async () => {
                            try {
                                await ensureSchema(db);
                                resolve();
                            } catch (schemaErr) {
                                reject(schemaErr);
                            }
                        });
                    }
                });
            } catch (copyErr) {
                console.error('Failed to copy database file:', copyErr);
                reject(copyErr);
            }
        };

        if (db) {
            db.close((err: any) => {
                if (err) {
                    console.error('Error closing database for restore:', err);
                }
                performRestore();
            });
        } else {
            performRestore();
        }
    });
}

export async function ensureSchema(database: Database): Promise<void> {
    return new Promise<void>((resolve) => {
        database.serialize(() => {
            database.run(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    parent_id INTEGER,
                    icon TEXT,
                    level INTEGER DEFAULT 0,
                    path TEXT,
                    display_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES categories (id)
                )
            `);

            database.run(`
                CREATE TABLE IF NOT EXISTS manuals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER,
                    parent_id INTEGER,
                    title TEXT NOT NULL,
                    content TEXT,
                    flowchart_data TEXT,
                    flow_data TEXT,
                    version INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'draft',
                    is_favorite INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories (id)
                )
            `);

            database.run(`
                CREATE TABLE IF NOT EXISTS category_manuals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    manual_id INTEGER NOT NULL,
                    entry_point TEXT,
                    display_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
                    FOREIGN KEY (manual_id) REFERENCES manuals (id) ON DELETE CASCADE
                )
            `);

            database.run(`
                CREATE TABLE IF NOT EXISTS manual_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    manual_id INTEGER NOT NULL,
                    file_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER,
                    mime_type TEXT,
                    alt_text TEXT,
                    display_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (manual_id) REFERENCES manuals (id) ON DELETE CASCADE
                )
            `);

            database.run(`
                CREATE TABLE IF NOT EXISTS manual_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    manual_id INTEGER NOT NULL,
                    title TEXT,
                    content TEXT,
                    flowchart_data TEXT,
                    flow_data TEXT,
                    version INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (manual_id) REFERENCES manuals (id)
                )
            `);

            database.run(`
                CREATE TABLE IF NOT EXISTS manual_locks (
                    manual_id INTEGER PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (manual_id) REFERENCES manuals (id)
                )
            `);

            // Check if columns exist and add them if missing (Migrations)
            database.all("PRAGMA table_info(manuals)", (err, columns: any[]) => {
                if (err) return;
                const columnNames = columns.map(c => c.name);
                if (!columnNames.includes('category_id')) {
                    database.run("ALTER TABLE manuals ADD COLUMN category_id INTEGER");
                }
                if (!columnNames.includes('is_favorite')) {
                    database.run("ALTER TABLE manuals ADD COLUMN is_favorite INTEGER DEFAULT 0");
                }
                if (!columnNames.includes('version')) {
                    database.run("ALTER TABLE manuals ADD COLUMN version INTEGER DEFAULT 1");
                }
                if (!columnNames.includes('parent_id')) {
                    database.run("ALTER TABLE manuals ADD COLUMN parent_id INTEGER");
                }
                if (!columnNames.includes('flowchart_data')) {
                    database.run("ALTER TABLE manuals ADD COLUMN flowchart_data TEXT");
                }
                resolve();
            });
        });
    });
}

export async function initDB() {
    await reloadDB();
    await ensureSchema(db);

    return new Promise<void>((resolve) => {
        db.get("SELECT COUNT(*) as count FROM categories", (err, row: any) => {
            if (!err && row.count === 0) {
                // Seed initial categories if needed
                console.log('Seeding initial categories...');
            }
            resolve();
        });
    });
}
