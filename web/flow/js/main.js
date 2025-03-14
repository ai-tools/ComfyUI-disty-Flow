import { PreferencesManager } from '/core/js/common/scripts/preferences.js';
import ThemeManager from '/core/js/common/scripts/ThemeManager.js';
import injectStylesheet from '/core/js/common/scripts/injectStylesheet.js';

let allFlows = [];
let categories = [];
let selectedCategories = new Set();
let hideDescriptions = false;
let hideTitles = false;
let favorites = new Set();
let favoritesFilterActive = false;

let hiddenFlows = new Set();
const HIDDEN_FLOWS_KEY = 'HiddenFlows';

const hiddenFlowIds = [
];

const noshowFlowIds = [
    'flupdate',
    'fltuts',
];

const FAVORITES_KEY = 'FlowFavorites';
const openInNewTab = false;

const priorityFlowIds = [
    '2m1x4',
    'afoye',
    '30kk2',
    'n0y8e',
    'yigqn',
    '12slf',
    '28s1h',
    'y2gic',
    'f9k2j',
    'k5ttn',
    '3pw8q',
    '67e3l',
    'j4wox',
    'ppfxh',
];

const categoryKeywords = [
    'Base',
    'Image to Image',
    'Image to Video',
    'Video',
    'Image',
    'Stable Diffusion',
    'Flux',
    'Flux Dev',
    'Schnell',
    'Lora',
    'VAE',
    'GGUF',
    'Pulid',
    'CogVideoX',
    'Mochi',
    'Paint',
    'Inpaint',
    'Inpainting',
    'Detailer',
    'Canvas',
    'Remover',
    'Background',
    'Depth',
];

const defaultPreferences = {
    selectedCategories: [],
    favoritesFilterActive: false,
    hideDescriptions: false,
    hideTitles: false,
    sortValue: 'nameAsc',
    showHiddenOnly: false, 
    selectedTheme: null 
};

// injectStylesheet('/flow/css/main.css', 'main');
// injectStylesheet('/core/css/themes.css', 'themes-stylesheet');
const preferencesManager = new PreferencesManager(defaultPreferences);
// const themeManager = new ThemeManager(preferencesManager);
// themeManager.init();
// themeManager.addMenu();

checkForUpdate();

function loadHiddenFlows() {
    const storedHidden = localStorage.getItem(HIDDEN_FLOWS_KEY);
    if (storedHidden) {
        try {
            const parsedHidden = JSON.parse(storedHidden);
            hiddenFlows = new Set(parsedHidden);
        } catch (e) {
            console.error('Error parsing hidden flows from localStorage:', e);
            hiddenFlows = new Set();
        }
    }
    
    hiddenFlowIds.forEach(flowId => hiddenFlows.add(flowId));
    
    saveHiddenFlows(); 
}

function saveHiddenFlows() {
    localStorage.setItem(HIDDEN_FLOWS_KEY, JSON.stringify(Array.from(hiddenFlows)));
}

function isHidden(flowId) {
    return hiddenFlows.has(flowId);
}

function toggleHidden(flowId, button) {
    if (hiddenFlows.has(flowId)) {
        hiddenFlows.delete(flowId);
        button.classList.remove('hidden');
        button.innerHTML = '<i class="fas fa-eye-slash" aria-label="Hide Flow"></i>';  
    } else {
        hiddenFlows.add(flowId);
        button.classList.add('hidden');
        button.innerHTML = '<i class="fas fa-eye" aria-label="Unhide Flow"></i>'; 
    }
    saveHiddenFlows();
    animateFlowReorder();
}
 
function loadFavorites() {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
        try {
            const parsedFavorites = JSON.parse(storedFavorites);
            favorites = new Set(parsedFavorites);
        } catch (e) {
            console.error('Error parsing favorites from localStorage:', e);
            favorites = new Set();
        }
    }
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
}

function isFavorited(flowId) {
    return favorites.has(flowId);
}

function toggleFavorite(flowId, button) {
    if (favorites.has(flowId)) {
        favorites.delete(flowId);
        button.classList.remove('favorited');
        button.innerHTML = '<i class="far fa-star"></i>';
    } else {
        favorites.add(flowId);
        button.classList.add('favorited');
        button.innerHTML = '<i class="fas fa-star"></i>';
    }
    saveFavorites();
    animateFlowReorder();
}

const createElement = (type, className, textContent = '') => {
    const element = document.createElement(type);
    element.className = className;
    element.textContent = textContent;
    return element;
};

function createFlowCard(flow) {
     if (noshowFlowIds.includes(flow.id)) {
        return null; 
    }

    const card = createElement('a', 'flow-card');
    card.href = `flow/${flow.url}`;
   
    if (flow.url === 'linker') {
        card.target = "_blank";
        card.rel = "noopener noreferrer";
    } else if (openInNewTab) {
        card.target = "_blank";
        card.rel = "noopener noreferrer";
    }

    let thumbnailUrl = `flow/${flow.url}/media/thumbnail.jpg`;
    let defaultThumbnail = '/core/media/ui/flow_logo.png';
    let avatarUrl = `flow/${flow.url}/media/avatar.jpg`;
    
     const hiddenButton = document.createElement('button');
    hiddenButton.classList.add('hidden-button');
    hiddenButton.setAttribute('aria-label', isHidden(flow.id) ? 'Unhide Flow' : 'Hide Flow');
    hiddenButton.innerHTML = isHidden(flow.id) ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    if (isHidden(flow.id)) {
        hiddenButton.classList.add('hidden');
    }

    hiddenButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleHidden(flow.id, hiddenButton);
        // card.remove();
    });
    const favoriteButton = document.createElement('button');
    favoriteButton.classList.add('favorite-button');
    favoriteButton.innerHTML = isFavorited(flow.id) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    if (isFavorited(flow.id)) {
        favoriteButton.classList.add('favorited');
    }

    favoriteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(flow.id, favoriteButton);
    });

    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
    
    const avatarImage = avatarUrl
        ? `<div class="avatar-container">
            <img src="${sanitizeHTML(avatarUrl)}" alt="${sanitizeHTML(flow.name)} Avatar" class="avatar-image" onerror="this.style.display='none';">
        </div>`
        : '';
    
    const authorBadge = (flow.author && avatarUrl)
        ? `<div class="author-badge">
            ${avatarImage}
            <div class="author-name">${sanitizeHTML(flow.author)}</div>
        </div>`
        : '';
    
    card.innerHTML = `
        <img src="${sanitizeHTML(thumbnailUrl)}" alt="${sanitizeHTML(flow.name)} Thumbnail" onerror="this.onerror=null; this.src='${sanitizeHTML(defaultThumbnail)}';" class="thumbnail-image">
        
        <div class="flow-card-content">
            <h3 class="flow-title">${sanitizeHTML(flow.name)}</h3>
            <p class="flow-description">${sanitizeHTML(flow.description)}</p>
        </div>
        ${authorBadge}
    `;
    
    card.appendChild(favoriteButton);
    card.appendChild(hiddenButton);
    card.dataset.flowId = flow.id;
    return card;
}

function extractCategories(name) {
    const categories = new Set();
    const words = name.split(/[\s-]+/);
    
    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= words.length; j++) {
            const phrase = words.slice(i, j).join(' ');
            if (categoryKeywords.includes(phrase)) {
                categories.add(phrase);
            }
        }
    }

    words.forEach(word => {
        if (categoryKeywords.includes(word)) {
            categories.add(word);
        }
    });

    if (categories.size === 0) {
        categories.add('Other');
    }

    return Array.from(categories);
}

function assignCategories(flows) {
    return flows.map(flow => {
        flow.categories = extractCategories(flow.name);
        return flow;
    });
}

function updateGlobalCategories(flows) {
    const categoriesSet = new Set();
    flows.forEach(flow => {
        flow.categories.forEach(category => categoriesSet.add(category));
    });
    
    categories = categoryKeywords.filter(keyword => categoriesSet.has(keyword));
    
    Array.from(categoriesSet).forEach(category => {
        if (!categories.includes(category)) {
            categories.push(category);
        }
    });
    
    return categories;
}

export async function loadFlows() {
    try {
        const response = await fetch('/flow/api/apps');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allFlows = await response.json();
        allFlows = assignCategories(allFlows);
        categories = updateGlobalCategories(allFlows);
        updateFilterMenu();
        renderFlows(filterCurrentFlows());
    } catch (error) {
        console.error('Error fetching flows:', error);
    }
}

function createToggleButtons() {
    const controlsDiv = document.querySelector('.controls');
    
    const descToggle = createElement('button', 'toggle-button');
    descToggle.id = 'descToggle';
    descToggle.innerHTML = '<i class="fas fa-bug-slash"></i>';
    descToggle.title = 'Hide Descriptions';
    
    const titleToggle = createElement('button', 'toggle-button');
    titleToggle.id = 'titleToggle';
    titleToggle.innerHTML = '<i class="fas fa-ghost"></i>';
    titleToggle.title = 'Hide Titles';
    
    controlsDiv.appendChild(descToggle);
    controlsDiv.appendChild(titleToggle);
    
    const showHiddenToggle = createElement('button', 'toggle-button');
    showHiddenToggle.id = 'showHiddenToggle';
    showHiddenToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    showHiddenToggle.title = 'Show Hidden Flows';
    
    controlsDiv.appendChild(showHiddenToggle);
    
    const favoritesToggle = createElement('button', 'toggle-button');
    favoritesToggle.id = 'favoritesToggle';
    favoritesToggle.innerHTML = '<i class="fas fa-star"></i>';
    favoritesToggle.title = 'Show Favorites';
    
    controlsDiv.appendChild(favoritesToggle);
    
    descToggle.addEventListener('click', () => toggleDescriptions(descToggle));
    titleToggle.addEventListener('click', () => toggleTitles(titleToggle, descToggle));
    showHiddenToggle.addEventListener('click', () => toggleShowHidden(showHiddenToggle)); 
    favoritesToggle.addEventListener('click', () => toggleFavoritesFilter(favoritesToggle));
    
    hideDescriptions = preferencesManager.get('hideDescriptions');
    hideTitles = preferencesManager.get('hideTitles');
    favoritesFilterActive = preferencesManager.get('favoritesFilterActive');
    showHiddenOnly = preferencesManager.get('showHiddenOnly'); 
    
    descToggle.classList.toggle('active', hideDescriptions);
    descToggle.title = hideDescriptions ? 'Show Descriptions' : 'Hide Descriptions';
    
    titleToggle.classList.toggle('active', hideTitles);
    titleToggle.title = hideTitles ? 'Show Titles' : 'Hide Titles';
    
    favoritesToggle.classList.toggle('active', favoritesFilterActive);
    favoritesToggle.title = favoritesFilterActive ? 'Show All Flows' : 'Show Favorites';
    
    showHiddenToggle.classList.toggle('active', showHiddenOnly);
    showHiddenToggle.title = showHiddenOnly ? 'Show All Flows' : 'Show Hidden Flows';
    showHiddenToggle.innerHTML = showHiddenOnly ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

function toggleFavoritesFilter(button) {
    favoritesFilterActive = !favoritesFilterActive;
    preferencesManager.set('favoritesFilterActive', favoritesFilterActive);
    button.classList.toggle('active', favoritesFilterActive);
    button.title = favoritesFilterActive ? 'Show All Flows' : 'Show Favorites';
    renderFlows(filterCurrentFlows());
}

function toggleDescriptions(button) {
    if (hideTitles) {
        return;
    }
    hideDescriptions = !hideDescriptions;
    preferencesManager.set('hideDescriptions', hideDescriptions);
    button.classList.toggle('active', hideDescriptions);
    button.title = hideDescriptions ? 'Show Descriptions' : 'Hide Descriptions';
    updateFlowCardVisibility();
}

function toggleTitles(button, descButton) {
    hideTitles = !hideTitles;
    preferencesManager.set('hideTitles', hideTitles);
    button.classList.toggle('active', hideTitles);
    button.title = hideTitles ? 'Show Titles' : 'Hide Titles';
    
    if (hideTitles) {
        hideDescriptions = true;
        preferencesManager.set('hideDescriptions', hideDescriptions);
        descButton.classList.add('active');
        descButton.title = 'Show Descriptions';
        descButton.disabled = true;
        descButton.style.cursor = 'not-allowed';
    } else {
        descButton.disabled = false;
        descButton.style.cursor = 'pointer';
        descButton.classList.toggle('active', hideDescriptions);
        descButton.title = hideDescriptions ? 'Show Descriptions' : 'Hide Descriptions';
    }
    
    updateFlowCardVisibility();
}

let showHiddenOnly = false;
function toggleShowHidden(button) {
    showHiddenOnly = !showHiddenOnly;
    preferencesManager.set('showHiddenOnly', showHiddenOnly);
    
    button.classList.toggle('active', showHiddenOnly);
    button.title = showHiddenOnly ? 'Show All Flows' : 'Show Hidden Flows';
    button.innerHTML = showHiddenOnly ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    
    renderFlows(filterCurrentFlows());
}

function updateFlowCardVisibility() {
    const flowCards = document.querySelectorAll('.flow-card');
    flowCards.forEach(card => {
        const title = card.querySelector('.flow-title');
        const description = card.querySelector('.flow-description');
        
        if (title) title.style.display = hideTitles ? 'none' : 'block';
        if (description) description.style.display = (hideTitles || hideDescriptions) ? 'none' : 'block';
    });
}

function filterCurrentFlows() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortValue = preferencesManager.get('sortValue') || 'nameAsc';
    let filteredFlows = filterFlows(allFlows, searchTerm, selectedCategories);
    
    if (favoritesFilterActive) {
        filteredFlows = filteredFlows.filter(flow => isFavorited(flow.id));
    }

    if (showHiddenOnly) {
        filteredFlows = filteredFlows.filter(flow => isHidden(flow.id));
    } else {
        filteredFlows = filteredFlows.filter(flow => !isHidden(flow.id));
    }

    filteredFlows = filteredFlows.filter(flow => !noshowFlowIds.includes(flow.id));

    filteredFlows = sortFlows(filteredFlows, sortValue);
    return filteredFlows;
}

function renderFlows(flows) {
    const flowGrid = document.getElementById('flowGrid');
    flowGrid.innerHTML = '';
    flows.forEach(flow => {
        if (flow.id !== 'menu') {
            const flowCard = createFlowCard(flow);
            if (flowCard) { 
                flowGrid.appendChild(flowCard);
            }
        }
    });
    updateFlowCardVisibility();
}

function animateFlowReorder() {
    const flowGrid = document.getElementById('flowGrid');
    const oldPositions = new Map();
    Array.from(flowGrid.children).forEach(card => {
        const rect = card.getBoundingClientRect();
        oldPositions.set(card.dataset.flowId, rect);
    });

    renderFlows(filterCurrentFlows());

    Array.from(flowGrid.children).forEach(card => {
        const oldRect = oldPositions.get(card.dataset.flowId);
        const newRect = card.getBoundingClientRect();

        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;
        card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        card.offsetHeight;
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = '';
    });

    setTimeout(() => {
        Array.from(flowGrid.children).forEach(card => {
            card.style.transition = '';
            card.style.transform = '';
        });
    }, 500);
}

export function initializeMenu() {
    const categoryElements = document.querySelectorAll('.menu-category > span');
    categoryElements.forEach(category => {
        category.addEventListener('click', () => {
            const submenu = category.nextElementSibling;
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });
    });
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(() => {
        const filteredFlows = filterCurrentFlows();
        renderFlows(filteredFlows);
    }, 300));
    
    const initialSearchTerm = searchInput.value.toLowerCase();
    if (initialSearchTerm) {
        renderFlows(filterCurrentFlows());
    }
}

function initializeSorting() {
    const sortSelect = document.getElementById('sortSelect');
    const savedSortValue = preferencesManager.get('sortValue') || 'nameAsc';
    sortSelect.value = savedSortValue;
    
    sortSelect.addEventListener('change', () => {
        const newSortValue = sortSelect.value;
        preferencesManager.set('sortValue', newSortValue);
        const filteredFlows = filterCurrentFlows();
        renderFlows(filteredFlows);
    });
}

function sortFlows(flows, sortValue) {
    let sortedFlows = [...flows];
    
    switch(sortValue) {
        case 'nameAsc':
            sortedFlows.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'nameDesc':
            sortedFlows.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'categoryAsc':
            sortedFlows.sort((a, b) => {
                const catA = a.categories[0];
                const catB = b.categories[0];
                const indexA = categories.indexOf(catA);
                const indexB = categories.indexOf(catB);
                return indexA - indexB || a.name.localeCompare(b.name);
            });
            break;
        case 'categoryDesc':
            sortedFlows.sort((a, b) => {
                const catA = a.categories[0];
                const catB = b.categories[0];
                const indexA = categories.indexOf(catA);
                const indexB = categories.indexOf(catB);
                return indexB - indexA || a.name.localeCompare(b.name);
            });
            break;
    }

    const topPriorityIds = [
        // 'flupdate', 
        // 'fltuts'
    ];
    const topPriorityFlows = [];
    const remainingFlows = [];
    
    sortedFlows.forEach(flow => {
        if (topPriorityIds.includes(flow.id)) {
            topPriorityFlows.push(flow);
        } else {
            remainingFlows.push(flow);
        }
    });
    
    topPriorityFlows.sort((a, b) => {
        return topPriorityIds.indexOf(a.id) - topPriorityIds.indexOf(b.id);
    });

    const favoriteFlows = [];
    const nonFavoriteFlows = [];

    remainingFlows.forEach(flow => {
        if (isFavorited(flow.id)) {
            favoriteFlows.push(flow);
        } else {
            nonFavoriteFlows.push(flow);
        }
    });

    const otherPriorityIds = priorityFlowIds.filter(id => !topPriorityIds.includes(id));
    const otherPriorityFlows = [];
    const restFlows = [];

    nonFavoriteFlows.forEach(flow => {
        if (otherPriorityIds.includes(flow.id)) {
            otherPriorityFlows.push(flow);
        } else {
            restFlows.push(flow);
        }
    });

    otherPriorityFlows.sort((a, b) => {
        return otherPriorityIds.indexOf(a.id) - otherPriorityIds.indexOf(b.id);
    });

    sortedFlows = [...topPriorityFlows, ...favoriteFlows, ...otherPriorityFlows, ...restFlows];

    return sortedFlows;
}

function updateFilterMenu() {
    const filterContent = document.getElementById('filterContent');
    filterContent.innerHTML = '';
    categories.forEach(category => {
        const tag = createElement('div', 'category-tag', category);
        if (preferencesManager.get('selectedCategories').includes(category)) {
            selectedCategories.add(category);
            tag.classList.add('selected');
        }
        tag.addEventListener('click', () => toggleCategory(category, tag));
        filterContent.appendChild(tag);
    });
}

function toggleCategory(category, tag) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
        tag.classList.remove('selected');
    } else {
        selectedCategories.add(category);
        tag.classList.add('selected');
    }
    preferencesManager.set('selectedCategories', Array.from(selectedCategories));
    const filteredFlows = filterCurrentFlows();
    renderFlows(filteredFlows);
}

function filterFlows(flows, searchTerm, selectedCategories) {
    return flows.filter(flow => 
        (flow.name.toLowerCase().includes(searchTerm) || 
         flow.description.toLowerCase().includes(searchTerm) ||
         flow.categories.some(category => category.toLowerCase().includes(searchTerm))) &&
        (selectedCategories.size === 0 || flow.categories.some(category => selectedCategories.has(category)))
    );
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initializeFilterMenu() {
    const filterButton = document.getElementById('filterButton');
    const filterContent = document.getElementById('filterContent');

    filterButton.addEventListener('click', () => {
        filterContent.classList.toggle('show');
        filterButton.classList.toggle('active');
    });

    window.addEventListener('click', (event) => {
        if (!event.target.matches('.filter-button') && !event.target.closest('.filter-content')) {
            filterContent.classList.remove('show');
            filterButton.classList.remove('active');
        }
    });

    const initialSelectedCategories = preferencesManager.get('selectedCategories');
    if (Array.isArray(initialSelectedCategories)) {
        initialSelectedCategories.forEach(category => {
            selectedCategories.add(category);
            const tag = Array.from(document.querySelectorAll('.category-tag')).find(tag => tag.textContent === category);
            if (tag) tag.classList.add('selected');
        });
    }
}

function initializeHiddenFlows() {
    loadHiddenFlows();
}

export function initializeUI() {
    loadFavorites();
    initializeHiddenFlows();
    initializeMenu();
    initializeSearch();
    initializeSorting();
    initializeFilterMenu();
    createToggleButtons();
    loadFlows();
    showVersion();
}

export async function getVersion() {
    try {
        const response = await fetch('/flow/api/flow-version');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const versionData = await response.json();
        return versionData.version; 
    } catch (error) {
        console.error('Error fetching version:', error);
        throw error; 
    }
}

export async function showVersion() {
    const currentVersion = await getVersion();
    document.getElementById('copyright').innerText = currentVersion
}

function isNewerVersion(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const curr = currentParts[i] || 0;
        const lat = latestParts[i] || 0;
        if (lat > curr) return true;
        if (lat < curr) return false;
    }
    return false;
}

function createFloatingCharacter(currentVersion) {
    const floatingHTML = `
        <div class="floating-update-character">
            <img src="/core/media/ui/update_logo.png" alt="Update Character" />
            <div class="update-indicator">
                <span class="update-dot"></span>
                <span class="version-label">${currentVersion}</span>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingHTML);

    const floatingCharacter = document.querySelector('.floating-update-character');
    return floatingCharacter;
}

function showUpdateDialog(currentVersion, latestVersion) {
    const dialogHTML = `
        <div class="update-dialog-overlay">
            <div class="update-dialog-container">
                <div class="update-character">
                    <img src="/core/media/ui/update_logo.png" alt="Update Avatar" />
                </div>
                <div class="update-dialog">
                    <div class="update-content">
                        <h2>New Update Available!</h2>
                        <p>Version ${latestVersion} is ready to install</p>
                        <p class="version-info">Current version: ${currentVersion}</p>
                        
                        <div class="update-actions">
                            <button class="update-now-btn">
                                <span class="btn-text">Send me to ComfyUI to Update Now</span>
                                <span class="btn-icon">→</span>
                            </button>
                            <button class="remind-later-btn">Later</button>
                        </div>
                    </div>
                </div>
                <button class="close-dialog-btn" aria-label="Close">&times;</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    const overlay = document.querySelector('.update-dialog-overlay');
    const updateNowBtn = document.querySelector('.update-now-btn');
    const remindLaterBtn = document.querySelector('.remind-later-btn');
    const closeBtn = document.querySelector('.close-dialog-btn');

    function closeDialog() {
        overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => overlay.remove(), 300); 
    }

    updateNowBtn.addEventListener('click', () => {
        const origin = window.location.origin;
        // const path = '/flow';
        const urlToOpen = `${origin}`;
        window.open(urlToOpen, '_blank');
        closeDialog();
        setFloatingCharacter(currentVersion, latestVersion)
    });

    remindLaterBtn.addEventListener('click', () => {
        // localStorage.setItem('lastUpdateReminder', Date.now());
        closeDialog();
        setFloatingCharacter(currentVersion, latestVersion)
    });

    closeBtn.addEventListener('click', () => {
        closeDialog();
        setFloatingCharacter(currentVersion, latestVersion)
    });
}

function setFloatingCharacter(currentVersion, latestVersion) {
    if (isNewerVersion(currentVersion, latestVersion)) {
        if (!document.querySelector('.floating-update-character')) {
            const floatingCharacter = createFloatingCharacter(`New Update Available!`);
            
            floatingCharacter.addEventListener('click', () => {

                floatingCharacter.style.animation = 'moveUp  0.3s ease-out forwards';
                
                setTimeout(() => {
                    showUpdateDialog(currentVersion, latestVersion);
                    floatingCharacter.remove();
                }, 300);
            });
        }
    }
}

async function checkForUpdate() {
    try {
        const currentVersion = await getVersion();
        const rawURL = 'https://raw.githubusercontent.com/diStyApps/ComfyUI-disty-Flow/main/pyproject.toml';
        
        const response = await fetch(rawURL);
        if (!response.ok) {
            throw new Error(`Failed to fetch version info. HTTP status: ${response.status}`);
        }

        const tomlText = await response.text();
        const versionMatch = tomlText.match(/^version\s*=\s*"([^"]+)"/m);
        
        if (!versionMatch || versionMatch.length < 2) {
            throw new Error('Version information not found in pyproject.toml.');
        }

        const latestVersion = versionMatch[1];
        
        setFloatingCharacter(currentVersion, latestVersion)

    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}
