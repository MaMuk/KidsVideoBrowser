// video-data.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { app } = require('electron');
const { spawn } = require('child_process');
const { spawnSync } = require('child_process');
const configDir = app.getPath('userData');
const configPath = path.join(configDir, 'config.json');
const thumbDir = path.join(configDir, 'thumbnails');

let db;

function getMediaFolder() {
    let folder;

    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        folder = config.mediaFolder || path.join(configDir, 'videos');
    } else {
        folder = path.join(configDir, 'videos');
    }

    // Ensure the folder exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    return folder;
}
function setMediaFolder(folder) {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    const config = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        : {};

    config.mediaFolder = folder;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}


function ensureThumbDir() {
    if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir);
    }ensureThumbDir
}

function getVideoDuration(filePath) {
    const probe = spawnSync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
    ]);

    if (probe.status !== 0) return null;

    const output = probe.stdout.toString().trim();
    const duration = parseFloat(output);
    return isNaN(duration) ? null : duration;
}

function createThumbnail(videoFullPath, videoId) {
    ensureThumbDir();
    const thumbPath = path.join(thumbDir, `${videoId}.jpg`);
    if (fs.existsSync(thumbPath)) return thumbPath;

    const duration = getVideoDuration(videoFullPath);
    if (duration === null) return null;

    const seekTime = duration * 0.5;
    const timestamp = new Date(seekTime * 1000).toISOString().substr(11, 8); // Format as HH:MM:SS


    const result = spawnSync('ffmpeg', [
        '-ss', timestamp,
        '-i', videoFullPath,
        '-frames:v', '1',
        '-q:v', '2',
        '-y',
        thumbPath
    ]);

    if (result.status === 0) return thumbPath;
    return null;
}


function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Use app.getPath('userData') for cross-platform compatibility and writable path
        const dbDir = path.join(app.getPath('userData'), 'db');  // Creates a 'db' folder in ~/.config/YourAppName
        const dbPath = path.join(dbDir, 'media.db');

        // Ensure the directory exists before creating the database
        fs.mkdirSync(dbDir, { recursive: true });

        // Open the SQLite database in the user data directory
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                return reject(`Failed to open DB: ${err.message}`);
            }

            // Create tables if they don't exist
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY,
                name TEXT,
                parent_id INTEGER,
                path TEXT UNIQUE
            );`);

            db.run(`CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY,
                name TEXT,
                category_id INTEGER,
                path TEXT UNIQUE
            );`, () => {
                // Sync the media folder after DB initialization
                syncMediaFolder().then(resolve).catch(reject);
            });
        });
    });
}

async function syncMediaFolder() {
    const base = getMediaFolder();

    function walk(dir, parentId = null) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(base, fullPath);

            if (entry.isDirectory()) {
                db.run(
                    `INSERT OR IGNORE INTO categories (name, parent_id, path) VALUES (?, ?, ?);`,
                    [entry.name, parentId, relPath],
                    function () {
                        const newId = this.lastID;
                        walk(fullPath, newId || parentId);
                    }
                );
            } else if (/\.(mp4|mkv|avi|webm)$/i.test(entry.name)) {
                db.get(
                    `SELECT id FROM categories WHERE path = ?`,
                    [path.relative(base, path.dirname(fullPath))],
                    (err, row) => {
                        if (row) {
                            db.run(
                                `INSERT OR IGNORE INTO videos (name, category_id, path) VALUES (?, ?, ?);`,
                                [entry.name, row.id, relPath]
                            );
                        }
                    }
                );
            }
        });
    }

    walk(base);
}

function getCategories(parentId = null) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM categories WHERE parent_id IS ? ORDER BY name;`,
            [parentId],
            async (err, rows) => {
                if (err) return reject(err);

                const enriched = await Promise.all(rows.map(async cat => {
                    const videos = await new Promise((res, rej) =>
                        db.all(`SELECT * FROM videos WHERE category_id = ? LIMIT 1`, [cat.id], (e, r) => e ? rej(e) : res(r))
                    );

                    let thumbPath = 'assets/img/category_placeholder.png';
                    if (videos.length > 0) {
                        const fullPath = path.join(getMediaFolder(), videos[0].path);
                        const thumb = createThumbnail(fullPath, `cat-${cat.id}`);
                        if (thumb) thumbPath = thumb;
                    }

                    return { ...cat, thumbPath };
                }));

                resolve(enriched);
            }
        );
    });
}

function getVideos(categoryId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM videos WHERE category_id = ? ORDER BY name;`,
            [categoryId],
            (err, rows) => {
                if (err) return reject(err);
                const results = rows.map(v => {
                    const fullPath = path.join(getMediaFolder(), v.path);
                    const thumbPath = createThumbnail(fullPath, v.id) || 'assets/img/video_placeholder.png';
                    return { ...v, fullPath, thumbPath };
                });
                resolve(results);
            }
        );
    });
}

function playVideo(videoPath) {
    spawn('vlc', [videoPath], { detached: true });
}

function rescanMediaLibrary() {
    return new Promise((resolve, reject) => {
        const mediaFolder = getMediaFolder();

        db.all(`SELECT id, path FROM videos`, async (err, rows) => {
            if (err) return reject(err);

            const toDelete = rows.filter(row => !fs.existsSync(path.join(mediaFolder, row.path)));

            for (const { id } of toDelete) {
                await new Promise((res, rej) => {
                    db.run(`DELETE FROM videos WHERE id = ?`, [id], e => e ? rej(e) : res());
                });
                const thumbPath = path.join(configDir, 'thumbnails', `${id}.jpg`);
                if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            }

            // ✅ Remove empty categories (no videos, no subcategories)
            db.all(`SELECT id FROM categories`, async (err, rows) => {
                if (err) return reject(err);

                for (const { id } of rows) {
                    const hasVideos = await new Promise(res =>
                        db.get(`SELECT 1 FROM videos WHERE category_id = ? LIMIT 1`, [id], (e, r) => res(!!r))
                    );
                    const hasChildren = await new Promise(res =>
                        db.get(`SELECT 1 FROM categories WHERE parent_id = ? LIMIT 1`, [id], (e, r) => res(!!r))
                    );

                    if (!hasVideos && !hasChildren) {
                        db.run(`DELETE FROM categories WHERE id = ?`, [id]);
                    }
                }

                // Final re-sync to catch new files
                syncMediaFolder().then(resolve).catch(reject);
            });
        });
    });
}

module.exports = {
    initializeDatabase,
    getCategories,
    getVideos,
    setMediaFolder,
    getMediaFolder,
    playVideo,
    rescanMediaLibrary
};
