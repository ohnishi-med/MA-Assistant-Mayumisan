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

        if (!fs.existsSync(dbPath)) {
            console.error('[Backup] Database file not found, skipping backup.');
            return;
        }

        // バックアップ用ディレクトリの作成
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // ファイル名の生成 (mayumisan_YYYYMMDD_HHMMSS.db)
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .split('.')[0];
        const backupFileName = `mayumisan_${timestamp}.db`;
        const backupFilePath = path.join(backupDir, backupFileName);

        // コピー実行
        fs.copyFileSync(dbPath, backupFilePath);
        console.log(`[Backup] Created: ${backupFileName}`);

        // 世代管理 (10世代を超えたら古いものを削除)
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('mayumisan_') && f.endsWith('.db'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time); // 新しい順

        if (files.length > 10) {
            const filesToDelete = files.slice(10);
            filesToDelete.forEach(f => {
                try {
                    fs.unlinkSync(path.join(backupDir, f.name));
                    console.log(`[Backup] Deleted old version: ${f.name}`);
                } catch (err) {
                    console.error(`[Backup] Failed to delete ${f.name}:`, err);
                }
            });
        }
    } catch (err) {
        console.error('[Backup] Error during automated backup:', err);
    }
}
