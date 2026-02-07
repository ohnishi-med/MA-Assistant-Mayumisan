import fs from 'fs';
import path from 'path';
import { getDBPath, getDataRoot } from './db';

/**
 * 自動バックアップサービス
 * 指定された保存ルート配下に 'backups' フォルダを作成し、
 * DBファイルのコピーを世代管理（最大10世代）します。
 */
export async function runAutomatedBackup() {
    try {
        const dbPath = getDBPath();
        const dataRoot = getDataRoot();
        const backupDir = path.join(dataRoot, 'backups');
        const mediaDir = path.join(dataRoot, 'media');

        if (!fs.existsSync(dbPath)) {
            console.error('[Backup] Database file not found, skipping backup.');
            return;
        }

        // バックアップ用ディレクトリの作成
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // タイムスタンプの生成
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .split('.')[0];

        // 1. データベースのバックアップ
        const backupFileName = `mayumisan_${timestamp}.db`;
        const backupFilePath = path.join(backupDir, backupFileName);
        fs.copyFileSync(dbPath, backupFilePath);
        console.log(`[Backup] DB Created: ${backupFileName}`);

        // 2. メディアフォルダのバックアップ (フォルダごとコピー)
        if (fs.existsSync(mediaDir)) {
            const mediaBackupDir = path.join(backupDir, `media_${timestamp}`);
            fs.mkdirSync(mediaBackupDir, { recursive: true });
            copyRecursiveSync(mediaDir, mediaBackupDir);
            console.log(`[Backup] Media Backed Up: media_${timestamp}`);
        }

        // 世代管理 (10世代を超えたら古いものを削除)
        // DBファイルの管理
        const dbFiles = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('mayumisan_') && f.endsWith('.db'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (dbFiles.length > 10) {
            dbFiles.slice(10).forEach(f => {
                try {
                    fs.unlinkSync(path.join(backupDir, f.name));
                    console.log(`[Backup] Deleted old DB: ${f.name}`);
                } catch (err) {
                    console.error(`[Backup] Failed to delete ${f.name}:`, err);
                }
            });
        }

        // メディアフォルダの管理
        const mediaDirs = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('media_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (mediaDirs.length > 10) {
            mediaDirs.slice(10).forEach(d => {
                try {
                    deleteRecursiveSync(path.join(backupDir, d.name));
                    console.log(`[Backup] Deleted old Media backup: ${d.name}`);
                } catch (err) {
                    console.error(`[Backup] Failed to delete folder ${d.name}:`, err);
                }
            });
        }
    } catch (err) {
        console.error('[Backup] Error during automated backup:', err);
    }
}

/**
 * フォルダを再帰的にコピーするヘルパー
 */
function copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

/**
 * フォルダを再帰的に削除するヘルパー
 */
function deleteRecursiveSync(dirPath: string) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteRecursiveSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}
