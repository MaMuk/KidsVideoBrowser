// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mediaAPI', {
    getCategories: (parentId = null) => ipcRenderer.invoke('get-categories', parentId),
    getVideos: (categoryId) => ipcRenderer.invoke('get-videos', categoryId),
    setMediaFolder: (folder) => ipcRenderer.invoke('set-media-folder', folder),
    getMediaFolder: () => ipcRenderer.invoke('get-media-folder'),
    playVideo: (videoPath) => ipcRenderer.send('play-video', videoPath), // if needed via ipcMain.on
    rescanMedia: () => ipcRenderer.invoke('rescan-media')
});
