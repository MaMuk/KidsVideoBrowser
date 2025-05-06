// renderer.js
const categoryGrid = document.getElementById('category-grid');
const videoGrid = document.getElementById('video-grid');
const mediaInput = document.getElementById('media-folder-input');

let currentCategoryId = null;

async function loadCategories(parentId = null) {
    currentCategoryId = parentId;
    categoryGrid.innerHTML = '';
    videoGrid.innerHTML = '';

    const categories = await window.mediaAPI.getCategories(parentId);
    for (const cat of categories) {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => loadCategories(cat.id);

        const img = document.createElement('img');
        img.src = cat.thumbPath || 'GNOME_MPlayer_logo_placeholder.png';
        img.width = '150px';

        img.className = 'card-img';
        card.appendChild(img);

        const title = document.createElement('div');
        title.className = 'card-title';
        title.innerText = cat.name;
        card.appendChild(title);

        categoryGrid.appendChild(card);
    }

    if (parentId !== null) loadVideos(parentId);
}

async function loadVideos(categoryId) {
    const videos = await window.mediaAPI.getVideos(categoryId);
    for (const vid of videos) {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.mediaAPI.playVideo(vid.fullPath);

        const img = document.createElement('img');
        img.src = vid.thumbPath || 'GNOME_MPlayer_logo_placeholder.png';
        img.width = '150px';
        img.className = 'card-img';
        card.appendChild(img);

        const title = document.createElement('div');
        title.className = 'card-title';
        title.innerText = vid.name;
        card.appendChild(title);

        videoGrid.appendChild(card);
    }
}
async function rescanLibrary() {
    await window.mediaAPI.rescanMedia();
    alert('Rescan complete.');
    location.reload();
}

function openConfig() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('config-modal').style.display = 'block';
    window.mediaAPI.getMediaFolder().then(folder => {
        mediaInput.value = folder;
    });
    document.getElementById('language-select').value = currentLang;
}

function closeConfig() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('config-modal').style.display = 'none';
}

async function saveConfig() {
    const folder = mediaInput.value;
    await window.mediaAPI.setMediaFolder(folder);
    closeConfig();
    location.reload();
}

const translations = {
    en: {
        settingsButton: "🔧 Settings",
        configTitle: "Configure Media Folder",
        languageLabel: "Language:",
        saveButton: "Save",
        cancelButton: "Cancel",
        rescanTitle: "Rescan Library",
        rescanButton: "Start Rescan"
    },
    de: {
        settingsButton: "🔧 Einstellungen",
        configTitle: "Medienordner konfigurieren",
        languageLabel: "Sprache:",
        saveButton: "Speichern",
        cancelButton: "Abbrechen",
        rescanTitle: "Bibliothek neu scannen",
        rescanButton: "Rescan starten"
    }
};

let currentLang = localStorage.getItem('appLanguage') || 'en';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLanguage', lang);

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
}

function changeLanguage(lang) {
    setLanguage(lang);
}

// Initialize language
setLanguage(currentLang);

loadCategories();
