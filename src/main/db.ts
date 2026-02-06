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

export async function initDB() {
    await reloadDB();

    return new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run(`
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

            db.run(`
                CREATE TABLE IF NOT EXISTS manuals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER,
                    title TEXT NOT NULL,
                    content TEXT,
                    flow_data TEXT,
                    status TEXT DEFAULT 'draft',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories (id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS manual_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    manual_id INTEGER NOT NULL,
                    content TEXT,
                    flow_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (manual_id) REFERENCES manuals (id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS manual_locks (
                    manual_id INTEGER PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (manual_id) REFERENCES manuals (id)
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}
