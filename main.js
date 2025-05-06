const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase, getCategories, getVideos, setMediaFolder, getMediaFolder } = require('./video-data');
const { spawn } = require('child_process');
let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.setMenuBarVisibility(false);
    win.loadFile('index.html');

}

app.whenReady().then(() => {
    initializeDatabase().then(createWindow);
});

ipcMain.handle('get-categories', async () => getCategories());
ipcMain.handle('get-videos', async (e, id) => getVideos(id));
ipcMain.handle('set-media-folder', async (e, folder) => setMediaFolder(folder));
ipcMain.handle('get-media-folder', async () => getMediaFolder());

ipcMain.on('play-video', (event, videoPath) => {
    spawn('vlc', [videoPath], { detached: true, stdio: 'ignore' }).unref();
});
ipcMain.handle('rescan-media', async () => {
    return require('./video-data').rescanMediaLibrary();
});