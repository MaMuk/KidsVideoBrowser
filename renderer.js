// renderer.js
const categoryGrid = document.getElementById('category-grid');
const videoGrid = document.getElementById('video-grid');
const mediaInput = document.getElementById('media-folder-input');
const videoFilterContainer = document.getElementById('video-filter-container');
const videoFilterInput = document.getElementById('video-filter-input');

let currentCategoryId = null;
let allVideoElements = []; // Store all video elements with their names for filtering

async function loadCategories(parentId = null) {
    currentCategoryId = parentId;
    categoryGrid.innerHTML = '';
    videoGrid.innerHTML = '';
    allVideoElements = [];

    // Hide filter when showing categories
    videoFilterContainer.classList.remove('is-visible');
    videoFilterInput.value = '';

    const categories = await window.mediaAPI.getCategories(parentId);
    for (const cat of categories) {
        // Create column wrapper for Bulma grid
        const column = document.createElement('div');
        column.className = 'column is-narrow';

        // Create Bulma card
        const card = document.createElement('div');
        card.className = 'card media-card';
        card.onclick = () => loadCategories(cat.id);

        // Card image section
        const cardImage = document.createElement('div');
        cardImage.className = 'card-image';

        const figure = document.createElement('figure');
        figure.className = 'image';

        const img = document.createElement('img');
        img.src = cat.thumbPath || 'assets/img/category_placeholder.png';
        img.alt = cat.name;

        figure.appendChild(img);
        cardImage.appendChild(figure);
        card.appendChild(cardImage);

        // Card content section
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        const title = document.createElement('p');
        title.className = 'title is-6';
        title.innerText = cat.name;
        cardContent.appendChild(title);

        card.appendChild(cardContent);
        column.appendChild(card);
        categoryGrid.appendChild(column);
    }

    if (parentId !== null) loadVideos(parentId);
}

async function loadVideos(categoryId) {
    const videos = await window.mediaAPI.getVideos(categoryId);

    // Show filter when videos are loaded
    if (videos.length > 0) {
        videoFilterContainer.classList.add('is-visible');
    }

    for (const vid of videos) {
        // Create column wrapper for Bulma grid
        const column = document.createElement('div');
        column.className = 'column is-narrow';

        // Create Bulma card
        const card = document.createElement('div');
        card.className = 'card media-card';
        card.onclick = () => window.mediaAPI.playVideo(vid.fullPath);

        // Card image section
        const cardImage = document.createElement('div');
        cardImage.className = 'card-image';

        const figure = document.createElement('figure');
        figure.className = 'image';

        const img = document.createElement('img');
        img.src = vid.thumbPath || 'assets/img/video_placeholder.png';
        img.alt = vid.name;

        figure.appendChild(img);
        cardImage.appendChild(figure);
        card.appendChild(cardImage);

        // Card content section
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        const title = document.createElement('p');
        title.className = 'title is-6';
        title.innerText = vid.name;
        cardContent.appendChild(title);

        card.appendChild(cardContent);
        column.appendChild(card);
        videoGrid.appendChild(column);

        // Store video element with its name for filtering
        allVideoElements.push({
            element: column,
            name: vid.name.toLowerCase()
        });
    }
}

// Filter videos based on search input
function filterVideos() {
    const filterText = videoFilterInput.value.toLowerCase().trim();

    allVideoElements.forEach(video => {
        if (filterText === '' || video.name.includes(filterText)) {
            video.element.style.display = '';
        } else {
            video.element.style.display = 'none';
        }
    });
}

// Add event listener for filter input
videoFilterInput.addEventListener('input', filterVideos);
async function rescanLibrary() {
    await window.mediaAPI.rescanMedia();
    alert('Rescan complete.');
    location.reload();
}

function openConfig() {
    document.getElementById('config-modal').classList.add('is-active');
    window.mediaAPI.getMediaFolder().then(folder => {
        mediaInput.value = folder;
    });
    document.getElementById('language-select').value = currentLang;
}

function closeConfig() {
    document.getElementById('config-modal').classList.remove('is-active');
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
        rescanButton: "Start Rescan",
        filterPlaceholder: "🔍 Filter videos..."
    },
    de: {
        settingsButton: "🔧 Einstellungen",
        configTitle: "Medienordner konfigurieren",
        languageLabel: "Sprache:",
        saveButton: "Speichern",
        cancelButton: "Abbrechen",
        rescanTitle: "Bibliothek neu scannen",
        rescanButton: "Rescan starten",
        filterPlaceholder: "🔍 Videos filtern..."
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

    // Handle placeholder translations
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
}

function changeLanguage(lang) {
    setLanguage(lang);
}

// Initialize language
setLanguage(currentLang);

loadCategories();
