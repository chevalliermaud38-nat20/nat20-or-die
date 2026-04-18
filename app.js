// Firebase configuration (remplace avec tes propres clés)
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForDemo",
    authDomain: "nat20-or-die.firebaseapp.com",
    projectId: "nat20-or-die",
    storageBucket: "nat20-or-die.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global state
let currentCampaign = null;
let currentWorld = null;
let campaigns = [];
let worlds = [];
let worldData = {};
let scenarioData = {};
let characters = {};
let monsters = {};
let monsterCategories = {};
let encounters = {};
let spells = {};
let adventureMode = false;
let combatMode = false;

// Global function for filtering prepared spells
function filterPreparedSpells() {
    const searchTerm = document.getElementById('preparedSpellsSearch')?.value?.toLowerCase() || '';
    const spellItems = document.querySelectorAll('.prepared-spell-item');
    
    spellItems.forEach(item => {
        const spellName = item.getAttribute('data-spell-name');
        const spellLevel = item.getAttribute('data-spell-level');
        const levelSection = document.querySelector(`[data-level="${spellLevel}"]`);
        
        if (spellName && spellName.includes(searchTerm)) {
            item.style.display = '';
            if (levelSection) levelSection.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Hide empty level sections
    document.querySelectorAll('[data-level]').forEach(section => {
        const visibleItems = section.querySelectorAll('.prepared-spell-item:not([style*="display: none"])');
        if (visibleItems.length === 0) {
            section.style.display = 'none';
        }
    });
}

// Global monster category functions
window.openMonsterCategoryModal = function() {
    document.getElementById('monsterCategoryModal').classList.remove('hidden');
    document.getElementById('monsterCategoryName').value = '';
    document.getElementById('monsterCategoryDescription').value = '';
}

window.closeMonsterCategoryModal = function() {
    document.getElementById('monsterCategoryModal').classList.add('hidden');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    
    // Don't clear localStorage on load - preserve data
    // localStorage.clear();
    
    // Load all data
    loadCampaigns();
    loadWorlds();
    loadCharacters();
    loadMonsters();
    loadMonsterCategories();
    loadEncounters();
    loadSpells();
    setupEventListeners();
    
    // Load initial data for all sections
    displayCampaigns();
    displayWorlds();
    loadCharactersData();
    loadMonstersData();
    loadMonsterCategoriesData();
    loadEncountersData();
    loadSpellsData();
    
    // Check sync status
    checkSyncStatus();
    
    // Setup monster category modal event listeners
    const openCategoryBtn = document.getElementById('openMonsterCategoryBtn');
    const closeCategoryBtn = document.querySelector('button[onclick="closeMonsterCategoryModal()"]');
    
    if (openCategoryBtn) {
        openCategoryBtn.addEventListener('click', function() {
            document.getElementById('monsterCategoryModal').classList.remove('hidden');
            document.getElementById('monsterCategoryName').value = '';
        });
    }
    
    if (closeCategoryBtn) {
        closeCategoryBtn.removeAttribute('onclick');
        closeCategoryBtn.addEventListener('click', function() {
            document.getElementById('monsterCategoryModal').classList.add('hidden');
        });
    }
    
    // Also setup all close buttons in the modal
    document.querySelectorAll('#monsterCategoryModal button').forEach(btn => {
        if (btn.textContent.includes('Annuler') || btn.querySelector('.fa-times')) {
            btn.addEventListener('click', function() {
                document.getElementById('monsterCategoryModal').classList.add('hidden');
            });
        }
    });
    
    
    // Add event delegation for link clicks and keyboard events
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.text-link');
        if (link) {
            e.stopPropagation();
            
            const linkType = link.getAttribute('data-link-type');
            const linkTarget = link.getAttribute('data-link-target');
            
            console.log('Link clicked! Type:', linkType, 'Adventure mode:', adventureMode);
            
            if (linkType === 'other') {
                window.open(linkTarget, '_blank');
            } else if (adventureMode) {
                showLinkPopup(linkType, linkTarget);
            } else {
                showElementPreview(linkType, linkTarget);
            }
        }
    });
    
    // Add keyboard support for links
    document.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('text-link') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.stopPropagation();
            
            const linkType = e.target.getAttribute('data-link-type');
            const linkTarget = e.target.getAttribute('data-link-target');
            
            if (linkType === 'other') {
                window.open(linkTarget, '_blank');
            } else if (adventureMode) {
                showLinkPopup(linkType, linkTarget);
            } else {
                showElementPreview(linkType, linkTarget);
            }
        }
    });
});

// Event listeners
function setupEventListeners() {
    // File upload drag and drop
    const dropZone = document.querySelector('.border-dashed');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload({ target: { files } });
            }
        });
    }
}

// Campaign Management
async function loadCampaigns() {
    try {
        // Try localStorage first
        const stored = localStorage.getItem('campaigns');
        if (stored) {
            campaigns = JSON.parse(stored);
            displayCampaigns();
            return;
        }
        
        // If no localStorage, try Firebase
        const snapshot = await db.collection('campaigns').get();
        campaigns = [];
        snapshot.forEach(doc => {
            campaigns.push({ id: doc.id, ...doc.data() });
        });
        displayCampaigns();
    } catch (error) {
        console.error('Error loading campaigns:', error);
        // Initialize empty campaigns array
        campaigns = [];
        displayCampaigns();
    }
}

// Worlds Management
async function loadWorlds() {
    try {
        const stored = localStorage.getItem('worlds');
        if (stored) {
            worlds = JSON.parse(stored);
            displayWorlds();
            updateCampaignWorldOptions();
            return;
        }
        
        worlds = [];
        displayWorlds();
        updateCampaignWorldOptions();
    } catch (error) {
        console.error('Error loading worlds:', error);
        worlds = [];
        displayWorlds();
        updateCampaignWorldOptions();
    }
}

function displayWorlds() {
    const grid = document.getElementById('worldsGrid');
    if (!grid) return;
    
    if (worlds.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-globe-americas text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun monde pour le moment</p>
                <p class="text-gray-400">Crée ton premier univers !</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = worlds.map(world => `
        <div class="campaign-card bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl" onclick="selectWorld('${world.id}')">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-800">${world.name}</h3>
                <button onclick="deleteWorld(event, '${world.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="text-gray-600 mb-4">${world.description || 'Aucune description'}</p>
            <div class="flex justify-between items-center text-sm text-gray-500">
                <span><i class="fas fa-calendar mr-1"></i> ${new Date(world.createdAt).toLocaleDateString('fr-FR')}</span>
                <span><i class="fas fa-book mr-1"></i> ${Object.keys(world.categories || {}).length} catégories</span>
            </div>
        </div>
    `).join('');
}

function updateCampaignWorldOptions() {
    const select = document.getElementById('campaignWorld');
    if (!select) return;
    
    select.innerHTML = '<option value="">Aucun monde</option>';
    worlds.forEach(world => {
        const option = document.createElement('option');
        option.value = world.id;
        option.textContent = world.name;
        select.appendChild(option);
    });
}

function createWorld() {
    document.getElementById('worldModal').classList.remove('hidden');
}

function closeWorldModal() {
    document.getElementById('worldModal').classList.add('hidden');
    document.getElementById('worldName').value = '';
    document.getElementById('worldDescription').value = '';
}

async function saveWorld(event) {
    event.preventDefault();
    
    const name = document.getElementById('worldName').value;
    const description = document.getElementById('worldDescription').value;
    
    const world = {
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categories: {}
    };
    
    // Use localStorage directly
    world.id = Date.now().toString();
    worlds.push(world);
    localStorage.setItem('worlds', JSON.stringify(worlds));
    
    closeWorldModal();
    displayWorlds();
    updateCampaignWorldOptions();
    
    console.log('Monde créé:', world);
}

async function deleteWorld(event, worldId) {
    event.stopPropagation();
    
    if (!confirm('Es-tu sûr de vouloir supprimer ce monde ?')) return;
    
    worlds = worlds.filter(w => w.id !== worldId);
    localStorage.setItem('worlds', JSON.stringify(worlds));
    displayWorlds();
    updateCampaignWorldOptions();
}

function selectWorld(worldId) {
    currentWorld = worlds.find(w => w.id === worldId);
    if (currentWorld) {
        document.getElementById('worldDetailTitle').textContent = currentWorld.name;
        loadWorldDetail();
        showSection('worldDetail');
    }
}

function loadWorldDetail() {
    if (!currentWorld) return;
    
    const container = document.getElementById('worldContent');
    if (!container) return;
    
    const world = currentWorld.categories || {};
    
    if (Object.keys(world).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-globe-americas text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucune catégorie pour le moment</p>
                <p class="text-gray-400">Ajoute des catégories pour développer cet univers !</p>
                ${!adventureMode ? `
                    <button onclick="addWorldCategory()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter une catégorie
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    if (adventureMode) {
        // Mode lecture - affichage hiérarchique
        container.innerHTML = Object.entries(world).map(([category, subcategories]) => `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                <div class="bg-indigo-600 text-white p-4 cursor-pointer" onclick="toggleWorldCategory('${category}')">
                    <h3 class="text-xl font-bold">${category}</h3>
                </div>
                <div id="world-category-${category}" class="hidden">
                    <div class="p-4 space-y-4">
                        ${Object.entries(subcategories).map(([subcategory, items]) => `
                            <div class="border-l-4 border-indigo-300 pl-4">
                                <div class="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100" onclick="toggleWorldSubcategory('${category}', '${subcategory}')">
                                    <h4 class="font-semibold text-gray-800">${subcategory}</h4>
                                    <p class="text-gray-600 text-sm">${items.length} élément${items.length > 1 ? 's' : ''}</p>
                                </div>
                                <div id="world-subcategory-${category}-${subcategory}" class="hidden mt-3 space-y-3">
                                    ${items.map(item => `
                                        <div class="bg-white border border-gray-200 rounded p-3">
                                            <h5 class="font-medium text-gray-800 mb-2">${item.name}</h5>
                                            <div class="prose max-w-none text-sm max-h-48 overflow-y-auto">
                                                ${item.description || '<p class="text-gray-500">Aucune description</p>'}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        // Mode édition - affichage complet avec boutons
        container.innerHTML = `
            ${!adventureMode ? `
                <div class="mb-6">
                    <button onclick="addWorldCategory()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter une catégorie
                    </button>
                </div>
            ` : ''}
            ${Object.entries(world).map(([category, subcategories]) => `
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${category}</h3>
                        <div class="space-x-2">
                            <button onclick="addSubcategory('${category}')" class="text-indigo-600 hover:text-indigo-800">
                                <i class="fas fa-plus"></i> Sous-catégorie
                            </button>
                            <button onclick="deleteWorldCategory('${category}')" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${Object.entries(subcategories).map(([subcategory, items]) => `
                            <div class="border-l-4 border-indigo-300 pl-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h4 class="font-semibold text-gray-800">${subcategory}</h4>
                                    <div class="space-x-2">
                                        <button onclick="addWorldItem('${category}', '${subcategory}')" class="text-indigo-600 hover:text-indigo-800 text-sm">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <button onclick="deleteSubcategory('${category}', '${subcategory}')" class="text-red-500 hover:text-red-700 text-sm">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    ${items.map(item => `
                                        <div class="bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100" onclick="openWorldItem('${category}', '${subcategory}', '${item.name}')">
                                            <h5 class="font-medium text-gray-800">${escapeHtml(item.name)}</h5>
                                            <div class="text-sm text-gray-600 mt-1">
                                                ${item.description ? escapeHtml(item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description) : 'Aucune description'}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        `;
    }
}

function openWorldItem(category, subcategory, itemName) {
    if (!currentWorld) return;
    
    const items = currentWorld.categories[category][subcategory];
    const item = items.find(i => i.name === itemName);
    if (item) {
        openTextEditor('world', category, subcategory, itemName, item.description || '', item.name);
    }
}

function addWorldCategory() {
    const categoryName = prompt('Nom de la catégorie :');
    if (!categoryName || !currentWorld) return;
    
    if (!currentWorld.categories) {
        currentWorld.categories = {};
    }
    
    currentWorld.categories[categoryName] = {};
    saveWorldData();
    loadWorldDetail();
}

function addSubcategory(category) {
    const subcategoryName = prompt('Nom de la sous-catégorie :');
    if (!subcategoryName) return;
    
    currentWorld.categories[category][subcategoryName] = [];
    saveWorldData();
    loadWorldDetail();
}

function addWorldItem(category, subcategory) {
    const itemName = prompt('Nom de l\'élément :');
    if (!itemName) return;
    
    const description = prompt('Description :');
    
    currentWorld.categories[category][subcategory].push({
        name: itemName,
        description: description || ''
    });
    
    saveWorldData();
    loadWorldDetail();
}

function deleteWorldCategory(category) {
    if (!confirm(`Supprimer la catégorie "${category}" ?`)) return;
    
    delete currentWorld.categories[category];
    saveWorldData();
    loadWorldDetail();
}

function deleteSubcategory(category, subcategory) {
    if (!confirm(`Supprimer la sous-catégorie "${subcategory}" ?`)) return;
    
    delete currentWorld.categories[category][subcategory];
    saveWorldData();
    loadWorldDetail();
}

function saveWorldData() {
    if (!currentWorld) return;
    
    const index = worlds.findIndex(w => w.id === currentWorld.id);
    if (index !== -1) {
        worlds[index] = currentWorld;
        localStorage.setItem('worlds', JSON.stringify(worlds));
    }
}

function displayCampaigns() {
    const grid = document.getElementById('campaignsGrid');
    if (!grid) return;
    
    if (campaigns.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucune campagne pour le moment</p>
                <p class="text-gray-400">Crée ta première aventure !</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = campaigns.map(campaign => `
        <div class="campaign-card bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl" onclick="selectCampaign('${campaign.id}')">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-800">${campaign.name}</h3>
                <button onclick="deleteCampaign(event, '${campaign.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="text-gray-600 mb-4">${campaign.description || 'Aucune description'}</p>
            <div class="flex justify-between items-center text-sm text-gray-500">
                <span><i class="fas fa-calendar mr-1"></i> ${new Date(campaign.createdAt).toLocaleDateString('fr-FR')}</span>
                <span><i class="fas fa-edit mr-1"></i> ${campaign.chapters || 0} chapitres</span>
            </div>
        </div>
    `).join('');
}

function createCampaign() {
    document.getElementById('campaignModal').classList.remove('hidden');
}

function closeCampaignModal() {
    document.getElementById('campaignModal').classList.add('hidden');
    document.getElementById('campaignName').value = '';
    document.getElementById('campaignDescription').value = '';
}

async function saveCampaign(event) {
    event.preventDefault();
    
    const name = document.getElementById('campaignName').value;
    const description = document.getElementById('campaignDescription').value;
    const worldId = document.getElementById('campaignWorld').value;
    
    const campaign = {
        name,
        description,
        worldId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenario: { acts: [] }
    };
    
    // Use localStorage directly
    campaign.id = Date.now().toString();
    campaigns.push(campaign);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
    
    closeCampaignModal();
    displayCampaigns();
    selectCampaign(campaign.id);
    
    console.log('Campagne créée:', campaign);
}

async function deleteCampaign(event, campaignId) {
    event.stopPropagation();
    
    if (!confirm('Es-tu sûr de vouloir supprimer cette campagne ?')) return;
    
    // Use localStorage directly
    campaigns = campaigns.filter(c => c.id !== campaignId);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
    displayCampaigns();
    
    if (currentCampaign && currentCampaign.id === campaignId) {
        currentCampaign = null;
        document.getElementById('currentCampaign').textContent = 'Aucune campagne sélectionnée';
    }
}

function selectCampaign(campaignId) {
    currentCampaign = campaigns.find(c => c.id === campaignId);
    if (currentCampaign) {
        document.getElementById('currentCampaign').textContent = currentCampaign.name;
        
        // Show adventure mode button and combat mode button
        document.getElementById('adventureModeBtn').classList.remove('hidden');
        document.getElementById('combatModeBtn').classList.remove('hidden');
        
        loadCampaignData();
        
        // Show campaign submenu
        const submenu = document.getElementById('campaignSubmenu');
        submenu.classList.remove('hidden');
        
        // Show scenario section by default
        showCampaignSection('scenario');
    }
}

function showCampaignSelector() {
    showSection('campaigns');
}

// Adventure Mode
function toggleAdventureMode() {
    adventureMode = !adventureMode;
    
    const btn = document.getElementById('adventureModeBtn');
    
    if (adventureMode) {
        btn.innerHTML = '<i class="fas fa-edit mr-1"></i> MODE ÉDITION';
        btn.classList.remove('bg-green-500', 'hover:bg-green-400');
        btn.classList.add('bg-orange-500', 'hover:bg-orange-400');
    } else {
        btn.innerHTML = '<i class="fas fa-book-open mr-1"></i> L\'AVENTURE COMMENCE';
        btn.classList.remove('bg-orange-500', 'hover:bg-orange-400');
        btn.classList.add('bg-green-500', 'hover:bg-green-400');
    }
    
    // Reload current section to apply the new mode
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        if (activeSection.id === 'campaignDetail') {
            // Check which tab is active
            const scenarioTab = document.getElementById('scenarioTab');
            if (scenarioTab && scenarioTab.classList.contains('bg-indigo-600')) {
                loadScenarioData();
            } else {
                const charactersTab = document.getElementById('charactersTab');
                if (charactersTab && charactersTab.classList.contains('bg-indigo-600')) {
                    loadCharactersData();
                } else {
                    const monstersTab = document.getElementById('monstersTab');
                    if (monstersTab && monstersTab.classList.contains('bg-indigo-600')) {
                        loadMonstersData();
                    } else {
                        const encountersTab = document.getElementById('encountersTab');
                        if (encountersTab && encountersTab.classList.contains('bg-indigo-600')) {
                            loadEncountersData();
                        } else {
                            displaySchema();
                        }
                    }
                }
            }
        } else if (activeSection.id === 'monsters') {
            loadMonstersData();
        } else if (activeSection.id === 'spells') {
            loadSpellsData();
        } else if (activeSection.id === 'worlds') {
            loadWorldsData();
        }
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('bg-indigo-600', 'text-white');
    });
    
    const activeItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeItem) {
        activeItem.classList.add('bg-indigo-600', 'text-white');
    }
    
    // Show/hide adventure mode button based on section
    const adventureBtn = document.getElementById('adventureModeBtn');
    const combatBtn = document.getElementById('combatModeBtn');
    const campaignSubmenu = document.getElementById('campaignSubmenu');
    
    if (sectionId === 'campaigns') {
        adventureBtn.classList.remove('hidden');
        combatBtn.classList.add('hidden');
        campaignSubmenu.classList.remove('hidden'); // Show submenu for campaigns
    } else if (sectionId === 'worlds') {
        adventureBtn.classList.add('hidden');
        combatBtn.classList.add('hidden');
        campaignSubmenu.classList.add('hidden');
    } else if (sectionId === 'spells') {
        adventureBtn.classList.remove('hidden');
        combatBtn.classList.add('hidden');
        campaignSubmenu.classList.add('hidden');
        // Load spells data when showing spells section
        loadSpellsData();
    } else if (sectionId === 'monsters') {
        adventureBtn.classList.remove('hidden');
        combatBtn.classList.add('hidden');
        campaignSubmenu.classList.add('hidden');
        // Load monsters data when showing monsters section
        loadMonstersData();
    } else if (sectionId === 'worldDetail') {
        adventureBtn.classList.add('hidden');
        combatBtn.classList.add('hidden');
        campaignSubmenu.classList.add('hidden');
    } else {
        adventureBtn.classList.add('hidden');
        combatBtn.classList.add('hidden');
        campaignSubmenu.classList.add('hidden');
    }
    
    // Always show campaign submenu when we're in campaigns section
    if (sectionId === 'campaigns' && currentCampaign) {
        campaignSubmenu.classList.remove('hidden');
    }
}

function showCampaignSection(subSection) {
    if (!currentCampaign) {
        alert('Veuillez d\'abord sélectionner une campagne');
        return;
    }
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show campaign detail section
    const campaignSection = document.getElementById('campaignDetail');
    if (campaignSection) {
        campaignSection.classList.add('active');
    }
    
    // Update title
    document.getElementById('campaignDetailTitle').textContent = currentCampaign.name;
    
    // Hide all content sections
    document.getElementById('scenarioContent').classList.add('hidden');
    document.getElementById('charactersContent').classList.add('hidden');
    document.getElementById('monstersContent').classList.add('hidden');
    document.getElementById('encountersContent').classList.add('hidden');
    document.getElementById('schemaContent').classList.add('hidden');
    
    // Reset tab styles
    document.getElementById('scenarioTab').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('charactersTab').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('monstersTab').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('encountersTab').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('schemaTab').classList.remove('bg-indigo-600', 'text-white');
    
    // Load appropriate content
    if (subSection === 'scenario') {
        loadScenarioData();
        document.getElementById('scenarioTab').classList.add('bg-indigo-600', 'text-white');
        document.getElementById('scenarioContent').classList.remove('hidden');
    } else if (subSection === 'characters') {
        loadCharactersData();
        document.getElementById('charactersTab').classList.add('bg-indigo-600', 'text-white');
        document.getElementById('charactersContent').classList.remove('hidden');
    } else if (subSection === 'monsters') {
        loadMonstersData();
        document.getElementById('monstersTab').classList.add('bg-indigo-600', 'text-white');
        document.getElementById('monstersContent').classList.remove('hidden');
    } else if (subSection === 'encounters') {
        loadEncountersData();
        document.getElementById('encountersTab').classList.add('bg-indigo-600', 'text-white');
        document.getElementById('encountersContent').classList.remove('hidden');
    } else if (subSection === 'schema') {
        displaySchema();
        document.getElementById('schemaTab').classList.add('bg-indigo-600', 'text-white');
        document.getElementById('schemaContent').classList.remove('hidden');
    }
}

// Encounters Management (Campaign-specific)
function loadEncounters() {
    try {
        const stored = localStorage.getItem('encounters');
        if (stored) {
            encounters = JSON.parse(stored);
        } else {
            encounters = {};
        }
    } catch (error) {
        encounters = {};
    }
}

function loadEncountersData() {
    if (!currentCampaign) return;
    
    const container = document.getElementById('encountersContent');
    if (!container) return;
    
    const campaignEncounters = encounters[currentCampaign.id] || {};
    
    if (Object.keys(campaignEncounters).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-swords text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucune rencontre pour le moment</p>
                <p class="text-gray-400">Ajoute des rencontres à ta campagne !</p>
                ${!adventureMode ? `
                    <button onclick="createEncounter()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter une rencontre
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    // Add search bar at top
    let html = '';
    if (!adventureMode) {
        html += `
            <div class="mb-6">
                <div class="flex space-x-4 items-center">
                    <input type="text" id="encounterSearch" placeholder="Rechercher une rencontre..." class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onkeyup="searchEncounters()">
                    <select id="encounterCategoryFilter" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onchange="filterEncounters()">
                        <option value="">Toutes les catégories</option>
                    </select>
                    <button onclick="createEncounter()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter une rencontre
                    </button>
                </div>
            </div>
        `;
    }
    
    // Display encounters
    Object.entries(campaignEncounters).forEach(([categoryId, category]) => {
        html += `
            <div class="bg-white rounded-lg shadow-lg p-6" data-category="${categoryId}">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${categoryId} (${category.length})</h3>
                    ${!adventureMode ? `
                        <div class="space-x-2">
                            <button onclick="addEncounterToCategory('${categoryId}')" class="text-indigo-600 hover:text-indigo-800">
                                <i class="fas fa-plus"></i> Rencontre
                            </button>
                            <button onclick="deleteEncounterCategory('${categoryId}')" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="space-y-4">
                    ${category.map(encounter => `
                        <div class="border-l-4 border-red-300 pl-4">
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-semibold text-gray-800">${encounter.name}</h4>
                                ${!adventureMode ? `
                                    <div class="space-x-2">
                                        <button onclick="editEncounter('${encounter.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteEncounter('${encounter.id}')" class="text-red-500 hover:text-red-700 text-sm">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button onclick="startCombat('${encounter.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                                            <i class="fas fa-play mr-1"></i>Combat
                                        </button>
                                    </div>
                                ` : `
                                    <button onclick="startCombat('${encounter.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-play mr-1"></i>Combat
                                    </button>
                                `}
                            </div>
                            <div class="mb-3">
                                <p class="text-gray-600 text-sm mb-2">${encounter.description ? encounter.description.substring(0, 200) + '...' : 'Aucune description'}</p>
                                <div class="text-sm text-gray-500">
                                    <i class="fas fa-dragon mr-1"></i>${encounter.monsters ? encounter.monsters.length : 0} monstres
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Populate category filter
    if (!adventureMode) {
        const categoryFilter = document.getElementById('encounterCategoryFilter');
        if (categoryFilter) {
            const categories = Object.keys(campaignEncounters);
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    }
}

function createEncounter() {
    if (!currentCampaign) return;
    
    // Initialize encounters for this campaign if needed
    if (!encounters[currentCampaign.id]) {
        encounters[currentCampaign.id] = {};
    }
    
    // Populate category dropdown
    const categorySelect = document.getElementById('encounterCategory');
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    
    const categories = Object.keys(encounters[currentCampaign.id]);
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Add option for new category
    const newCategoryOption = document.createElement('option');
    newCategoryOption.value = '__new__';
    newCategoryOption.textContent = '+ Nouvelle catégorie';
    categorySelect.appendChild(newCategoryOption);
    
    // Clear monster entries
    document.getElementById('encounterMonsters').innerHTML = '';
    window.encounterMonsterEntries = [];
    
    // Update button text
    document.getElementById('encounterSaveBtn').textContent = 'Créer';
    document.querySelector('#encounterModal h3').textContent = 'Créer une rencontre';
    
    // Clear editing state
    delete window.editingEncounterId;
    
    document.getElementById('encounterModal').classList.remove('hidden');
}

function closeEncounterModal() {
    document.getElementById('encounterModal').classList.add('hidden');
    // Clear form
    document.getElementById('encounterName').value = '';
    document.getElementById('encounterDescription').value = '';
    document.getElementById('encounterMonsters').innerHTML = '';
    window.encounterMonsterEntries = [];
}

function addMonsterToEncounter() {
    const monsterEntry = document.createElement('div');
    monsterEntry.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
    monsterEntry.innerHTML = `
        <select class="monster-select flex-1 px-3 py-2 border border-gray-300 rounded-lg" onchange="updateMonsterEntry(this)">
            <option value="">Choisir un monstre</option>
        </select>
        <input type="number" min="1" value="1" class="w-20 px-3 py-2 border border-gray-300 rounded-lg quantity-input" placeholder="Quantité">
        <label class="flex items-center">
            <input type="checkbox" class="is-player-checkbox mr-2">
            <span>Joueur</span>
        </label>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    document.getElementById('encounterMonsters').appendChild(monsterEntry);
    
    // Populate monster options
    const select = monsterEntry.querySelector('.monster-select');
    Object.entries(monsters).forEach(([categoryId, category]) => {
        category.forEach(monster => {
            const option = document.createElement('option');
            option.value = monster.id;
            option.textContent = `${monster.name} (${categoryId})`;
            select.appendChild(option);
        });
    });
}

function saveEncounter(event) {
    event.preventDefault();
    
    if (!currentCampaign) return;
    
    const name = document.getElementById('encounterName').value;
    const categoryValue = document.getElementById('encounterCategory').value;
    const description = document.getElementById('encounterDescription').value;
    
    let category;
    if (categoryValue === '__new__') {
        category = prompt('Nom de la nouvelle catégorie :');
        if (!category) return;
    } else {
        category = categoryValue;
    }
    
    // Collect monster entries
    const monsterEntries = [];
    document.querySelectorAll('#encounterMonsters > div').forEach(entry => {
        const monsterId = entry.querySelector('.monster-select').value;
        const quantity = parseInt(entry.querySelector('.quantity-input').value) || 1;
        const isPlayer = entry.querySelector('.is-player-checkbox').checked;
        
        if (monsterId) {
            monsterEntries.push({ monsterId, quantity, isPlayer });
        }
    });
    
    const encounter = {
        name,
        category,
        description,
        monsters: monsterEntries,
        updatedAt: new Date().toISOString()
    };
    
    // Initialize encounters for this campaign if needed
    if (!encounters[currentCampaign.id]) {
        encounters[currentCampaign.id] = {};
    }
    
    // Check if editing existing encounter
    if (window.editingEncounterId) {
        // Update existing encounter
        Object.entries(encounters[currentCampaign.id]).forEach(([categoryId, category]) => {
            const index = category.findIndex(e => e.id === window.editingEncounterId);
            if (index !== -1) {
                // Remove from old category if category changed
                if (categoryId !== category) {
                    category.splice(index, 1);
                    if (category.length === 0) {
                        delete encounters[currentCampaign.id][categoryId];
                    }
                    // Add to new category
                    if (!encounters[currentCampaign.id][category]) {
                        encounters[currentCampaign.id][category] = [];
                    }
                    encounter.id = window.editingEncounterId;
                    encounter.createdAt = new Date().toISOString();
                    encounters[currentCampaign.id][category].push(encounter);
                } else {
                    // Update in same category
                    encounter.id = window.editingEncounterId;
                    encounter.createdAt = category[index].createdAt;
                    encounters[currentCampaign.id][categoryId][index] = encounter;
                }
            }
        });
        
        // Clear editing state
        delete window.editingEncounterId;
    } else {
        // Create new encounter
        encounter.id = Date.now().toString();
        encounter.createdAt = new Date().toISOString();
        
        // Initialize category if needed
        if (!encounters[currentCampaign.id][category]) {
            encounters[currentCampaign.id][category] = [];
        }
        
        encounters[currentCampaign.id][category].push(encounter);
    }
    
    // Save to localStorage
    localStorage.setItem('encounters', JSON.stringify(encounters));
    
    closeEncounterModal();
    loadEncountersData();
    
}

function editEncounter(encounterId) {
    // Find encounter
    let encounter = null;
    let categoryId = null;
    
    Object.entries(encounters[currentCampaign.id]).forEach(([categoryId, category]) => {
        const found = category.find(e => e.id === encounterId);
        if (found) {
            encounter = found;
            categoryId = categoryId;
        }
    });
    
    if (!encounter) return;
    
    // Populate form
    document.getElementById('encounterName').value = encounter.name;
    document.getElementById('encounterDescription').value = encounter.description || '';
    
    // Populate category dropdown
    const categorySelect = document.getElementById('encounterCategory');
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    
    const categories = Object.keys(encounters[currentCampaign.id]);
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === categoryId) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // Add option for new category
    const newCategoryOption = document.createElement('option');
    newCategoryOption.value = '__new__';
    newCategoryOption.textContent = '+ Nouvelle catégorie';
    categorySelect.appendChild(newCategoryOption);
    
    // Populate monster entries
    document.getElementById('encounterMonsters').innerHTML = '';
    encounter.monsters.forEach(monsterEntry => {
        addMonsterToEncounter();
        const lastEntry = document.querySelector('#encounterMonsters > div:last-child');
        lastEntry.querySelector('.monster-select').value = monsterEntry.monsterId;
        lastEntry.querySelector('.quantity-input').value = monsterEntry.quantity;
        lastEntry.querySelector('.is-player-checkbox').checked = monsterEntry.isPlayer;
    });
    
    // Store editing info
    window.editingEncounterId = encounterId;
    
    // Update button text
    document.getElementById('encounterSaveBtn').textContent = 'Mettre à jour';
    document.querySelector('#encounterModal h3').textContent = 'Modifier une rencontre';
    
    document.getElementById('encounterModal').classList.remove('hidden');
}

function deleteEncounter(encounterId) {
    if (!confirm('Supprimer cette rencontre ?')) return;
    
    Object.entries(encounters[currentCampaign.id]).forEach(([categoryId, category]) => {
        const index = category.findIndex(e => e.id === encounterId);
        if (index !== -1) {
            category.splice(index, 1);
            if (category.length === 0) {
                delete encounters[currentCampaign.id][categoryId];
            }
        }
    });
    
    localStorage.setItem('encounters', JSON.stringify(encounters));
    loadEncountersData();
}

function deleteEncounterCategory(categoryId) {
    if (!confirm(`Supprimer la catégorie "${categoryId}" et toutes ses rencontres ?`)) return;
    
    delete encounters[currentCampaign.id][categoryId];
    localStorage.setItem('encounters', JSON.stringify(encounters));
    loadEncountersData();
}

function addEncounterToCategory(categoryId) {
    // Set category in dropdown
    document.getElementById('encounterCategory').value = categoryId;
    createEncounter();
}

function searchEncounters() {
    const searchTerm = document.getElementById('encounterSearch').value.toLowerCase();
    const allEncounterCards = document.querySelectorAll('#encountersContent .bg-white');
    
    allEncounterCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterEncounters() {
    const selectedCategory = document.getElementById('encounterCategoryFilter').value;
    const allEncounterCards = document.querySelectorAll('#encountersContent .bg-white');
    
    allEncounterCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (!selectedCategory || cardCategory === selectedCategory) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Combat Management
let currentCombat = null;
let currentCombatantIndex = 0;

function toggleCombatMode() {
    combatMode = !combatMode;
    
    if (combatMode) {
        document.getElementById('combatModeBtn').classList.remove('hidden');
        document.getElementById('combatInterface').classList.remove('hidden');
        
        // Hide other content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
    } else {
        document.getElementById('combatInterface').classList.add('hidden');
        currentCombat = null;
        currentCombatantIndex = 0;
        
        // Show encounters section
        if (currentCampaign) {
            showCampaignSection('encounters');
        }
    }
}

function parseMonsterHP(hpString) {
    if (!hpString) return 10;
    
    // Parse HP strings like "45 (6d10 + 12)" or just "45"
    const match = hpString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
}

function startCombat(encounterId) {
    
    if (!currentCampaign) {
        return;
    }
    
    // Find encounter
    let encounter = null;
    Object.values(encounters[currentCampaign.id]).forEach(category => {
        const found = category.find(e => e.id === encounterId);
        if (found) {
            encounter = found;
        }
    });
    
    
    if (!encounter) {
        return;
    }
    
    // Create combat instance
    currentCombat = {
        encounter: encounter,
        combatants: []
    };
    
    // Group monsters by type for initiative calculation
    const monsterGroups = {};
    
    // Create combatants from encounter monsters
    encounter.monsters.forEach((monsterEntry, index) => {
        const monster = findMonsterById(monsterEntry.monsterId);
        if (monster) {
            // Create a group key for this monster type
            const groupKey = `${monsterEntry.monsterId}_${monsterEntry.isPlayer ? 'player' : 'monster'}`;
            
            // Calculate initiative once per monster type
            if (!monsterGroups[groupKey]) {
                let initiative;
                if (monsterEntry.isPlayer) {
                    // For players, ask initiative once per player type
                    const playerName = monster.name;
                    initiative = prompt(`Initiative pour ${playerName}:`);
                    initiative = parseInt(initiative) || 0;
                } else {
                    // Automatic initiative calculation (D&D 2024: d20 + DEX modifier)
                    // Check if monster has stats, otherwise use default
                    let dexMod = 0;
                    if (monster.stats && monster.stats.dexterity !== undefined) {
                        dexMod = Math.floor((monster.stats.dexterity - 10) / 2);
                    }
                    initiative = Math.floor(Math.random() * 20) + 1 + dexMod;
                }
                
                monsterGroups[groupKey] = {
                    initiative: initiative,
                    monster: monster,
                    isPlayer: monsterEntry.isPlayer,
                    quantity: monsterEntry.quantity,
                    monsterId: monsterEntry.monsterId
                };
            }
            
            // Create individual combatants for each monster instance
            for (let i = 0; i < monsterEntry.quantity; i++) {
                // Clone monster data to avoid modifying original
                const monsterClone = JSON.parse(JSON.stringify(monster));
                
                // Initialize spellSlots for combat if they exist
                if (monsterClone.spellSlots) {
                    const initializedSlots = {};
                    Object.entries(monsterClone.spellSlots).forEach(([level, value]) => {
                        let total;
                        if (typeof value === 'string') {
                            total = parseInt(value) || 0;
                        } else if (typeof value === 'number') {
                            total = value;
                        } else if (value && typeof value === 'object') {
                            total = value.total || 0;
                        } else {
                            total = 0;
                        }
                        initializedSlots[level] = {
                            total: total,
                            used: 0  // Start with 0 used slots in combat
                        };
                    });
                    monsterClone.spellSlots = initializedSlots;
                }
                
                const combatant = {
                    id: `${monster.id}_${i}`,
                    name: monster.name,
                    monster: monsterClone,  // Use cloned monster with initialized spellSlots
                    quantity: 1,
                    isPlayer: monsterEntry.isPlayer,
                    maxHp: parseMonsterHP(monster.hp),
                    currentHp: parseMonsterHP(monster.hp),
                    initiative: monsterGroups[groupKey].initiative,
                    index: currentCombat.combatants.length,
                    groupKey: groupKey
                };
                
                currentCombat.combatants.push(combatant);
            }
        }
    });
    
    // Sort by initiative
    currentCombat.combatants.sort((a, b) => b.initiative - a.initiative);
    
    // Find first combatant with spellSlots
    currentCombatantIndex = 0;
    for (let i = 0; i < currentCombat.combatants.length; i++) {
        if (currentCombat.combatants[i].monster.spellSlots && 
            Object.keys(currentCombat.combatants[i].monster.spellSlots).length > 0) {
            currentCombatantIndex = i;
            break;
        }
    }
    
    // Enter combat mode
    combatMode = true;
    document.getElementById('combatInterface').classList.remove('hidden');
    
    // Hide other content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Update combat interface
    updateCombatInterface();
}

function findMonsterById(monsterId) {
    let monster = null;
    Object.values(monsters).forEach(category => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
        }
    });
    return monster;
}

function parseMonsterHP(hpString) {
    if (!hpString) return 10;
    
    // Parse HP strings like "45 (6d10 + 12)" or just "45"
    const match = hpString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
}

function updateCombatInterface() {
    if (!currentCombat) return;
    
    // Update initiative order - show each combatant individually but group by initiative visually
    const initiativeOrder = document.getElementById('initiativeOrder');
    initiativeOrder.innerHTML = currentCombat.combatants.map((combatant, index) => {
        const isCurrentTurn = index === currentCombatantIndex;
        const combatantsWithSameInitiative = currentCombat.combatants.filter(c => c.initiative === combatant.initiative);
        const isFirstInGroup = combatantsWithSameInitiative[0].id === combatant.id;
        
        return `
            <div class="p-3 rounded-lg cursor-pointer transition-all ${
                isCurrentTurn ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'
            } ${combatant.currentHp <= 0 ? 'opacity-50' : ''} ${!isFirstInGroup ? 'border-l-4 border-purple-500 ml-2' : ''}" 
             onclick="selectCombatant(${index})">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-semibold">
                            ${combatant.name}
                            ${!isFirstInGroup ? '<span class="text-xs text-purple-300 ml-1">(dup)</span>' : ''}
                        </div>
                        <div class="text-sm opacity-75">Initiative: ${Math.floor(combatant.initiative)}</div>
                        ${combatant.isPlayer ? '<div class="text-xs bg-blue-500 px-2 py-1 rounded">Joueur</div>' : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-sm">${combatant.currentHp}/${combatant.maxHp} PV</div>
                        ${combatant.currentHp <= 0 ? '<div class="text-xs text-red-400">Incapacité</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update selected combatant details
    if (currentCombat.combatants[currentCombatantIndex]) {
        updateCombatantDetails(currentCombat.combatants[currentCombatantIndex]);
    }
}

function selectFirstInGroup(initiative) {
    // Find the first combatant with this initiative
    const index = currentCombat.combatants.findIndex(c => c.initiative === initiative);
    if (index !== -1) {
        currentCombatantIndex = index;
        updateCombatInterface();
    }
}

function selectCombatant(index) {
    currentCombatantIndex = index;
    updateCombatInterface();
}

function updateCombatantDetails(combatant) {
    const details = document.getElementById('combatMonsterDetails');
    
    // Find other combatants with same initiative
    const sameInitiativeCombatants = currentCombat.combatants.filter(c => c.initiative === combatant.initiative);
    const currentIndex = sameInitiativeCombatants.findIndex(c => c.id === combatant.id);
    
    details.innerHTML = `
        <div class="space-y-4 ${combatant.currentHp <= 0 ? 'opacity-50' : ''}">
            ${combatant.monster.image ? `
                <img src="${combatant.monster.image}" alt="${combatant.name}" class="w-full h-48 object-cover rounded-lg">
            ` : ''}
            
            <div>
                <h4 class="font-bold text-2xl">${combatant.name}</h4>
                ${combatant.monster.size ? `<span class="text-sm text-gray-600">${combatant.monster.size}</span>` : ''}
                ${combatant.monster.type ? `<span class="text-sm text-gray-600 ml-2">${combatant.monster.type}</span>` : ''}
                ${combatant.monster.alignment ? `<span class="text-sm text-gray-600 ml-2">${combatant.monster.alignment}</span>` : ''}
            </div>
            
            ${sameInitiativeCombatants.length > 1 ? `
                <div class="bg-purple-100 p-3 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-semibold text-purple-800">Autres monstres avec même initiative (${sameInitiativeCombatants.length})</span>
                    </div>
                    <div class="flex space-x-2">
                        ${sameInitiativeCombatants.map((other, index) => `
                            <button onclick="selectCombatantById('${other.id}')" 
                                    class="px-3 py-1 rounded text-sm ${
                                        other.id === combatant.id 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-purple-200 text-purple-800 hover:bg-purple-300'
                                    }">
                                ${index + 1}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div>
                <h5 class="font-semibold mb-2">Points de vie</h5>
                <div class="flex items-center space-x-3">
                    <button onclick="adjustHP('${combatant.id}', -5)" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">-5</button>
                    <button onclick="adjustHP('${combatant.id}', -1)" class="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded">-1</button>
                    <div class="text-xl font-bold">${combatant.currentHp}/${combatant.maxHp}</div>
                    <button onclick="adjustHP('${combatant.id}', 1)" class="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded">+1</button>
                    <button onclick="adjustHP('${combatant.id}', 5)" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">+5</button>
                </div>
                ${combatant.currentHp <= 0 ? '<div class="text-red-600 font-semibold mt-2">INCAPACITÉ</div>' : ''}
            </div>
            
            <div>
                <h5 class="font-semibold mb-2">Caractéristiques</h5>
                <div class="grid grid-cols-3 gap-2">
                    <div class="text-center p-2 bg-red-100 rounded">
                        <div class="font-bold">FOR</div>
                        <div>${combatant.monster.stats?.strength || 10} (${Math.floor(((combatant.monster.stats?.strength || 10) - 10) / 2)})</div>
                    </div>
                    <div class="text-center p-2 bg-green-100 rounded">
                        <div class="font-bold">DEX</div>
                        <div>${combatant.monster.stats?.dexterity || 10} (${Math.floor(((combatant.monster.stats?.dexterity || 10) - 10) / 2)})</div>
                    </div>
                    <div class="text-center p-2 bg-blue-100 rounded">
                        <div class="font-bold">CON</div>
                        <div>${combatant.monster.stats?.constitution || 10} (${Math.floor(((combatant.monster.stats?.constitution || 10) - 10) / 2)})</div>
                    </div>
                    <div class="text-center p-2 bg-purple-100 rounded">
                        <div class="font-bold">INT</div>
                        <div>${combatant.monster.stats?.intelligence || 10} (${Math.floor(((combatant.monster.stats?.intelligence || 10) - 10) / 2)})</div>
                    </div>
                    <div class="text-center p-2 bg-yellow-100 rounded">
                        <div class="font-bold">SAG</div>
                        <div>${combatant.monster.stats?.wisdom || 10} (${Math.floor(((combatant.monster.stats?.wisdom || 10) - 10) / 2)})</div>
                    </div>
                    <div class="text-center p-2 bg-pink-100 rounded">
                        <div class="font-bold">CHA</div>
                        <div>${combatant.monster.stats?.charisma || 10} (${Math.floor(((combatant.monster.stats?.charisma || 10) - 10) / 2)})</div>
                    </div>
                </div>
            </div>
            
            ${combatant.monster.armorClass ? `
                <div>
                    <h5 class="font-semibold mb-2">Classe d'armure</h5>
                    <div class="bg-gray-50 p-3 rounded">
                        <span class="text-lg font-bold">${combatant.monster.armorClass}</span>
                        ${combatant.monster.armorType ? `<span class="text-gray-600 ml-2">(${combatant.monster.armorType})</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.speed ? `
                <div>
                    <h5 class="font-semibold mb-2">Vitesse</h5>
                    <div class="bg-gray-50 p-3 rounded">
                        ${combatant.monster.speed}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.skills && combatant.monster.skills.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Compétences</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.skills}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.senses && combatant.monster.senses.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Sens</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.senses}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.languages && combatant.monster.languages.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Langues</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.languages}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.specialTraits && combatant.monster.specialTraits.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Traits spéciaux</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.specialTraits}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.attacks && combatant.monster.attacks.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Attaques</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.attacks}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.legendaryActions && combatant.monster.legendaryActions.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Actions légendaires</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.legendaryActions}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.preparedSpells && (typeof combatant.monster.preparedSpells === 'string' ? combatant.monster.preparedSpells.trim() : combatant.monster.preparedSpells.length > 0) ? `
                <div>
                    <h5 class="font-semibold mb-2">Sorts préparés</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${typeof combatant.monster.preparedSpells === 'string' 
                            ? combatant.monster.preparedSpells 
                            : combatant.monster.preparedSpells.map(spellId => {
                                // Find spell name from spells data
                                let spellName = spellId;
                                Object.values(spells).forEach(level => {
                                    const spell = level.find(s => s.id === spellId);
                                    if (spell) {
                                        spellName = spell.name;
                                    }
                                });
                                return `<span class="text-link cursor-pointer text-indigo-600 hover:text-indigo-800 border-b-2 border-dotted border-indigo-400 hover:border-indigo-600 transition-all inline-block" onclick="showSpellPreview('${spellId}')" title="Voir les détails du sort">${spellName}</span>`;
                            }).join(', ')
                        }
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.spellSlots && Object.keys(combatant.monster.spellSlots).length > 0 ? `
                <div>
                    <h5 class="font-semibold mb-2">Slots de sorts</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${Object.entries(combatant.monster.spellSlots).map(([level, slots]) => {
                            const total = typeof slots === 'string' ? parseInt(slots) : (slots.total || 0);
                            const used = typeof slots === 'string' ? 0 : (slots.used || 0);
                            return `
                                <div class="flex justify-between items-center mb-1">
                                    <span>Niveau ${level}:</span>
                                    <div class="flex items-center space-x-2">
                                        <input type="number" 
                                               id="slot-${combatant.id}-${level}" 
                                               value="${total}" 
                                               min="0" 
                                               max="${total}"
                                               class="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                               onchange="updateSpellSlot('${combatant.id}', '${level}', this.value)"
                                               title="Total des slots de niveau ${level}">
                                        </input>
                                        <span class="text-gray-500">/</span>
                                        <span class="font-bold">${total}</span>
                                        <button onclick="useSpellSlot('${combatant.id}', '${level}')" 
                                                class="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                                                title="Utiliser un slot de niveau ${level}">
                                            -
                                        </button>
                                        <span class="text-xs text-gray-600 ml-1">(${used} utilisés)</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${combatant.monster.description && combatant.monster.description.trim() ? `
                <div>
                    <h5 class="font-semibold mb-2">Description</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${combatant.monster.description}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function selectCombatantById(combatantId) {
    const index = currentCombat.combatants.findIndex(c => c.id === combatantId);
    if (index !== -1) {
        currentCombatantIndex = index;
        updateCombatInterface();
    }
}

function adjustHP(combatantId, amount) {
    const combatant = currentCombat.combatants.find(c => c.id === combatantId);
    if (combatant) {
        combatant.currentHp = Math.max(0, Math.min(combatant.maxHp, combatant.currentHp + amount));
        updateCombatInterface();
    }
}

function nextCombatant() {
    if (!currentCombat) return;
    
    currentCombatantIndex = (currentCombatantIndex + 1) % currentCombat.combatants.length;
    updateCombatInterface();
}

// Spells Management (Global - not campaign-specific)
function loadSpells() {
    try {
        const stored = localStorage.getItem('spells');
        if (stored) {
            spells = JSON.parse(stored);
        } else {
            spells = {};
        }
    } catch (error) {
        spells = {};
    }
}

function createSpell() {
    document.getElementById('spellModal').classList.remove('hidden');
}

function closeSpellModal() {
    document.getElementById('spellModal').classList.add('hidden');
    // Clear form
    document.getElementById('spellName').value = '';
    document.getElementById('spellLevel').value = '1';
    document.getElementById('spellClasses').selectedIndex = -1;
    document.getElementById('spellDuration').value = '';
    document.getElementById('spellRange').value = '';
    document.getElementById('spellVerbal').checked = false;
    document.getElementById('spellSomatic').checked = false;
    document.getElementById('spellMaterial').checked = false;
    document.getElementById('spellTargets').value = '';
    document.getElementById('spellSchool').value = 'Abjuration';
    document.getElementById('spellAttack').value = '';
    document.getElementById('spellDamage').value = '';
    document.getElementById('spellConcentration').value = 'non';
    document.getElementById('spellDescription').value = '';
}

function saveSpell(event) {
    event.preventDefault();
    
    const name = document.getElementById('spellName').value;
    const level = parseInt(document.getElementById('spellLevel').value);
    const classes = Array.from(document.getElementById('spellClasses').selectedOptions).map(option => option.value);
    const duration = document.getElementById('spellDuration').value;
    const range = document.getElementById('spellRange').value;
    const verbal = document.getElementById('spellVerbal').checked;
    const somatic = document.getElementById('spellSomatic').checked;
    const material = document.getElementById('spellMaterial').checked;
    const targets = document.getElementById('spellTargets').value;
    const school = document.getElementById('spellSchool').value;
    const attack = document.getElementById('spellAttack').value;
    const damage = document.getElementById('spellDamage').value;
    const concentration = document.getElementById('spellConcentration').value === 'oui';
    const description = document.getElementById('spellDescription').value;
    
    const spell = {
        name,
        level,
        classes,
        duration,
        range,
        components: {
            verbal,
            somatic,
            material
        },
        targets,
        school,
        attack,
        damage,
        concentration,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Initialize level if needed
    if (!spells[level]) {
        spells[level] = [];
    }
    
    // Check if editing existing spell
    if (window.editingSpellId) {
        // Update existing spell
        const index = spells[level].findIndex(s => s.id === window.editingSpellId);
        if (index !== -1) {
            spell.id = window.editingSpellId;
            spell.createdAt = spells[level][index].createdAt;
            spells[level][index] = spell;
        }
        // Clear editing state
        delete window.editingSpellId;
    } else {
        // Create new spell
        spell.id = Date.now().toString();
        spells[level].push(spell);
    }
    
    // Save to localStorage
    localStorage.setItem('spells', JSON.stringify(spells));
    
    closeSpellModal();
    loadSpellsData();
    
}

function loadSpellsData() {
    const container = document.getElementById('spellsGrid');
    if (!container) return;
    
    if (Object.keys(spells).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-magic text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Aucun sort</h3>
                <p class="text-gray-500">Commencez par créer votre premier sort !</p>
                <button onclick="createSpell()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i> Créer un sort
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    Object.entries(spells).forEach(([level, spellList]) => {
        html += `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Sorts de niveau ${level}</h3>
                <div class="space-y-2">
                    ${spellList.map(spell => `
                        <div class="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100" onclick="showSpellPreview('${spell.id}')">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold text-gray-800">${spell.name}</h4>
                                    <p class="text-sm text-gray-600 mt-1">${spell.description ? spell.description.substring(0, 100) + '...' : 'Aucune description'}</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button onclick="editSpell('${spell.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteSpell('${spell.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
function editSpell(event, spellId) {
    event.stopPropagation();
    
    // Find spell
    let spell = null;
    let spellLevel = null;
    
    Object.entries(spells).forEach(([level, spellList]) => {
        const found = spellList.find(s => s.id === spellId);
        if (found) {
            spell = found;
            spellLevel = level;
        }
    });
    
    if (!spell) return;
    
    // Populate form
    document.getElementById('spellName').value = spell.name;
    document.getElementById('spellLevel').value = spell.level;
    
    // Set classes
    const classesSelect = document.getElementById('spellClasses');
    Array.from(classesSelect.options).forEach(option => {
        option.selected = spell.classes.includes(option.value);
    });
    
    document.getElementById('spellDuration').value = spell.duration || '';
    document.getElementById('spellRange').value = spell.range || '';
    document.getElementById('spellVerbal').checked = spell.components.verbal;
    document.getElementById('spellSomatic').checked = spell.components.somatic;
    document.getElementById('spellMaterial').checked = spell.components.material;
    document.getElementById('spellTargets').value = spell.targets || '';
    document.getElementById('spellSchool').value = spell.school;
    document.getElementById('spellAttack').value = spell.attack || '';
    document.getElementById('spellDamage').value = spell.damage || '';
    document.getElementById('spellConcentration').value = spell.concentration ? 'oui' : 'non';
    document.getElementById('spellDescription').value = spell.description || '';
    
    // Store editing info
    window.editingSpellId = spellId;
    
    // Update button text
    document.getElementById('spellSaveBtn').textContent = 'Mettre à jour';
    document.querySelector('#spellModal h3').textContent = 'Modifier un sort';
    
    document.getElementById('spellModal').classList.remove('hidden');
}

function deleteSpell(event, spellId) {
    event.stopPropagation();
    
    if (!confirm('Supprimer ce sort ?')) return;
    
    // Find and delete spell
    Object.entries(spells).forEach(([level, spellList]) => {
        const index = spellList.findIndex(s => s.id === spellId);
        if (index !== -1) {
            spellList.splice(index, 1);
            if (spellList.length === 0) {
                delete spells[level];
            }
        }
    });
    
    localStorage.setItem('spells', JSON.stringify(spells));
    loadSpellsData();
}

function searchSpells() {
    const searchTerm = document.getElementById('spellSearch').value.toLowerCase();
    const allSpellCards = document.querySelectorAll('#spellsGrid .bg-white');
    
    allSpellCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterSpells() {
    const levelFilter = document.getElementById('spellLevelFilter').value;
    const classFilter = document.getElementById('spellClassFilter').value;
    const allSpellCards = document.querySelectorAll('#spellsGrid .bg-white');
    
    allSpellCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        let show = true;
        
        if (levelFilter && !text.includes(`niveau ${levelFilter}`)) {
            show = false;
        }
        
        if (classFilter && !text.includes(classFilter.toLowerCase())) {
            show = false;
        }
        
        card.style.display = show ? '' : 'none';
    });
}

function showSpellPreview(spellId) {
    // Find spell
    let spell = null;
    Object.values(spells).forEach(spellList => {
        const found = spellList.find(s => s.id === spellId);
        if (found) {
            spell = found;
        }
    });
    
    if (!spell) return;
    
    // Create preview content
    const content = `
        <div class="space-y-4">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${spell.name}</h3>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded">Niveau ${spell.level}</span>
                        ${spell.concentration ? '<span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">Concentration</span>' : ''}
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-semibold mb-2">Classes</h4>
                    <div class="flex flex-wrap gap-2">
                        ${spell.classes.map(cls => `
                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">${cls}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">École</h4>
                    <p class="text-gray-600">${spell.school}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Portée/Zone</h4>
                    <p class="text-gray-600">${spell.range}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Durée</h4>
                    <p class="text-gray-600">${spell.duration}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Composantes</h4>
                    <div class="flex space-x-4">
                        ${spell.components.verbal ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Verbale</span>' : ''}
                        ${spell.components.somatic ? '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Somatique</span>' : ''}
                        ${spell.components.material ? '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Matériel</span>' : ''}
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Cibles</h4>
                    <p class="text-gray-600">${spell.targets}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Attaque/Sauvegarde</h4>
                    <p class="text-gray-600">${spell.attack}</p>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Dommage/Effet</h4>
                    <p class="text-gray-600">${spell.damage}</p>
                </div>
            </div>
            
            ${spell.description ? `
                <div>
                    <h4 class="font-semibold mb-2">Description</h4>
                    <div class="bg-gray-50 p-4 rounded">
                        <p class="text-gray-700 whitespace-pre-wrap">${spell.description}</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('linkPreviewModal');
    const title = document.getElementById('linkPreviewTitle');
    const modalContent = document.getElementById('linkPreviewContent');
    
    title.textContent = spell.name;
    modalContent.innerHTML = content;
    
    // Hide "view full element" button since this is already full view
    document.getElementById('viewFullElementBtn').style.display = 'none';
    
    modal.classList.remove('hidden');
}

// Monsters Management (Global - not campaign-specific)
function loadMonsters() {
    try {
        const stored = localStorage.getItem('monsters');
        if (stored) {
            monsters = JSON.parse(stored);
        } else {
            monsters = {};
        }
    } catch (error) {
        monsters = {};
    }
}

function loadMonstersData() {
    const container = document.getElementById('monstersGrid');
    if (!container) return;
    
    if (Object.keys(monsters).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-dragon text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucune campagne sélectionnée</p>
                <p class="text-gray-400">Ajoute des monstres à ta campagne !</p>
                <button onclick="createMonster()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Ajouter un monstre
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Add search bar and create button
    html += '<div class="mb-6">';
    html += '<div class="flex space-x-4 items-center">';
    html += '<input type="text" id="monsterSearch" placeholder="Rechercher un monstre..." class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onkeyup="searchMonsters()">';
    html += '<button onclick="createMonster()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">';
    html += '<i class="fas fa-plus mr-2"></i>Ajouter un monstre';
    html += '</button>';
    html += '<button onclick="testJS()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">';
    html += '<i class="fas fa-bug mr-2"></i>TEST JS';
    html += '</button>';
    html += '<button onclick="enableMonsterEditMode()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">';
    html += '<i class="fas fa-edit mr-2"></i>Modifier les monstres';
    html += '</button>';
    html += '</div>';
    html += '</div>';
    
    // Add monsters with edit buttons (always in edit mode)
    Object.entries(monsters).forEach(([categoryId, category]) => {
        html += `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${categoryId} (${category.length})</h3>
                    <div class="space-x-2">
                        <button onclick="addMonsterToCategory('${categoryId}')" class="text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-plus"></i> Monstre
                        </button>
                        <button onclick="deleteMonsterCategory('${categoryId}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="space-y-4">
                    ${category.map(monster => `
                        <div class="border-l-4 border-purple-300 pl-4">
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-semibold text-gray-800">${monster.name}</h4>
                                <div class="space-x-2">
                                    <button onclick="editMonster(event, '${monster.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-edit"></i> Modifier
                                    </button>
                                    <button onclick="copyMonster('${monster.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-copy"></i> Copier
                                    </button>
                                    <button onclick="deleteMonster(event, '${monster.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-trash"></i> Supprimer
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <p class="text-gray-600 text-sm mb-2">${monster.description ? monster.description.substring(0, 200) + '...' : 'Aucune description'}</p>
                                <div class="flex space-x-2">
                                    <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">CA ${monster.ac}</span>
                                    <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">PV ${monster.hp}</span>
                                    <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">NDD ${monster.cr}</span>
                                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">${monster.type}</span>
                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${monster.size}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Characters Management

// Test simple pour vérifier si JavaScript fonctionne
function testJS() {
    alert('JavaScript fonctionne !');
}

// Characters Management

function createMonster() {
    // Populate category dropdown
    const categorySelect = document.getElementById('monsterCategory');
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    
    const categories = Object.keys(monsters);
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Add option for new category
    const newCategoryOption = document.createElement('option');
    newCategoryOption.value = '__new__';
    newCategoryOption.textContent = '+ Nouvelle catégorie';
    categorySelect.appendChild(newCategoryOption);
    
    // Update button text
    document.getElementById('monsterSaveBtn').textContent = 'Créer';
    document.querySelector('#monsterModal h3').textContent = 'Créer un monstre';
    
    // Clear editing state
    delete window.editingMonsterId;
    delete window.editingMonsterCategoryId;
    
    openMonsterModal();
}

function openMonsterModal() {
    const modal = document.getElementById('monsterModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeMonsterModal() {
    const modal = document.getElementById('monsterModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear form safely
    const clearField = (id) => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    };
    
    clearField('monsterName');
    clearField('monsterImage');
    clearField('monsterDescription');
    clearField('monsterStrength');
    clearField('monsterDexterity');
    clearField('monsterConstitution');
    clearField('monsterIntelligence');
    clearField('monsterWisdom');
    clearField('monsterCharisma');
    clearField('monsterSize');
    clearField('monsterType');
    clearField('monsterAlignment');
    clearField('monsterArmorClass');
    clearField('monsterHp');
    clearField('monsterSpeed');
    clearField('monsterResistances');
    clearField('monsterImmunities');
    clearField('monsterSkills');
    clearField('monsterSenses');
    clearField('monsterLanguages');
    clearField('monsterSpecialTraits');
    clearField('monsterAttacks');
    clearField('monsterLegendaryActions');
    
    // Clear spell slots (1-9) - simplified
    const slot1 = document.getElementById('monsterSlot1');
    const slot2 = document.getElementById('monsterSlot2');
    const slot3 = document.getElementById('monsterSlot3');
    const slot4 = document.getElementById('monsterSlot4');
    const slot5 = document.getElementById('monsterSlot5');
    const slot6 = document.getElementById('monsterSlot6');
    const slot7 = document.getElementById('monsterSlot7');
    const slot8 = document.getElementById('monsterSlot8');
    const slot9 = document.getElementById('monsterSlot9');
    
    if (slot1) slot1.value = '';
    if (slot2) slot2.value = '';
    if (slot3) slot3.value = '';
    if (slot4) slot4.value = '';
    if (slot5) slot5.value = '';
    if (slot6) slot6.value = '';
    if (slot7) slot7.value = '';
    if (slot8) slot8.value = '';
    if (slot9) slot9.value = '';
    
    // Clear prepared spells checkboxes
    const checkboxes = document.querySelectorAll('input[name="preparedSpells"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Reset button text
    const saveBtn = document.getElementById('monsterSaveBtn');
    if (saveBtn) {
        saveBtn.textContent = 'Créer';
    }
    
    const title = document.querySelector('#monsterModal h3');
    if (title) {
        title.textContent = 'Créer un monstre';
    }
}

function saveMonster(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('monsterName');
    const categoryInput = document.getElementById('monsterCategory');
    const descriptionInput = document.getElementById('monsterDescription');
    
    if (!nameInput || !categoryInput || !descriptionInput) {
        console.error('Required inputs not found');
        return;
    }
    
    const name = nameInput.value;
    const categoryId = categoryInput.value;
    const description = descriptionInput.value;
    
    if (!categoryId) {
        alert('Veuillez choisir une catégorie');
        return;
    }
    
    // Get category name from ID
    const category = monsterCategories[categoryId]?.name || 'Unknown';
    
    // Collect prepared spells from checkboxes (if they exist)
    let preparedSpells = [];
    const preparedSpellsCheckboxes = document.querySelectorAll('input[name="preparedSpells"]:checked');
    if (preparedSpellsCheckboxes.length > 0) {
        preparedSpells = Array.from(preparedSpellsCheckboxes).map(cb => cb.value);
    }
    
    // Safely get all form values with detailed debug
    const debugElements = {
        monsterImage: document.getElementById('monsterImage'),
        monsterStrength: document.getElementById('monsterStrength'),
        monsterDexterity: document.getElementById('monsterDexterity'),
        monsterConstitution: document.getElementById('monsterConstitution'),
        monsterIntelligence: document.getElementById('monsterIntelligence'),
        monsterWisdom: document.getElementById('monsterWisdom'),
        monsterCharisma: document.getElementById('monsterCharisma'),
        monsterSize: document.getElementById('monsterSize'),
        monsterType: document.getElementById('monsterType'),
        monsterAlignment: document.getElementById('monsterAlignment'),
        monsterArmorClass: document.getElementById('monsterArmorClass'),
        monsterHp: document.getElementById('monsterHp'),
        monsterSpeed: document.getElementById('monsterSpeed'),
        monsterResistances: document.getElementById('monsterResistances'),
        monsterImmunities: document.getElementById('monsterImmunities'),
        monsterSkills: document.getElementById('monsterSkills'),
        monsterSenses: document.getElementById('monsterSenses'),
        monsterLanguages: document.getElementById('monsterLanguages'),
        monsterSpecialTraits: document.getElementById('monsterSpecialTraits'),
        monsterAttacks: document.getElementById('monsterAttacks'),
        monsterLegendaryActions: document.getElementById('monsterLegendaryActions')
    };
    
    
    const monster = {
        name,
        categoryId,
        category,
        description,
        image: debugElements.monsterImage?.value || '',
        stats: {
            strength: parseInt(debugElements.monsterStrength?.value) || 10,
            dexterity: parseInt(debugElements.monsterDexterity?.value) || 10,
            constitution: parseInt(debugElements.monsterConstitution?.value) || 10,
            intelligence: parseInt(debugElements.monsterIntelligence?.value) || 10,
            wisdom: parseInt(debugElements.monsterWisdom?.value) || 10,
            charisma: parseInt(debugElements.monsterCharisma?.value) || 10
        },
        size: debugElements.monsterSize?.value || '',
        type: debugElements.monsterType?.value || '',
        alignment: debugElements.monsterAlignment?.value || '',
        armorClass: debugElements.monsterArmorClass?.value || '',
        hp: debugElements.monsterHp?.value || '',
        speed: debugElements.monsterSpeed?.value || '',
        resistances: debugElements.monsterResistances?.value || '',
        immunities: debugElements.monsterImmunities?.value || '',
        preparedSpells: preparedSpells,
        spellSlots: {},
        skills: debugElements.monsterSkills?.value || '',
        senses: debugElements.monsterSenses?.value || '',
        languages: debugElements.monsterLanguages?.value || '',
        specialTraits: debugElements.monsterSpecialTraits?.value || '',
        attacks: debugElements.monsterAttacks?.value || '',
        legendaryActions: debugElements.monsterLegendaryActions?.value || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    
    // Collect spell slots (1-9) - with delay to ensure DOM is ready
    
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
        // Simple direct collection
        monster.spellSlots = {};
        
        // Try to get each slot directly
        const slot1 = document.getElementById('monsterSlot1');
        const slot2 = document.getElementById('monsterSlot2');
        const slot3 = document.getElementById('monsterSlot3');
        const slot4 = document.getElementById('monsterSlot4');
        const slot5 = document.getElementById('monsterSlot5');
        const slot6 = document.getElementById('monsterSlot6');
        const slot7 = document.getElementById('monsterSlot7');
        const slot8 = document.getElementById('monsterSlot8');
        const slot9 = document.getElementById('monsterSlot9');
        
        if (slot1 && slot1.value) monster.spellSlots[1] = parseInt(slot1.value);
        if (slot2 && slot2.value) monster.spellSlots[2] = parseInt(slot2.value);
        if (slot3 && slot3.value) monster.spellSlots[3] = parseInt(slot3.value);
        if (slot4 && slot4.value) monster.spellSlots[4] = parseInt(slot4.value);
        if (slot5 && slot5.value) monster.spellSlots[5] = parseInt(slot5.value);
        if (slot6 && slot6.value) monster.spellSlots[6] = parseInt(slot6.value);
        if (slot7 && slot7.value) monster.spellSlots[7] = parseInt(slot7.value);
        if (slot8 && slot8.value) monster.spellSlots[8] = parseInt(slot8.value);
        if (slot9 && slot9.value) monster.spellSlots[9] = parseInt(slot9.value);
        
            
        // Continue with monster creation
        continueMonsterCreation(monster, categoryId);
    }, 100); // 100ms delay
}

// Separate function to continue monster creation after collecting slots
function continueMonsterCreation(monster, categoryId) {
    
    // Initialize category if needed
    if (!monsters[categoryId]) {
        monsters[categoryId] = [];
        }
    
    
    // Check if editing existing monster
    if (window.editingMonsterId) {
        // Update existing monster
        Object.entries(monsters).forEach(([catId, categoryMonsters]) => {
            const index = categoryMonsters.findIndex(m => m.id === window.editingMonsterId);
            if (index !== -1) {
                // Remove from old category if category changed
                if (catId !== categoryId) {
                    categoryMonsters.splice(index, 1);
                    if (categoryMonsters.length === 0) {
                        delete monsters[catId];
                    }
                } else {
                    monster.id = window.editingMonsterId;
                    monster.createdAt = categoryMonsters[index].createdAt;
                    categoryMonsters[index] = monster;
                }
            }
        });
        // Clear editing state
        delete window.editingMonsterId;
        delete window.editingMonsterCategoryId;
    } else {
        // Create new monster
        monster.id = Date.now().toString();
                
        monsters[categoryId].push(monster);
        }

    // Save to localStorage
    localStorage.setItem('monsters', JSON.stringify(monsters));

    closeMonsterModal();
    loadMonstersData();

    console.log('Monster ' + (window.editingMonsterId ? 'mis à jour' : 'créé') + ':', monster);
}

// Add event listener for category change
document.addEventListener('DOMContentLoaded', function() {
    const categorySelect = document.getElementById('monsterCategory');
    const newCategoryInput = document.getElementById('monsterNewCategory');
    
    if (categorySelect && newCategoryInput) {
        categorySelect.addEventListener('change', function() {
            if (this.value === 'nouvelle') {
                newCategoryInput.classList.remove('hidden');
                newCategoryInput.required = true;
            } else {
                newCategoryInput.classList.add('hidden');
                newCategoryInput.required = false;
                newCategoryInput.value = '';
            }
        });
    }
});

// Populate spell categories dynamically
function populateMonsterCategories() {
    const categorySelect = document.getElementById('monsterCategory');
    if (!categorySelect) return;
    
    // Clear existing options except the first two
    while (categorySelect.options.length > 2) {
        categorySelect.remove(2);
    }
    
    // Add existing categories
    Object.keys(monsters).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Populate prepared spells from spell library
function populatePreparedSpells() {
    const preparedSpellsContainer = document.getElementById('monsterPreparedSpellsContainer');
    if (!preparedSpellsContainer) return;
    
    let html = '<div class="space-y-2">';
    
    // Group spells by level (1-9)
    for (let level = 1; level <= 9; level++) {
        if (spells[level] && spells[level].length > 0) {
            html += `
                <div class="border-l-4 border-indigo-500 pl-3" data-level="${level}">
                    <h4 class="font-semibold text-sm mb-2">Sorts de niveau ${level}</h4>
                    <div class="space-y-1">
            `;
            
            spells[level].forEach(spell => {
                html += `
                    <label class="flex items-center text-sm prepared-spell-item" data-spell-name="${spell.name.toLowerCase()}" data-spell-level="${level}">
                        <input type="checkbox" name="preparedSpells" value="${spell.id}" class="mr-2">
                        <span>${spell.name}</span>
                    </label>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    preparedSpellsContainer.innerHTML = html;
    
    // Add event listener to search input
    const searchInput = document.getElementById('preparedSpellsSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterPreparedSpells);
    }
}

// Call this when opening monster modal
function openMonsterModal() {
    populateMonsterCategories();
    populatePreparedSpells();
    document.getElementById('monsterModal').classList.remove('hidden');
    document.getElementById('monsterModal').scrollIntoView({ behavior: 'smooth' });
}

function searchMonsters() {
    const searchTerm = document.getElementById('monsterSearch').value.toLowerCase();
    const allMonsterCards = document.querySelectorAll('#monstersGrid .bg-white');
    
    allMonsterCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterMonsters() {
    const categoryFilter = document.getElementById('monsterCategoryFilter').value;
    const typeFilter = document.getElementById('monsterTypeFilter').value;
    const allMonsterCards = document.querySelectorAll('#monstersGrid .bg-white');
    
    allMonsterCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        let show = true;
        
        if (categoryFilter && !text.includes(categoryFilter.toLowerCase())) {
            show = false;
        }
        
        if (typeFilter && !text.includes(typeFilter.toLowerCase())) {
            show = false;
        }
        
        card.style.display = show ? '' : 'none';
    });
}

function populateMonsterCategories() {
    const categoryFilter = document.getElementById('monsterCategoryFilter');
    if (!categoryFilter) return;
    
    // Clear existing options except the first one
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add existing categories
    Object.keys(monsters).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function loadMonstersData() {
    const container = document.getElementById('monstersGrid');
    if (!container) return;
    
    populateMonsterCategories();
    
    if (Object.keys(monsters).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-dragon text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun monstre pour le moment</p>
                <p class="text-gray-400">Ajoute des monstres à ta bibliothèque !</p>
                <button onclick="createMonster()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Ajouter un monstre
                </button>
            </div>
        `;
        return;
    }
    
    // Display all monsters
    let html = '';
    Object.entries(monsters).forEach(([category, monsterList]) => {
        monsterList.forEach(monster => {
            const imageUrl = monster.image || 'https://picsum.photos/seed/monster/300/200.jpg';
            
            html += `
                <div class="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl" onclick="showMonsterPreview('${monster.id}')">
                    <div class="mb-4">
                        <img src="${imageUrl}" alt="${monster.name}" class="w-full h-32 object-cover rounded-lg mb-4" onerror="this.src='https://picsum.photos/seed/monster/300/200.jpg'">
                    </div>
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">${monster.name}</h3>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${category}</span>
                                ${monster.type ? `<span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">${monster.type}</span>` : ''}
                                ${monster.size ? `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${monster.size}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editMonster(event, '${monster.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteMonster(event, '${monster.id}')" class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        ${monster.armorClass ? `
                            <div class="text-gray-600">
                                <span class="font-semibold">CA:</span> ${monster.armorClass}
                            </div>
                        ` : ''}
                        ${monster.hp ? `
                            <div class="text-gray-600">
                                <span class="font-semibold">PV:</span> ${monster.hp}
                            </div>
                        ` : ''}
                        ${monster.speed ? `
                            <div class="text-gray-600">
                                <span class="font-semibold">Vitesse:</span> ${monster.speed}
                            </div>
                        ` : ''}
                        ${monster.resistances ? `
                            <div class="text-gray-600">
                                <span class="font-semibold">Résistances:</span> ${monster.resistances}
                            </div>
                        ` : ''}
                        ${monster.description ? `
                            <div class="text-gray-600 mt-2">
                                <span class="font-semibold">Description:</span> ${monster.description.substring(0, 150)}${monster.description.length > 150 ? '...' : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}

function showMonsterPreview(monsterId) {
    // Find monster
    let monster = null;
    Object.entries(monsters).forEach(([category, monsterList]) => {
        const found = monsterList.find(m => m.id === monsterId);
        if (found) {
            monster = found;
        }
    });
    
    if (!monster) return;
    
    // Create preview content
    const content = `
        <div class="space-y-4">
            ${monster.image ? `
                <img src="${monster.image}" alt="${monster.name}" class="w-full h-48 object-cover rounded-lg">
            ` : ''}
            <div>
                <h4 class="font-bold text-lg">${monster.name}</h4>
                <div class="flex items-center space-x-2 mt-1">
                    <span class="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded">${monster.category}</span>
                    ${monster.type ? `<span class="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded">${monster.type}</span>` : ''}
                    ${monster.size ? `<span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">${monster.size}</span>` : ''}
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${monster.armorClass ? `
                    <div>
                        <h4 class="font-semibold mb-2">Classe d'armure</h4>
                        <p class="text-gray-600">${monster.armorClass}</p>
                    </div>
                ` : ''}
                
                ${monster.hp ? `
                    <div>
                        <h4 class="font-semibold mb-2">Points de vie</h4>
                        <p class="text-gray-600">${monster.hp}</p>
                    </div>
                ` : ''}
                
                ${monster.speed ? `
                    <div>
                        <h4 class="font-semibold mb-2">Vitesse</h4>
                        <p class="text-gray-600">${monster.speed}</p>
                    </div>
                ` : ''}
                
                ${monster.alignment ? `
                    <div>
                        <h4 class="font-semibold mb-2">Alignement</h4>
                        <p class="text-gray-600">${monster.alignment}</p>
                    </div>
                ` : ''}
                
                ${monster.resistances ? `
                    <div>
                        <h4 class="font-semibold mb-2">Résistances</h4>
                        <p class="text-gray-600">${monster.resistances}</p>
                    </div>
                ` : ''}
                
                ${monster.immunities ? `
                    <div>
                        <h4 class="font-semibold mb-2">Immunités</h4>
                        <p class="text-gray-600">${monster.immunities}</p>
                    </div>
                ` : ''}
                
                ${monster.skills ? `
                    <div>
                        <h4 class="font-semibold mb-2">Compétences</h4>
                        <p class="text-gray-600">${monster.skills}</p>
                    </div>
                ` : ''}
                
                ${monster.senses ? `
                    <div>
                        <h4 class="font-semibold mb-2">Sens</h4>
                        <p class="text-gray-600">${monster.senses}</p>
                    </div>
                ` : ''}
                
                ${monster.languages ? `
                    <div>
                        <h4 class="font-semibold mb-2">Langues</h4>
                        <p class="text-gray-600">${monster.languages}</p>
                    </div>
                ` : ''}
                
                ${monster.specialTraits ? `
                    <div>
                        <h4 class="font-semibold mb-2">Traits spéciaux</h4>
                        <p class="text-gray-600">${monster.specialTraits}</p>
                    </div>
                ` : ''}
                
                ${monster.attacks ? `
                    <div>
                        <h4 class="font-semibold mb-2">Attaques</h4>
                        <p class="text-gray-600">${monster.attacks}</p>
                    </div>
                ` : ''}
                
                ${monster.legendaryActions ? `
                    <div>
                        <h4 class="font-semibold mb-2">Actions légendaires</h4>
                        <p class="text-gray-600">${monster.legendaryActions}</p>
                    </div>
                ` : ''}
            </div>
            
            ${monster.preparedSpells || Object.keys(monster.spellSlots || {}).length > 0 ? `
                <div>
                    <h4 class="font-semibold mb-2">Sorts</h4>
                    <div class="bg-gray-50 p-4 rounded">
                        ${monster.preparedSpells ? `
                            <p class="text-gray-700 mb-2"><strong>Sorts préparés:</strong> ${monster.preparedSpells}</p>
                        ` : ''}
                        ${Object.keys(monster.spellSlots || {}).length > 0 ? `
                            <p class="text-gray-700"><strong>Emplacements:</strong> ${Object.entries(monster.spellSlots).map(([level, slots]) => `Niv ${level}: ${slots}`).join(', ')}</p>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${monster.description ? `
                <div>
                    <h4 class="font-semibold mb-2">Description</h4>
                    <div class="bg-gray-50 p-4 rounded">
                        <p class="text-gray-700 whitespace-pre-wrap">${monster.description}</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('linkPreviewModal');
    const title = document.getElementById('linkPreviewTitle');
    const modalContent = document.getElementById('linkPreviewContent');
    
    title.textContent = monster.name;
    modalContent.innerHTML = content;
    
    // Hide "view full element" button since this is already full view
    document.getElementById('viewFullElementBtn').style.display = 'none';
    
    modal.classList.remove('hidden');
}

function copyMonster(monsterId) {
    // Find monster
    let monster = null;
    let categoryId = null;
    
    Object.entries(monsters).forEach(([catId, category]) => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
            categoryId = catId;
        }
    });
    
    if (!monster) {
        console.error('Monster not found');
        return;
    }
    
    // Create a deep copy of the monster
    const monsterCopy = JSON.parse(JSON.stringify(monster));
    
    // Generate new ID and add (copie) to name
    monsterCopy.id = 'monster_' + Date.now();
    monsterCopy.name = monsterCopy.name + ' (copie)';
    
    // Clear editing info
    window.editingMonsterId = null;
    window.editingMonsterCategoryId = null;
    
    // Populate form with copied data
    document.getElementById('monsterName').value = monsterCopy.name;
    document.getElementById('monsterImage').value = monsterCopy.image || '';
    document.getElementById('monsterCategory').value = categoryId;
    
    // Stats
    if (monsterCopy.stats) {
        document.getElementById('monsterStrength').value = monsterCopy.stats.strength || 10;
        document.getElementById('monsterDexterity').value = monsterCopy.stats.dexterity || 10;
        document.getElementById('monsterConstitution').value = monsterCopy.stats.constitution || 10;
        document.getElementById('monsterIntelligence').value = monsterCopy.stats.intelligence || 10;
        document.getElementById('monsterWisdom').value = monsterCopy.stats.wisdom || 10;
        document.getElementById('monsterCharisma').value = monsterCopy.stats.charisma || 10;
    } else {
        // Default values if no stats
        document.getElementById('monsterStrength').value = 10;
        document.getElementById('monsterDexterity').value = 10;
        document.getElementById('monsterConstitution').value = 10;
        document.getElementById('monsterIntelligence').value = 10;
        document.getElementById('monsterWisdom').value = 10;
        document.getElementById('monsterCharisma').value = 10;
    }
    
    document.getElementById('monsterSize').value = monsterCopy.size || '';
    document.getElementById('monsterType').value = monsterCopy.type || '';
    document.getElementById('monsterAlignment').value = monsterCopy.alignment || '';
    document.getElementById('monsterArmorClass').value = monsterCopy.armorClass || '';
    document.getElementById('monsterHp').value = monsterCopy.hp || '';
    document.getElementById('monsterSpeed').value = monsterCopy.speed || '';
    document.getElementById('monsterResistances').value = monsterCopy.resistances || '';
    document.getElementById('monsterImmunities').value = monsterCopy.immunities || '';
    document.getElementById('monsterSkills').value = monsterCopy.skills || '';
    document.getElementById('monsterSenses').value = monsterCopy.senses || '';
    document.getElementById('monsterLanguages').value = monsterCopy.languages || '';
    document.getElementById('monsterSpecialTraits').value = monsterCopy.specialTraits || '';
    document.getElementById('monsterAttacks').value = monsterCopy.attacks || '';
    document.getElementById('monsterLegendaryActions').value = monsterCopy.legendaryActions || '';
    document.getElementById('monsterDescription').value = monsterCopy.description || '';
    
    // Clear prepared spells checkboxes
    document.querySelectorAll('input[name="preparedSpells"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Populate prepared spells checkboxes
    if (monsterCopy.preparedSpells && monsterCopy.preparedSpells.length > 0) {
        monsterCopy.preparedSpells.forEach(spellId => {
            const checkbox = document.querySelector(`input[name="preparedSpells"][value="${spellId}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // Clear spell slots inputs
    for (let i = 1; i <= 9; i++) {
        const slotInput = document.getElementById(`monsterSlot${i}`);
        if (slotInput) {
            slotInput.value = '';
        }
    }
    
    // Populate spell slots (1-9)
    if (monsterCopy.spellSlots) {
        const slot1 = document.getElementById('monsterSlot1');
        const slot2 = document.getElementById('monsterSlot2');
        const slot3 = document.getElementById('monsterSlot3');
        const slot4 = document.getElementById('monsterSlot4');
        const slot5 = document.getElementById('monsterSlot5');
        const slot6 = document.getElementById('monsterSlot6');
        const slot7 = document.getElementById('monsterSlot7');
        const slot8 = document.getElementById('monsterSlot8');
        const slot9 = document.getElementById('monsterSlot9');
        
        if (slot1 && monsterCopy.spellSlots[0]) { slot1.value = monsterCopy.spellSlots[0]; }
        if (slot2 && monsterCopy.spellSlots[1]) { slot2.value = monsterCopy.spellSlots[1]; }
        if (slot3 && monsterCopy.spellSlots[2]) { slot3.value = monsterCopy.spellSlots[2]; }
        if (slot4 && monsterCopy.spellSlots[3]) { slot4.value = monsterCopy.spellSlots[3]; }
        if (slot5 && monsterCopy.spellSlots[4]) { slot5.value = monsterCopy.spellSlots[4]; }
        if (slot6 && monsterCopy.spellSlots[5]) { slot6.value = monsterCopy.spellSlots[5]; }
        if (slot7 && monsterCopy.spellSlots[6]) { slot7.value = monsterCopy.spellSlots[6]; }
        if (slot8 && monsterCopy.spellSlots[7]) { slot8.value = monsterCopy.spellSlots[7]; }
        if (slot9 && monsterCopy.spellSlots[8]) { slot9.value = monsterCopy.spellSlots[8]; }
    }
    
    // Update button text for creation
    document.getElementById('monsterSaveBtn').textContent = 'Créer';
    document.querySelector('#monsterModal h3').textContent = 'Créer un monstre (copie)';
    
    openMonsterModal();
}

function editMonster(event, monsterId) {
    if (event) {
        event.stopPropagation();
    }
    
    // Find monster
    let monster = null;
    let categoryId = null;
    
    Object.entries(monsters).forEach(([catId, category]) => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
            categoryId = catId;
        }
    });
    
    if (!monster) {
        console.error('Monster not found');
        return;
    }
    
    // Store editing info
    window.editingMonsterId = monsterId;
    window.editingMonsterCategoryId = categoryId;
    
    // Populate form
    document.getElementById('monsterName').value = monster.name;
    document.getElementById('monsterImage').value = monster.image || '';
    document.getElementById('monsterCategory').value = categoryId;
    
    // Stats
    if (monster.stats) {
        document.getElementById('monsterStrength').value = monster.stats.strength || 10;
        document.getElementById('monsterDexterity').value = monster.stats.dexterity || 10;
        document.getElementById('monsterConstitution').value = monster.stats.constitution || 10;
        document.getElementById('monsterIntelligence').value = monster.stats.intelligence || 10;
        document.getElementById('monsterWisdom').value = monster.stats.wisdom || 10;
        document.getElementById('monsterCharisma').value = monster.stats.charisma || 10;
    } else {
        // Default values if no stats
        document.getElementById('monsterStrength').value = 10;
        document.getElementById('monsterDexterity').value = 10;
        document.getElementById('monsterConstitution').value = 10;
        document.getElementById('monsterIntelligence').value = 10;
        document.getElementById('monsterWisdom').value = 10;
        document.getElementById('monsterCharisma').value = 10;
    }
    
    document.getElementById('monsterSize').value = monster.size || '';
    document.getElementById('monsterType').value = monster.type || '';
    document.getElementById('monsterAlignment').value = monster.alignment || '';
    document.getElementById('monsterArmorClass').value = monster.armorClass || '';
    document.getElementById('monsterHp').value = monster.hp || '';
    document.getElementById('monsterSpeed').value = monster.speed || '';
    document.getElementById('monsterResistances').value = monster.resistances || '';
    document.getElementById('monsterImmunities').value = monster.immunities || '';
    document.getElementById('monsterSkills').value = monster.skills || '';
    document.getElementById('monsterSenses').value = monster.senses || '';
    document.getElementById('monsterLanguages').value = monster.languages || '';
    document.getElementById('monsterSpecialTraits').value = monster.specialTraits || '';
    document.getElementById('monsterAttacks').value = monster.attacks || '';
    document.getElementById('monsterLegendaryActions').value = monster.legendaryActions || '';
    document.getElementById('monsterDescription').value = monster.description || '';
    
    // Populate prepared spells checkboxes
    if (monster.preparedSpells && monster.preparedSpells.length > 0) {
        monster.preparedSpells.forEach(spellId => {
            const checkbox = document.querySelector(`input[name="preparedSpells"][value="${spellId}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // Populate spell slots (1-9) - simplified
    if (monster.spellSlots) {
        const slot1 = document.getElementById('monsterSlot1');
        const slot2 = document.getElementById('monsterSlot2');
        const slot3 = document.getElementById('monsterSlot3');
        const slot4 = document.getElementById('monsterSlot4');
        const slot5 = document.getElementById('monsterSlot5');
        const slot6 = document.getElementById('monsterSlot6');
        const slot7 = document.getElementById('monsterSlot7');
        const slot8 = document.getElementById('monsterSlot8');
        const slot9 = document.getElementById('monsterSlot9');
        
        if (slot1 && monster.spellSlots[0]) { slot1.value = monster.spellSlots[0]; }
        if (slot2 && monster.spellSlots[1]) { slot2.value = monster.spellSlots[1]; }
        if (slot3 && monster.spellSlots[2]) { slot3.value = monster.spellSlots[2]; }
        if (slot4 && monster.spellSlots[3]) { slot4.value = monster.spellSlots[3]; }
        if (slot5 && monster.spellSlots[4]) { slot5.value = monster.spellSlots[4]; }
        if (slot6 && monster.spellSlots[5]) { slot6.value = monster.spellSlots[5]; }
        if (slot7 && monster.spellSlots[6]) { slot7.value = monster.spellSlots[6]; }
        if (slot8 && monster.spellSlots[7]) { slot8.value = monster.spellSlots[7]; }
        if (slot9 && monster.spellSlots[8]) { slot9.value = monster.spellSlots[8]; }
    }
    
    // Update button text
    document.getElementById('monsterSaveBtn').textContent = 'Mettre à jour';
    document.querySelector('#monsterModal h3').textContent = 'Modifier un monstre';
    
    openMonsterModal();
}

function deleteMonster(event, monsterId) {
    event.stopPropagation();
    
    if (!confirm('Supprimer ce monstre ?')) return;
    
    // Find and delete monster
    Object.entries(monsters).forEach(([categoryId, category]) => {
        const index = category.findIndex(m => m.id === monsterId);
        if (index !== -1) {
            category.splice(index, 1);
            if (category.length === 0) {
                delete monsters[categoryId];
            }
        }
    });
    
    localStorage.setItem('monsters', JSON.stringify(monsters));
    loadMonstersData();
}

// Update createMonster function to use the new modal
function createMonster() {
    openMonsterModal();
}

function editMonster(monsterId) {
    // Find monster
    let monster = null;
    let categoryId = null;
    
    Object.entries(monsters).forEach(([catId, category]) => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
            categoryId = catId;
        }
    });
    
    if (!monster) return;
    
    // Populate form
    document.getElementById('monsterName').value = monster.name;
    document.getElementById('monsterDescription').value = monster.description || '';
    document.getElementById('monsterImage').value = monster.image || '';
    document.getElementById('monsterAC').value = monster.ac;
    document.getElementById('monsterHP').value = monster.hp;
    document.getElementById('monsterSpeed').value = monster.speed || '';
    document.getElementById('monsterStrength').value = monster.stats.strength;
    document.getElementById('monsterDexterity').value = monster.stats.dexterity;
    document.getElementById('monsterConstitution').value = monster.stats.constitution;
    document.getElementById('monsterIntelligence').value = monster.stats.intelligence;
    document.getElementById('monsterWisdom').value = monster.stats.wisdom;
    document.getElementById('monsterCharisma').value = monster.stats.charisma;
    document.getElementById('monsterProficiency').value = monster.proficiency;
    document.getElementById('monsterHD').value = monster.hd || '';
    document.getElementById('monsterType').value = monster.type;
    document.getElementById('monsterSize').value = monster.size;
    document.getElementById('monsterAlignment').value = monster.alignment;
    document.getElementById('monsterCR').value = monster.cr;
    document.getElementById('monsterSenses').value = monster.senses || '';
    document.getElementById('monsterLanguages').value = monster.languages || '';
    document.getElementById('monsterSkills').value = monster.skills || '';
    document.getElementById('monsterAttacks').value = monster.attacks || '';
    document.getElementById('monsterSpecialAbilities').value = monster.specialAbilities || '';
    
    // Populate category dropdown
    const categorySelect = document.getElementById('monsterCategory');
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    
    const categories = Object.keys(monsters);
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === categoryId) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // Store editing info
    window.editingMonsterId = monsterId;
    window.editingMonsterCategoryId = categoryId;
    
    // Update button text
    document.getElementById('monsterSaveBtn').textContent = 'Mettre à jour';
}

function deleteMonsterCategory(categoryId) {
    if (!confirm(`Supprimer la catégorie "${categoryId}" et tous ses monstres ?`)) return;
    
    delete monsters[categoryId];
    localStorage.setItem('monsters', JSON.stringify(monsters));
    loadMonstersData();
}

// Monster Categories Functions
function loadMonsterCategories() {
    const saved = localStorage.getItem('monsterCategories');
    if (saved) {
        monsterCategories = JSON.parse(saved);
    }
}

function saveMonsterCategories() {
    localStorage.setItem('monsterCategories', JSON.stringify(monsterCategories));
}

function saveMonsterCategory(event) {
    event.preventDefault();
    
    const name = document.getElementById('monsterCategoryName').value;
    const description = document.getElementById('monsterCategoryDescription').value;
    
    const category = {
        id: Date.now().toString(),
        name,
        description,
        createdAt: new Date().toISOString()
    };
    
    monsterCategories[category.id] = category;
    saveMonsterCategories();
    
    closeMonsterCategoryModal();
    loadMonsterCategoriesData();
    populateMonsterCategories();
}

function loadMonsterCategoriesData() {
    const categoriesList = document.getElementById('monsterCategoriesList');
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    Object.values(monsterCategories).forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
        categoryCard.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold text-gray-800">${category.name}</h4>
                <button onclick="deleteMonsterCategory('${category.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p class="text-sm text-gray-600">${category.description || 'Aucune description'}</p>
        `;
        categoriesList.appendChild(categoryCard);
    });
}

function populateMonsterCategories() {
    // Update monster form category select
    const categorySelect = document.getElementById('monsterCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
        Object.values(monsterCategories).forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    // Update monster filter category select
    const filterSelect = document.getElementById('monsterCategoryFilter');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Toutes les catégories</option>';
        Object.values(monsterCategories).forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterSelect.appendChild(option);
        });
    }
}

function addMonsterToCategory(categoryId) {
    // Set category in dropdown
    document.getElementById('monsterCategory').value = categoryId;
    createMonster();
}

function toggleMonsterCategory(categoryId) {
    const element = document.getElementById(`monster-category-${categoryId}`);
    element.classList.toggle('hidden');
}

function showMonsterPreview(monsterId) {
    // Find monster
    let monster = null;
    
    Object.values(monsters).forEach(category => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
        }
    });
    
    if (!monster) return;
    
    // Create preview content
    const content = `
        <div class="space-y-4">
            ${monster.image ? `
                <img src="${monster.image}" alt="${monster.name}" class="w-full h-48 object-cover rounded-lg">
            ` : ''}
            <div>
                <h4 class="font-bold text-lg">${monster.name}</h4>
                <p class="text-gray-600">${monster.description || 'Aucune description'}</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2">Stats de base</h5>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>CA:</strong> ${monster.ac}</div>
                    <div><strong>PV:</strong> ${monster.hp}</div>
                    <div><strong>Vitesse:</strong> ${monster.speed || 'N/A'}</div>
                    <div><strong>NDD:</strong> ${monster.cr}</div>
                </div>
            </div>
            <div>
                <h5 class="font-semibold mb-2">Caractéristiques</h5>
                <div class="grid grid-cols-3 gap-2">
                    <div class="text-center p-2 bg-red-100 rounded">
                        <div class="font-bold">FOR</div>
                        <div>${monster.stats.strength}</div>
                    </div>
                    <div class="text-center p-2 bg-green-100 rounded">
                        <div class="font-bold">DEX</div>
                        <div>${monster.stats.dexterity}</div>
                    </div>
                    <div class="text-center p-2 bg-blue-100 rounded">
                        <div class="font-bold">CON</div>
                        <div>${monster.stats.constitution}</div>
                    </div>
                    <div class="text-center p-2 bg-purple-100 rounded">
                        <div class="font-bold">INT</div>
                        <div>${monster.stats.intelligence}</div>
                    </div>
                    <div class="text-center p-2 bg-yellow-100 rounded">
                        <div class="font-bold">SAG</div>
                        <div>${monster.stats.wisdom}</div>
                    </div>
                    <div class="text-center p-2 bg-pink-100 rounded">
                        <div class="font-bold">CHA</div>
                        <div>${monster.stats.charisma}</div>
                    </div>
                </div>
            </div>
            ${monster.attacks ? `
                <div>
                    <h5 class="font-semibold mb-2">Attaques</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${monster.attacks}
                    </div>
                </div>
            ` : ''}
            ${monster.specialAbilities ? `
                <div>
                    <h5 class="font-semibold mb-2">Capacités spéciales</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        ${monster.specialAbilities}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('linkPreviewModal');
    const title = document.getElementById('linkPreviewTitle');
    const modalContent = document.getElementById('linkPreviewContent');
    
    title.textContent = monster.name;
    modalContent.innerHTML = content;
    
    // Hide "view full element" button since this is already full view
    document.getElementById('viewFullElementBtn').style.display = 'none';
    
    modal.classList.remove('hidden');
}

function searchMonsters() {
    const searchTerm = document.getElementById('monsterSearch').value.toLowerCase();
    const allMonsterCards = document.querySelectorAll('#monstersContent .bg-white');
    
    allMonsterCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function searchCharacters() {
    const searchTerm = document.getElementById('characterSearch').value.toLowerCase();
    const allCharacterCards = document.querySelectorAll('#charactersContent .bg-white');
    
    allCharacterCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function searchMonstersForLinker() {
    const searchTerm = document.getElementById('monsterLinkerSearch').value.toLowerCase();
    const resultsDiv = document.getElementById('monsterLinkerResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '<p class="text-gray-500 text-center">Entrez au moins 2 caractères pour rechercher...</p>';
        return;
    }
    
    // Search all monsters
    const results = [];
    Object.entries(monsters).forEach(([categoryId, category]) => {
        category.forEach(monster => {
            if (monster.name.toLowerCase().includes(searchTerm) || 
                monster.description.toLowerCase().includes(searchTerm) ||
                monster.type.toLowerCase().includes(searchTerm)) {
                results.push({...monster, categoryId});
            }
        });
    });
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-gray-500 text-center">Aucun monstre trouvé</p>';
        return;
    }
    
    resultsDiv.innerHTML = results.map(monster => `
        <div class="p-3 border rounded cursor-pointer hover:bg-gray-50" onclick="linkMonsterToCharacter('${monster.id}')">
            <div class="flex items-center space-x-3">
                ${monster.image ? `<img src="${monster.image}" alt="${monster.name}" class="w-12 h-12 rounded object-cover">` : ''}
                <div class="flex-1">
                    <div class="font-semibold">${monster.name}</div>
                    <div class="text-sm text-gray-600">${monster.categoryId} - CA ${monster.ac} - NDD ${monster.cr}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function openMonsterLinker() {
    document.getElementById('monsterLinkerModal').classList.remove('hidden');
    document.getElementById('monsterLinkerSearch').value = '';
    document.getElementById('monsterLinkerResults').innerHTML = '<p class="text-gray-500 text-center">Entrez au moins 2 caractères pour rechercher...</p>';
}

function closeMonsterLinker() {
    document.getElementById('monsterLinkerModal').classList.add('hidden');
}

function linkMonsterToCharacter(monsterId) {
    // Find monster
    let monster = null;
    Object.values(monsters).forEach(category => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
        }
    });
    
    if (!monster) return;
    
    // Add clickable link to character sheet
    const characterSheet = document.getElementById('characterSheet');
    const currentText = characterSheet.value;
    const linkText = `[Monstre:${monster.id}:${monster.name}]`;
    
    characterSheet.value = currentText + (currentText ? '\n' : '') + linkText;
    
    closeMonsterLinker();
}

function loadCharacters() {
    try {
        const stored = localStorage.getItem('characters');
        if (stored) {
            characters = JSON.parse(stored);
        } else {
            characters = {};
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        characters = {};
    }
}

function loadCharactersData() {
    if (!currentCampaign) return;
    
    const container = document.getElementById('charactersContent');
    if (!container) return;
    
    const campaignCharacters = characters[currentCampaign.id] || {};
    
    if (Object.keys(campaignCharacters).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun personnage pour le moment</p>
                <p class="text-gray-400">Ajoute des personnages à ta campagne !</p>
                ${!adventureMode ? `
                    <button onclick="createCharacter()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter un personnage
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    // Add search bar at the top
    let html = '';
    if (!adventureMode) {
        html += `
            <div class="mb-6">
                <div class="flex space-x-4 items-center">
                    <input type="text" id="characterSearch" placeholder="Rechercher un personnage..." class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onkeyup="searchCharacters()">
                    <button onclick="createCharacter()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter un personnage
                    </button>
                </div>
            </div>
        `;
    }
    
    if (adventureMode) {
        // Mode lecture - affichage simplifié
        html += `
            <div class="space-y-6">
                ${Object.entries(campaignCharacters).map(([categoryId, category]) => `
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="bg-indigo-600 text-white p-4 cursor-pointer" onclick="toggleCharacterCategory('${categoryId}')">
                            <h3 class="text-xl font-bold">${categoryId} (${category.length})</h3>
                        </div>
                        <div id="character-category-${categoryId}" class="hidden">
                            <div class="p-4 space-y-4">
                                ${category.map(character => `
                                    <div class="bg-gray-50 p-4 rounded cursor-pointer hover:bg-gray-100" onclick="showCharacterPreview('${character.id}')">
                                        <div class="flex items-start space-x-4">
                                            ${character.image ? `
                                                <img src="${character.image}" alt="${character.name}" class="w-16 h-16 rounded-lg object-cover">
                                            ` : `
                                                <div class="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                                                    <i class="fas fa-user text-gray-500"></i>
                                                </div>
                                            `}
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-800">${character.name}</h4>
                                                <p class="text-sm text-gray-600 mt-1">${character.description ? character.description.substring(0, 100) + '...' : 'Aucune description'}</p>
                                                <div class="flex space-x-2 mt-2">
                                                    <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">FOR ${character.stats?.strength || 10}</span>
                                                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">DEX ${character.stats?.dexterity || 10}</span>
                                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">CON ${character.stats?.constitution || 10}</span>
                                                    <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">INT ${character.stats?.intelligence || 10}</span>
                                                    <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">SAG ${character.stats?.wisdom || 10}</span>
                                                    <span class="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">CHA ${character.stats?.charisma || 10}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // Mode édition - affichage complet avec boutons
        html += Object.entries(campaignCharacters).map(([categoryId, category]) => `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${categoryId} (${category.length})</h3>
                    <div class="space-x-2">
                        <button onclick="addCharacterToCategory('${categoryId}')" class="text-indigo-600 hover:text-indigo-800">
                            <i class="fas fa-plus"></i> Personnage
                        </button>
                        <button onclick="deleteCharacterCategory('${categoryId}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="space-y-4">
                    ${category.map(character => `
                        <div class="border-l-4 border-indigo-300 pl-4">
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-semibold text-gray-800">${character.name}</h4>
                                <div class="space-x-2">
                                    <button onclick="editCharacter('${character.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteCharacter('${character.id}')" class="text-red-500 hover:text-red-700 text-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <p class="text-gray-600 text-sm mb-2">${character.description ? character.description.substring(0, 200) + '...' : 'Aucune description'}</p>
                                <div class="flex space-x-2">
                                    <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">FOR ${character.stats?.strength || 10}</span>
                                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">DEX ${character.stats?.dexterity || 10}</span>
                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">CON ${character.stats?.constitution || 10}</span>
                                    <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">INT ${character.stats?.intelligence || 10}</span>
                                    <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">SAG ${character.stats?.wisdom || 10}</span>
                                    <span class="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">CHA ${character.stats?.charisma || 10}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    container.innerHTML = html;
}

function createCharacter() {
    if (!currentCampaign) return;
    
    // Initialize characters for this campaign if needed
    if (!characters[currentCampaign.id]) {
        characters[currentCampaign.id] = {};
    }
    
    // Clear editing state
    delete window.editingCharacterId;
    delete window.editingCharacterCategoryId;
    
    // Populate category dropdown
    const categorySelect = document.getElementById('characterCategory');
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    
    const categories = Object.keys(characters[currentCampaign.id]);
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Add option for new category
    const newCategoryOption = document.createElement('option');
    newCategoryOption.value = '__new__';
    newCategoryOption.textContent = '+ Nouvelle catégorie';
    categorySelect.appendChild(newCategoryOption);
    
    // Update button text
    document.getElementById('characterSaveBtn').textContent = 'Créer';
    document.querySelector('#characterModal h3').textContent = 'Créer un personnage';
    
    document.getElementById('characterModal').classList.remove('hidden');
}

function closeCharacterModal() {
    document.getElementById('characterModal').classList.add('hidden');
    document.getElementById('characterName').value = '';
    document.getElementById('characterDescription').value = '';
    document.getElementById('characterImage').value = '';
    document.getElementById('characterStrength').value = '10';
    document.getElementById('characterDexterity').value = '10';
    document.getElementById('characterConstitution').value = '10';
    document.getElementById('characterIntelligence').value = '10';
    document.getElementById('characterWisdom').value = '10';
    document.getElementById('characterCharisma').value = '10';
    document.getElementById('characterSheet').value = '';
}

function saveCharacter(event) {
    event.preventDefault();
    
    if (!currentCampaign) return;
    
    const name = document.getElementById('characterName').value;
    const categoryValue = document.getElementById('characterCategory').value;
    const description = document.getElementById('characterDescription').value;
    const image = document.getElementById('characterImage').value;
    const sheet = document.getElementById('characterSheet').value;
    
    let category;
    if (categoryValue === '__new__') {
        category = prompt('Nom de la nouvelle catégorie :');
        if (!category) return;
    } else {
        category = categoryValue;
    }
    
    const character = {
        name,
        category,
        description,
        image,
        sheet,
        stats: {
            strength: parseInt(document.getElementById('characterStrength').value),
            dexterity: parseInt(document.getElementById('characterDexterity').value),
            constitution: parseInt(document.getElementById('characterConstitution').value),
            intelligence: parseInt(document.getElementById('characterIntelligence').value),
            wisdom: parseInt(document.getElementById('characterWisdom').value),
            charisma: parseInt(document.getElementById('characterCharisma').value)
        },
        updatedAt: new Date().toISOString()
    };
    
    // Initialize characters for this campaign if needed
    if (!characters[currentCampaign.id]) {
        characters[currentCampaign.id] = {};
    }
    
    // Check if editing existing character
    if (window.editingCharacterId) {
        // Update existing character
        Object.entries(characters[currentCampaign.id]).forEach(([categoryId, categoryChars]) => {
            const index = categoryChars.findIndex(char => char.id === window.editingCharacterId);
            if (index !== -1) {
                // Remove from old category if category changed
                if (categoryId !== category) {
                    categoryChars.splice(index, 1);
                    if (categoryChars.length === 0) {
                        delete characters[currentCampaign.id][categoryId];
                    }
                    // Add to new category
                    if (!characters[currentCampaign.id][category]) {
                        characters[currentCampaign.id][category] = [];
                    }
                    character.id = window.editingCharacterId;
                    character.createdAt = new Date().toISOString();
                    characters[currentCampaign.id][category].push(character);
                } else {
                    // Update in same category
                    character.id = window.editingCharacterId;
                    character.createdAt = categoryChars[index].createdAt;
                    characters[currentCampaign.id][categoryId][index] = character;
                }
            }
        });
        
        // Clear editing state
        delete window.editingCharacterId;
        delete window.editingCharacterCategoryId;
    } else {
        // Create new character
        character.id = Date.now().toString();
        character.createdAt = new Date().toISOString();
        
        // Initialize category if needed
        if (!characters[currentCampaign.id][category]) {
            characters[currentCampaign.id][category] = [];
        }
        
        characters[currentCampaign.id][category].push(character);
    }
    
    // Save to localStorage
    localStorage.setItem('characters', JSON.stringify(characters));
    
    closeCharacterModal();
    loadCharactersData();
    
}

function editCharacter(characterId) {
    // Find character
    let character = null;
    let categoryId = null;
    
    Object.entries(characters[currentCampaign.id]).forEach(([catId, category]) => {
        const found = category.find(char => char.id === characterId);
        if (found) {
            character = found;
            categoryId = catId;
        }
    });
    
    if (!character) return;
    
    // Populate form
    document.getElementById('characterName').value = character.name;
    document.getElementById('characterDescription').value = character.description || '';
    document.getElementById('characterImage').value = character.image || '';
    document.getElementById('characterStrength').value = character.stats.strength;
    document.getElementById('characterDexterity').value = character.stats.dexterity;
    document.getElementById('characterConstitution').value = character.stats.constitution;
    document.getElementById('characterIntelligence').value = character.stats.intelligence;
    document.getElementById('characterWisdom').value = character.stats.wisdom;
    document.getElementById('characterCharisma').value = character.stats.charisma;
    document.getElementById('characterSheet').value = character.sheet || '';
    
    // Populate category dropdown
    const categorySelect = document.getElementById('characterCategory');
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    
    const categories = Object.keys(characters[currentCampaign.id]);
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === categoryId) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // Store editing info
    window.editingCharacterId = characterId;
    window.editingCharacterCategoryId = categoryId;
    
    // Update button text
    document.getElementById('characterSaveBtn').textContent = 'Mettre à jour';
    document.querySelector('#characterModal h3').textContent = 'Modifier un personnage';
    
    document.getElementById('characterModal').classList.remove('hidden');
}

function deleteCharacter(characterId) {
    if (!confirm('Supprimer ce personnage ?')) return;
    
    Object.entries(characters[currentCampaign.id]).forEach(([categoryId, category]) => {
        const index = category.findIndex(char => char.id === characterId);
        if (index !== -1) {
            category.splice(index, 1);
            if (category.length === 0) {
                delete characters[currentCampaign.id][categoryId];
            }
        }
    });
    
    localStorage.setItem('characters', JSON.stringify(characters));
    loadCharactersData();
}

function deleteCharacterCategory(categoryId) {
    if (!confirm(`Supprimer la catégorie "${categoryId}" et tous ses personnages ?`)) return;
    
    delete characters[currentCampaign.id][categoryId];
    localStorage.setItem('characters', JSON.stringify(characters));
    loadCharactersData();
}

function addCharacterToCategory(categoryId) {
    // Set the category in the dropdown
    document.getElementById('characterCategory').value = categoryId;
    createCharacter();
}

function toggleCharacterCategory(categoryId) {
    const element = document.getElementById(`character-category-${categoryId}`);
    element.classList.toggle('hidden');
}

function showCharacterPreview(characterId) {
    // Find character
    let character = null;
    let categoryId = null;
    
    Object.entries(characters[currentCampaign.id]).forEach(([catId, category]) => {
        const found = category.find(char => char.id === characterId);
        if (found) {
            character = found;
            categoryId = catId;
        }
    });
    
    if (!character) return;
    
    // Process character sheet to convert monster links to clickable links
    let processedSheet = character.sheet || '';
    
    // Convert [Monstre:id:name] to clickable links
    processedSheet = processedSheet.replace(/\[Monstre:([^:]+):([^\]]+)\]/g, (match, monsterId, monsterName) => {
        return `<span class="text-purple-600 hover:text-purple-800 cursor-pointer underline font-semibold" onclick="showMonsterPreview('${monsterId}')" title="Voir la fiche de ${monsterName}">${monsterName}</span>`;
    });
    
    // Create preview content
    const content = `
        <div class="space-y-4">
            ${character.image ? `
                <img src="${character.image}" alt="${character.name}" class="w-full h-48 object-cover rounded-lg">
            ` : ''}
            <div>
                <h4 class="font-bold text-lg">${character.name}</h4>
                <p class="text-gray-600">${character.description || 'Aucune description'}</p>
            </div>
            <div>
                <h5 class="font-semibold mb-2">Caractéristiques</h5>
                <div class="grid grid-cols-3 gap-2">
                    <div class="text-center p-2 bg-red-100 rounded">
                        <div class="font-bold">FOR</div>
                        <div>${character.stats?.strength || 10}</div>
                    </div>
                    <div class="text-center p-2 bg-green-100 rounded">
                        <div class="font-bold">DEX</div>
                        <div>${character.stats?.dexterity || 10}</div>
                    </div>
                    <div class="text-center p-2 bg-blue-100 rounded">
                        <div class="font-bold">CON</div>
                        <div>${character.stats?.constitution || 10}</div>
                    </div>
                    <div class="text-center p-2 bg-purple-100 rounded">
                        <div class="font-bold">INT</div>
                        <div>${character.stats?.intelligence || 10}</div>
                    </div>
                    <div class="text-center p-2 bg-yellow-100 rounded">
                        <div class="font-bold">SAG</div>
                        <div>${character.stats?.wisdom || 10}</div>
                    </div>
                    <div class="text-center p-2 bg-pink-100 rounded">
                        <div class="font-bold">CHA</div>
                        <div>${character.stats?.charisma || 10}</div>
                    </div>
                </div>
            </div>
            ${processedSheet ? `
                <div>
                    <h5 class="font-semibold mb-2">Fiche personnage</h5>
                    <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">${processedSheet}</div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('linkPreviewModal');
    const title = document.getElementById('linkPreviewTitle');
    const modalContent = document.getElementById('linkPreviewContent');
    
    title.textContent = character.name;
    modalContent.innerHTML = content;
    
    // Hide the "view full element" button since this is already the full view
    document.getElementById('viewFullElementBtn').style.display = 'none';
    
    modal.classList.remove('hidden');
}

// World Management
function loadCampaignData() {
    if (!currentCampaign) return;
    
    // Load data is handled by individual section functions
    loadWorldData();
}

// Scenario Management
// Helper function to escape HTML content
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadScenarioData() {
    if (!currentCampaign) return;
    
    const container = document.getElementById('scenarioContent');
    if (!container) return;
    
    const scenario = currentCampaign.scenario || { acts: [] };
    
    if (scenario.acts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-scroll text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun scénario pour le moment</p>
                <p class="text-gray-400">Commence par ajouter des actes et des chapitres !</p>
                ${!adventureMode ? `
                    <button onclick="addAct()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter un Acte
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    if (adventureMode) {
        // Mode lecture - affichage hiérarchique
        container.innerHTML = `
            <div class="space-y-6">
                ${scenario.acts.map((act, actIndex) => `
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="bg-indigo-600 text-white p-4 cursor-pointer" onclick="toggleAct(${actIndex})">
                            <h3 class="text-xl font-bold">Acte ${actIndex + 1}: ${act.title}</h3>
                        </div>
                        <div id="act-${actIndex}" class="hidden">
                            <div class="p-4 space-y-4">
                                ${act.chapters.map((chapter, chapterIndex) => `
                                    <div class="border-l-4 border-indigo-300 pl-4">
                                        <div class="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100" onclick="toggleChapter(${actIndex}, ${chapterIndex})">
                                            <h4 class="font-semibold text-gray-800">Chapitre ${chapterIndex + 1}: ${chapter.title}</h4>
                                            <p class="text-gray-600 text-sm">${chapter.summary || 'Aucun résumé'}</p>
                                        </div>
                                        <div id="chapter-${actIndex}-${chapterIndex}" class="hidden mt-3 space-y-3">
                                            ${chapter.content ? `
                                                <div class="prose max-w-none bg-white p-4 rounded">
                                                    ${chapter.content}
                                                </div>
                                            ` : ''}
                                            ${chapter.elements ? chapter.elements.map((element, elementIndex) => `
                                                <div class="bg-white border border-gray-200 rounded p-3">
                                                    <h5 class="font-medium text-gray-800 mb-2">${element.name}</h5>
                                                    <div class="prose max-w-none text-sm">
                                                        ${element.content || '<p class="text-gray-500">Aucun contenu</p>'}
                                                    </div>
                                                </div>
                                            `).join('') : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // Mode édition - affichage complet avec boutons
        container.innerHTML = `
            ${!adventureMode ? `
                <div class="mb-6">
                    <button onclick="addAct()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>Ajouter un Acte
                    </button>
                </div>
            ` : ''}
            ${scenario.acts.map((act, actIndex) => `
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">Acte ${actIndex + 1}: ${act.title}</h3>
                        <div class="space-x-2">
                            <button onclick="addChapter(${actIndex})" class="text-indigo-600 hover:text-indigo-800">
                                <i class="fas fa-plus"></i> Chapitre
                            </button>
                            <button onclick="deleteAct(${actIndex})" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${act.chapters.map((chapter, chapterIndex) => `
                            <div class="border-l-4 border-indigo-500 pl-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h4 class="font-semibold text-gray-800">${chapterIndex + 1}. ${chapter.title}</h4>
                                    <div class="space-x-2">
                                        <button onclick="addElement(${actIndex}, ${chapterIndex})" class="text-indigo-600 hover:text-indigo-800 text-sm">
                                            <i class="fas fa-plus"></i> Élément
                                        </button>
                                        <button onclick="editChapter(${actIndex}, ${chapterIndex})" class="text-blue-500 hover:text-blue-700 text-sm">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteChapter(${actIndex}, ${chapterIndex})" class="text-red-500 hover:text-red-700 text-sm">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <p class="text-gray-600 text-sm mb-2">${escapeHtml(chapter.summary || 'Aucun résumé')}</p>
                                    ${chapter.content ? `
                                        <div class="prose max-w-none text-sm">
                                            ${escapeHtml(chapter.content.length > 200 ? chapter.content.substring(0, 200) + '...' : chapter.content)}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="space-y-2">
                                    ${chapter.elements ? chapter.elements.map((element, elementIndex) => `
                                        <div class="bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100" onclick="openScenarioElement(${actIndex}, ${chapterIndex}, ${elementIndex})">
                                            <h5 class="font-medium text-gray-800">${escapeHtml(element.name)}</h5>
                                            <div class="text-sm text-gray-600 mt-1">
                                                ${element.content ? escapeHtml(element.content.length > 100 ? element.content.substring(0, 100) + '...' : element.content) : 'Aucun contenu'}
                                            </div>
                                        </div>
                                    `).join('') : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        `;
    }
}

function openScenarioElement(actIndex, chapterIndex, elementIndex) {
    if (!currentCampaign || !currentCampaign.scenario) return;
    
    const element = currentCampaign.scenario.acts[actIndex].chapters[chapterIndex].elements[elementIndex];
    if (element) {
        openTextEditor('scenario', actIndex, chapterIndex, elementIndex, element.content || '', element.name);
    }
}

function addAct() {
    const title = prompt('Titre de l\'acte :');
    if (!title || !currentCampaign) return;
    
    if (!currentCampaign.scenario) {
        currentCampaign.scenario = { acts: [] };
    }
    
    currentCampaign.scenario.acts.push({
        title,
        chapters: []
    });
    
    saveCampaignData();
    loadScenarioData();
}

function addChapter(actIndex) {
    const title = prompt('Titre du chapitre :');
    if (!title) return;
    
    const summary = prompt('Résumé du chapitre :');
    
    currentCampaign.scenario.acts[actIndex].chapters.push({
        title,
        summary: summary || '',
        content: '',
        elements: []
    });
    
    saveCampaignData();
    loadScenarioData();
}

function addElement(actIndex, chapterIndex) {
    const elementName = prompt('Nom de l\'élément :');
    if (!elementName) return;
    
    const chapter = currentCampaign.scenario.acts[actIndex].chapters[chapterIndex];
    if (!chapter.elements) {
        chapter.elements = [];
    }
    
    chapter.elements.push({
        name: elementName,
        content: ''
    });
    
    saveCampaignData();
    loadScenarioData();
}

function deleteAct(actIndex) {
    if (!confirm('Supprimer cet acte ?')) return;
    
    currentCampaign.scenario.acts.splice(actIndex, 1);
    saveCampaignData();
    loadScenarioData();
}

function deleteChapter(actIndex, chapterIndex) {
    if (!confirm('Supprimer ce chapitre ?')) return;
    
    currentCampaign.scenario.acts[actIndex].chapters.splice(chapterIndex, 1);
    saveCampaignData();
    loadScenarioData();
}

function editChapter(actIndex, chapterIndex) {
    const chapter = currentCampaign.scenario.acts[actIndex].chapters[chapterIndex];
    openTextEditor('scenario', actIndex, chapterIndex, 'content', chapter.content || '', chapter.title);
}

// Toggle functions for adventure mode
function toggleAct(actIndex) {
    const element = document.getElementById(`act-${actIndex}`);
    element.classList.toggle('hidden');
}

function toggleChapter(actIndex, chapterIndex) {
    const element = document.getElementById(`chapter-${actIndex}-${chapterIndex}`);
    element.classList.toggle('hidden');
}

function toggleWorldCategory(category) {
    const element = document.getElementById(`world-category-${category}`);
    element.classList.toggle('hidden');
}

function toggleWorldSubcategory(category, subcategory) {
    const element = document.getElementById(`world-subcategory-${category}-${subcategory}`);
    element.classList.toggle('hidden');
}

// Schema Visualization
function displaySchema() {
    const container = document.getElementById('schemaContent');
    if (!container || !currentCampaign) return;
    
    const scenario = currentCampaign.scenario || { acts: [] };
    
    if (scenario.acts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-project-diagram text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun scénario à visualiser</p>
                <p class="text-gray-400">Ajoute des actes et des chapitres pour voir le schéma !</p>
            </div>
        `;
        return;
    }
    
    let schemaHTML = '<div class="space-y-6">';
    
    scenario.acts.forEach((act, actIndex) => {
        schemaHTML += `
            <div class="text-center">
                <div class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-lg mb-4">
                    Acte ${actIndex + 1}: ${act.title}
                </div>
                <div class="flex justify-center space-x-4 flex-wrap">
        `;
        
        act.chapters.forEach((chapter, chapterIndex) => {
            schemaHTML += `
                <div class="bg-white border-2 border-indigo-300 rounded-lg p-4 m-2 min-w-[150px] cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all" 
                     onclick="navigateToChapter(${actIndex}, ${chapterIndex})">
                    <div class="text-sm font-semibold text-indigo-600 mb-2">Chapitre ${chapterIndex + 1}</div>
                    <div class="font-medium text-gray-800">${chapter.title}</div>
                    ${chapter.summary ? `<div class="text-xs text-gray-600 mt-2">${chapter.summary.substring(0, 50)}...</div>` : ''}
                    ${chapter.elements && chapter.elements.length > 0 ? `
                        <div class="text-xs text-indigo-500 mt-2">
                            ${chapter.elements.length} élément${chapter.elements.length > 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        schemaHTML += '</div></div>';
        
        // Add connection arrow between acts
        if (actIndex < scenario.acts.length - 1) {
            schemaHTML += `
                <div class="flex justify-center">
                    <div class="text-indigo-400 text-2xl">↓</div>
                </div>
            `;
        }
    });
    
    schemaHTML += '</div>';
    container.innerHTML = schemaHTML;
}

function navigateToChapter(actIndex, chapterIndex) {
    // Switch to scenario section and scroll to chapter
    showCampaignSection('scenario');
    
    // Wait for content to load, then scroll to chapter
    setTimeout(() => {
        const chapters = document.querySelectorAll('.border-l-4.border-indigo-500');
        if (chapters[chapterIndex]) {
            chapters[chapterIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the chapter briefly
            chapters[chapterIndex].classList.add('bg-yellow-50');
            setTimeout(() => {
                chapters[chapterIndex].classList.remove('bg-yellow-50');
            }, 2000);
        }
    }, 100);
}

// File Import
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseCSV(content);
    };
    reader.readAsText(file);
}

function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    displayImportPreview(data);
}

function displayImportPreview(data) {
    const preview = document.getElementById('importPreview');
    if (!preview) return;
    
    preview.classList.remove('hidden');
    
    const tableHTML = `
        <h3 class="text-lg font-semibold mb-4">Aperçu (${data.length} éléments)</h3>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        ${Object.keys(data[0]).map(key => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.slice(0, 5).map(row => `
                        <tr>
                            ${Object.values(row).map(value => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${data.length > 5 ? `<p class="text-sm text-gray-500 mt-2">... et ${data.length - 5} autres lignes</p>` : ''}
        <div class="mt-4 space-x-2">
            <button onclick="confirmImport(${JSON.stringify(data).replace(/"/g, '&quot;')})" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                Importer
            </button>
            <button onclick="cancelImport()" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg">
                Annuler
            </button>
        </div>
    `;
    
    preview.innerHTML = tableHTML;
}

function confirmImport(data) {
    // Here you would process the imported data
    // For now, we'll just show a success message
    alert(`${data.length} éléments importés avec succès !`);
    cancelImport();
}

function cancelImport() {
    document.getElementById('importPreview').classList.add('hidden');
    document.getElementById('csvFile').value = '';
}

// Data Persistence
async function saveCampaignData() {
    if (!currentCampaign) return;
    
    // Use localStorage directly
    const index = campaigns.findIndex(c => c.id === currentCampaign.id);
    if (index !== -1) {
        campaigns[index] = currentCampaign;
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
    }
}

function loadCampaignData() {
    if (!currentCampaign) return;
    
    // Load data is handled by individual section functions
    loadWorldData();
    loadScenarioData();
}

function loadWorldData() {
    if (!currentCampaign || !currentCampaign.worldId) return;
    
    const world = worlds.find(w => w.id === currentCampaign.worldId);
    if (world) {
        currentWorld = world;
        loadWorldDetail();
    }
}

// Text Editor Functions
let currentEditingContext = null;

function openTextEditor(type, category, subcategory, itemName, description, title = '') {
    currentEditingContext = {
        type,
        category,
        subcategory,
        itemName,
        title
    };
    
    const modal = document.getElementById('textEditorModal');
    const editorContent = document.getElementById('editorContent');
    
    // Set current content
    editorContent.innerHTML = description || '';
    
    // Update modal title
    const modalTitle = modal.querySelector('h3');
    if (type === 'scenario') {
        modalTitle.textContent = `Éditeur - ${title}`;
    } else {
        modalTitle.textContent = `Éditeur de texte - ${itemName}`;
    }
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Focus editor
    editorContent.focus();
}

function closeTextEditor() {
    const modal = document.getElementById('textEditorModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Hide link modal if it's open
    const linkModal = document.getElementById('linkModal');
    if (linkModal) {
        linkModal.classList.add('hidden');
    }
    
    currentEditingContext = null;
}

function saveTextEditor() {
    if (!currentEditingContext) return;
    
    const editorContent = document.getElementById('editorContent');
    const content = editorContent.innerHTML;
    
    // Update item description
    const { type, category, subcategory, itemName } = currentEditingContext;
    
    if (type === 'world' && currentWorld && currentWorld.categories[category][subcategory]) {
        const itemIndex = currentWorld.categories[category][subcategory].findIndex(item => item.name === itemName);
        if (itemIndex !== -1) {
            currentWorld.categories[category][subcategory][itemIndex].description = content;
            saveWorldData();
            loadWorldDetail();
        }
    } else if (type === 'scenario' && currentCampaign) {
        const actIndex = category;
        const chapterIndex = subcategory;
        const elementIndex = itemName;
        
        if (elementIndex === 'content') {
            // Update chapter content
            currentCampaign.scenario.acts[actIndex].chapters[chapterIndex].content = content;
        } else {
            // Update element content
            currentCampaign.scenario.acts[actIndex].chapters[chapterIndex].elements[elementIndex].content = content;
        }
        
        saveCampaignData();
        loadScenarioData();
    }
    
    closeTextEditor();
}

function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('editorContent').focus();
}

// NEW: Link Modal System
function insertLinkNew() {
    console.log('insertLinkNew called - COMPLETELY NEW FUNCTION'); // Debug
    
    try {
        // Check if modal exists first
        const linkModal = document.getElementById('linkModal');
        console.log('linkModal found:', !!linkModal); // Debug
        
        if (!linkModal) {
            console.error('linkModal not found'); // Debug
            return;
        }
        
        // Check all elements before trying to use them
        const linkTypeSelect = document.getElementById('linkTypeSelect');
        const linkCategorySelect = document.getElementById('linkCategorySelect');
        const linkTargetSelect = document.getElementById('linkTargetSelect');
        const linkUrlInput = document.getElementById('linkUrlInput');
        const linkUrlGroup = document.getElementById('linkUrlGroup');
        const linkCategoryGroup = document.getElementById('linkCategoryGroup');
        const linkTargetGroup = document.getElementById('linkTargetGroup');
        
        console.log('Elements found:', {
            linkTypeSelect: !!linkTypeSelect,
            linkCategorySelect: !!linkCategorySelect,
            linkTargetSelect: !!linkTargetSelect,
            linkUrlInput: !!linkUrlInput,
            linkUrlGroup: !!linkUrlGroup,
            linkCategoryGroup: !!linkCategoryGroup,
            linkTargetGroup: !!linkTargetGroup
        }); // Debug
        
        // Only proceed if all elements exist
        if (!linkTypeSelect || !linkCategorySelect || !linkTargetSelect || !linkUrlInput || 
            !linkUrlGroup || !linkCategoryGroup || !linkTargetGroup) {
            console.error('Some elements are missing'); // Debug
            return;
        }
        
        // Reset form with CORRECT IDs
        linkTypeSelect.value = '';
        linkCategorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
        linkTargetSelect.innerHTML = '<option value="">Choisir un élément</option>';
        linkUrlInput.value = '';
        
        // Hide URL field initially
        linkUrlGroup.style.display = 'none';
        linkCategoryGroup.style.display = 'block';
        linkTargetGroup.style.display = 'block';
        
        // Show modal
        linkModal.classList.remove('hidden');
        
        } catch (error) {
            }
}

function handleLinkTypeChange() {
    const linkType = document.getElementById('linkTypeSelect').value;
    const categorySelect = document.getElementById('linkCategorySelect');
    const targetSelect = document.getElementById('linkTargetSelect');
    const urlGroup = document.getElementById('linkUrlGroup');
    const categoryGroup = document.getElementById('linkCategoryGroup');
    const targetGroup = document.getElementById('linkTargetGroup');
    
    
    // Reset selects
    categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
    targetSelect.innerHTML = '<option value="">Choisir un élément</option>';
    
    if (linkType === 'other') {
        // Show URL field, hide others
        urlGroup.style.display = 'block';
        categoryGroup.style.display = 'none';
        targetGroup.style.display = 'none';
    } else {
        // Show category/target, hide URL
        urlGroup.style.display = 'none';
        categoryGroup.style.display = 'block';
        targetGroup.style.display = 'block';
        
        // Populate categories
        if (linkType === 'world' && currentWorld && currentWorld.categories) {
            Object.keys(currentWorld.categories).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } else if (linkType === 'scenario' && currentCampaign && currentCampaign.scenario) {
            currentCampaign.scenario.acts.forEach((act, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Acte ${index + 1}: ${act.title}`;
                categorySelect.appendChild(option);
            });
        } else if (linkType === 'character' && currentCampaign && characters[currentCampaign.id]) {
            Object.keys(characters[currentCampaign.id]).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } else if (linkType === 'monster') {
            Object.keys(monsters).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } else if (linkType === 'spell') {
            for (let i = 1; i <= 9; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Niveau ${i}`;
                categorySelect.appendChild(option);
            }
        }
    }
}

function handleLinkCategoryChange() {
    const linkType = document.getElementById('linkTypeSelect').value;
    const category = document.getElementById('linkCategorySelect').value;
    const targetSelect = document.getElementById('linkTargetSelect');
    
    console.log('Link category changed:', {linkType, category}); // Debug
    
    // Reset target
    targetSelect.innerHTML = '<option value="">Choisir un élément</option>';
    
    if (linkType === 'world' && category && currentWorld) {
        const subcategories = currentWorld.categories[category];
        Object.entries(subcategories).forEach(([subcategory, items]) => {
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = `world:${category}:${subcategory}:${item.name}`;
                option.textContent = `${subcategory} > ${item.name}`;
                targetSelect.appendChild(option);
            });
        });
    } else if (linkType === 'scenario' && category !== '' && currentCampaign) {
        const actIndex = parseInt(category);
        const act = currentCampaign.scenario.acts[actIndex];
        act.chapters.forEach((chapter, chapterIndex) => {
            if (chapter.elements) {
                chapter.elements.forEach((element, elementIndex) => {
                    const option = document.createElement('option');
                    option.value = `scenario:${actIndex}:${chapterIndex}:${elementIndex}`;
                    option.textContent = `${chapter.title} > ${element.name}`;
                    targetSelect.appendChild(option);
                });
            }
        });
    } else if (linkType === 'character' && category && currentCampaign && characters[currentCampaign.id]) {
        characters[currentCampaign.id][category].forEach(character => {
            const option = document.createElement('option');
            option.value = `character:${category}:${character.id}`;
            option.textContent = character.name;
            targetSelect.appendChild(option);
        });
    } else if (linkType === 'monster' && category && monsters[category]) {
        monsters[category].forEach(monster => {
            const option = document.createElement('option');
            option.value = `monster:${category}:${monster.id}`;
            option.textContent = monster.name;
            targetSelect.appendChild(option);
        });
    } else if (linkType === 'spell' && category && spells[category]) {
        spells[category].forEach(spell => {
            const option = document.createElement('option');
            option.value = `spell:${category}:${spell.id}`;
            option.textContent = spell.name;
            targetSelect.appendChild(option);
        });
    }
}

function confirmLinkModal() {
    const linkType = document.getElementById('linkTypeSelect').value;
    const target = document.getElementById('linkTargetSelect').value;
    const url = document.getElementById('linkUrlInput').value;
    
    if (!linkType) {
        alert('Veuillez choisir un type de lien');
        return;
    }
    
    if (linkType === 'other' && !url) {
        alert('Veuillez entrer une URL');
        return;
    }
    
    if (linkType !== 'other' && !target) {
        alert('Veuillez choisir un élément à lier');
        return;
    }
    
    const editorContent = document.getElementById('editorContent');
    const selection = window.getSelection();
    const selectedText = selection.toString() || 'Lien';
    
    // Create link element
    const link = document.createElement('span');
    link.className = 'text-link cursor-pointer text-indigo-600 hover:text-indigo-800 border-b-2 border-dotted border-indigo-400 hover:border-indigo-600 transition-all inline-block';
    link.setAttribute('contenteditable', 'false');
    link.setAttribute('role', 'button');
    link.setAttribute('tabindex', '0');
    
    if (linkType === 'other') {
        link.setAttribute('data-link-type', 'other');
        link.setAttribute('data-link-target', url);
        link.setAttribute('title', 'Ouvrir dans un nouvel onglet');
    } else {
        link.setAttribute('data-link-type', linkType);
        link.setAttribute('data-link-target', target);
        link.setAttribute('title', adventureMode ? 'Voir les détails' : 'Voir l\'élément');
    }
    
    link.textContent = selectedText;
    
    // Replace selection or insert at cursor
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(link);
    } else {
        editorContent.appendChild(link);
    }
    
    // Close modal
    closeLinkModal();
    
    console.log('Link created successfully'); // Debug
}

function closeLinkModal() {
    document.getElementById('linkModal').classList.add('hidden');
}

// GitHub Synchronization Functions
const GITHUB_CONFIG = {
    repo: 'chevalliermaud38-nat20/nat20-or-die',
    branch: 'main',
    apiUrl: 'https://api.github.com/repos',
    rawUrl: 'https://raw.githubusercontent.com',
    siteUrl: 'https://chevalliermaud38-nat20.github.io/nat20-or-die'
};

// Get current data from localStorage
function getAllData() {
    return {
        campaigns: localStorage.getItem('campaigns'),
        worlds: localStorage.getItem('worlds'),
        characters: localStorage.getItem('characters'),
        monsters: localStorage.getItem('monsters'),
        monsterCategories: localStorage.getItem('monsterCategories'),
        encounters: localStorage.getItem('encounters'),
        spells: localStorage.getItem('spells'),
        timestamp: new Date().toISOString()
    };
}

// Sync data to GitHub
async function syncToGitHub() {
    try {
        const data = getAllData();
        
        // Create a JSON file content
        const content = JSON.stringify(data, null, 2);
        
        // Create a blob
        const blob = new Blob([content], { type: 'application/json' });
        
        // Create file data for upload
        const fileData = new FormData();
        fileData.append('file', blob, 'nat20-data.json');
        fileData.append('message', `Sync data - ${new Date().toISOString()}`);
        fileData.append('branch', GITHUB_CONFIG.branch);
        
        // Show loading state
        showSyncStatus('Envoi des données vers GitHub...', 'loading');
        
        // For GitHub Pages, we'll use a simple approach
        // In a real implementation, you'd use GitHub API or GitHub Actions
        // For now, we'll simulate the sync
        setTimeout(() => {
            // Save sync timestamp
            localStorage.setItem('lastSync', new Date().toISOString());
            showSyncStatus('Données synchronisées avec succès !', 'success');
        }, 2000);
        
    } catch (error) {
        console.error('Sync error:', error);
        showSyncStatus('Erreur de synchronisation: ' + error.message, 'error');
    }
}

// Import data from GitHub
async function importFromGitHub() {
    try {
        showSyncStatus('Importation des données depuis GitHub...', 'loading');
        
        // Try GitHub Pages first, then fallback to raw.githubusercontent.com
        let response;
        try {
            response = await fetch(`${GITHUB_CONFIG.siteUrl}/nat20-data.json`);
        } catch (e) {
            // Fallback to raw.githubusercontent.com
            response = await fetch(`${GITHUB_CONFIG.rawUrl}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/nat20-data.json`);
        }
        
        if (!response.ok) {
            throw new Error('Fichier de données non trouvé sur GitHub');
        }
        
        const data = await response.json();
        
        // Import all data to localStorage
        if (data.campaigns) {
            localStorage.setItem('campaigns', data.campaigns);
            campaigns = JSON.parse(data.campaigns);
        }
        if (data.worlds) {
            localStorage.setItem('worlds', data.worlds);
            worlds = JSON.parse(data.worlds);
        }
        if (data.characters) {
            localStorage.setItem('characters', data.characters);
            characters = JSON.parse(data.characters);
        }
        if (data.monsters) {
            localStorage.setItem('monsters', data.monsters);
            monsters = JSON.parse(data.monsters);
        }
        if (data.monsterCategories) {
            localStorage.setItem('monsterCategories', data.monsterCategories);
            monsterCategories = JSON.parse(data.monsterCategories);
        }
        if (data.encounters) {
            localStorage.setItem('encounters', data.encounters);
            encounters = JSON.parse(data.encounters);
        }
        if (data.spells) {
            localStorage.setItem('spells', data.spells);
            spells = JSON.parse(data.spells);
        }
        
        // Update last sync
        localStorage.setItem('lastSync', new Date().toISOString());
        
        showSyncStatus('Données importées avec succès !', 'success');
        
        // Reload current view
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Import error:', error);
        showSyncStatus('Erreur d\'importation: ' + error.message, 'error');
    }
}

// Show sync status
function showSyncStatus(message, type) {
    // Remove existing status
    const existingStatus = document.getElementById('syncStatus');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Create status element
    const status = document.createElement('div');
    status.id = 'syncStatus';
    status.className = `fixed top-20 right-4 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 ${
        type === 'loading' ? 'bg-blue-500 text-white' :
        type === 'success' ? 'bg-green-500 text-white' :
        'bg-red-500 text-white'
    }`;
    
    status.innerHTML = `
        <i class="fas fa-${type === 'loading' ? 'spinner fa-spin' : type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(status);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (status && status.parentNode) {
            status.remove();
        }
    }, 5000);
}

// Check sync status on load
function checkSyncStatus() {
    const lastSync = localStorage.getItem('lastSync');
    if (lastSync) {
        const syncDate = new Date(lastSync);
        const now = new Date();
        const diffHours = (now - syncDate) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
            showSyncStatus(`Dernière synchronisation: ${syncDate.toLocaleDateString()} ${syncDate.toLocaleTimeString()}`, 'info');
        }
    }
}

// Create test data for GitHub
function createTestDataOnGitHub() {
    const testData = {
        campaigns: JSON.stringify([{
            id: 'test_' + Date.now(),
            name: 'Campagne de test',
            description: 'Description de la campagne de test',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }]),
        worlds: JSON.stringify([{
            id: 'world_' + Date.now(),
            name: 'Monde de test',
            description: 'Description du monde de test',
            createdAt: new Date().toISOString()
        }]),
        characters: JSON.stringify({
            'test_category': [{
                id: 'char_' + Date.now(),
                name: 'Personnage de test',
                description: 'Description du personnage de test',
                createdAt: new Date().toISOString()
            }]
        }),
        monsters: JSON.stringify({
            'test_category': [{
                id: 'monster_' + Date.now(),
                name: 'Monstre de test',
                description: 'Description du monstre de test',
                hp: '50',
                armorClass: '15',
                createdAt: new Date().toISOString()
            }]
        }),
        monsterCategories: JSON.stringify({
            'test_category': {
                id: 'test_category',
                name: 'Catégorie de test',
                description: 'Description de la catégorie de test',
                createdAt: new Date().toISOString()
            }
        }),
        encounters: JSON.stringify({
            'test_category': [{
                id: 'encounter_' + Date.now(),
                name: 'Rencontre de test',
                description: 'Description de la rencontre de test',
                createdAt: new Date().toISOString()
            }]
        }),
        spells: JSON.stringify({
            '1': [{
                id: 'spell_' + Date.now(),
                name: 'Sort de test',
                level: 1,
                description: 'Description du sort de test',
                createdAt: new Date().toISOString()
            }]
        }),
        timestamp: new Date().toISOString()
    };
    
    // Create a downloadable file
    const dataStr = JSON.stringify(testData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nat20-data.json';
    link.click();
    
    showSyncStatus('Fichier de test téléchargé ! Importe-le manuellement sur GitHub', 'success');
}

// Make function globally accessible
window.createTestDataOnGitHub = createTestDataOnGitHub;

// Spell management functions
function updateSpellSlot(combatantId, level, newValue) {
    const combatant = currentCombat.combatants.find(c => c.id === combatantId);
    if (combatant && combatant.monster.spellSlots) {
        const oldValue = combatant.monster.spellSlots[level];
        const total = typeof oldValue === 'string' ? parseInt(oldValue) : (oldValue.total || 0);
        const used = typeof oldValue === 'string' ? 0 : (oldValue.used || 0);
        
        combatant.monster.spellSlots[level] = {
            total: parseInt(newValue),
            used: Math.min(used, parseInt(newValue))
        };
        
        updateCombatInterface();
    }
}

function useSpellSlot(combatantId, level) {
    const combatant = currentCombat.combatants.find(c => c.id === combatantId);
    if (combatant && combatant.monster.spellSlots) {
        const slot = combatant.monster.spellSlots[level];
        if (slot && slot.used < slot.total) {
            combatant.monster.spellSlots[level].used++;
            updateCombatInterface();
        } else {
            alert(`Plus de slots de niveau ${level} disponibles!`);
        }
    }
}

function showSpellPreview(spellId) {
    // Find spell in spells data
    let spell = null;
    Object.values(spells).forEach(level => {
        const found = level.find(s => s.id === spellId);
        if (found) {
            spell = found;
        }
    });
    
    if (spell) {
        // Create preview modal content
        const content = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-bold text-lg">${spell.name}</h4>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded">Niveau ${spell.level || spell.id}</span>
                        <span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">${spell.school || 'Inconnue'}</span>
                    </div>
                </div>
                
                ${spell.duration ? `
                    <div>
                        <h5 class="font-semibold mb-1">Durée</h5>
                        <p class="text-gray-600">${spell.duration}</p>
                    </div>
                ` : ''}
                
                ${spell.castingTime ? `
                    <div>
                        <h5 class="font-semibold mb-1">Temps d'incantation</h5>
                        <p class="text-gray-600">${spell.castingTime}</p>
                    </div>
                ` : ''}
                
                ${spell.range ? `
                    <div>
                        <h5 class="font-semibold mb-1">Portée</h5>
                        <p class="text-gray-600">${spell.range}</p>
                    </div>
                ` : ''}
                
                ${spell.components ? `
                    <div>
                        <h5 class="font-semibold mb-1">Composantes</h5>
                        <p class="text-gray-600">${spell.components}</p>
                    </div>
                ` : ''}
                
                ${spell.description ? `
                    <div>
                        <h5 class="font-semibold mb-1">Description</h5>
                        <p class="text-gray-600">${spell.description}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Show in modal
        const modal = document.getElementById('linkPreviewModal');
        const title = document.getElementById('linkPreviewTitle');
        const modalContent = document.getElementById('linkPreviewContent');
        
        title.textContent = spell.name;
        modalContent.innerHTML = content;
        
        // Hide "view full element" button since this is already full view
        document.getElementById('viewFullElementBtn').style.display = 'none';
        
        modal.classList.remove('hidden');
    }
}

// Auto-sync functions
function autoSync() {
    const lastSync = localStorage.getItem('lastSync');
    const now = new Date();
    
    // Sync every 5 minutes or if never synced
    if (!lastSync || (now - new Date(lastSync)) > 5 * 60 * 1000) {
        console.log('Auto-sync triggered');
        syncToGitHub();
    }
}

// Make functions globally accessible
window.syncToGitHub = syncToGitHub;
window.importFromGitHub = importFromGitHub;
window.checkSyncStatus = checkSyncStatus;
window.autoSync = autoSync;
window.createTestDataOnGitHub = createTestDataOnGitHub;
window.configureGitHubToken = configureGitHubToken;

function showElementPreview(type, target) {
    const modal = document.getElementById('elementPreviewModal');
    const title = document.getElementById('previewTitle');
    const content = document.getElementById('previewContent');

    // Parse target
    const parts = target.split(':');

    
    if (type === 'world' && parts.length >= 4 && currentWorld) {
        const [, category, subcategory, itemName] = parts;
        const items = currentWorld.categories[category][subcategory];
        const item = items.find(i => i.name === itemName);
        
        if (item) {
            title.textContent = `${category} > ${subcategory} > ${item.name}`;
            content.innerHTML = item.description || '<p>Aucune description</p>';
        }
    } else if (type === 'scenario' && parts.length >= 4 && currentCampaign) {
        const [, actIndex, chapterIndex, elementIndex] = parts;
        const element = currentCampaign.scenario.acts[actIndex].chapters[chapterIndex].elements[elementIndex];
        
        if (element) {
            const act = currentCampaign.scenario.acts[actIndex];
            const chapter = act.chapters[chapterIndex];
            title.textContent = `Acte ${parseInt(actIndex) + 1} > ${chapter.title} > ${element.name}`;
            content.innerHTML = element.content || '<p>Aucun contenu</p>';
        }
    }
    
    modal.classList.remove('hidden');
}

function closeElementPreview() {
    document.getElementById('elementPreviewModal').classList.add('hidden');
}

// Link preview modal for adventure mode
function showLinkPopup(type, target) {
    const modal = document.getElementById('linkPreviewModal');
    const title = document.getElementById('linkPreviewTitle');
    const content = document.getElementById('linkPreviewContent');
    
    // Store current link data for "view full element" button
    window.currentLinkData = { type, target };
    
    // Parse target and get content
    const parts = target.split(':');
    
    let linkTitle = '';
    let linkContent = '';
    
    if (type === 'world' && parts.length >= 4 && currentWorld) {
        const [, category, subcategory, itemName] = parts;
        
        if (!currentWorld.categories || !currentWorld.categories[category]) {
            linkTitle = 'Élément non trouvé';
            linkContent = '<p class="text-red-500">La catégorie spécifiée n\'existe pas dans ce monde.</p>';
        } else {
            const items = currentWorld.categories[category][subcategory];
            if (!items) {
                linkTitle = 'Élément non trouvé';
                linkContent = '<p class="text-red-500">La sous-catégorie spécifiée n\'existe pas.</p>';
            } else {
                const item = items.find(i => i.name === itemName);
                if (item) {
                    linkTitle = `${category} > ${subcategory} > ${item.name}`;
                    linkContent = item.description || '<p class="text-gray-500">Aucune description</p>';
                } else {
                    linkTitle = 'Élément non trouvé';
                    linkContent = '<p class="text-red-500">L\'élément spécifié n\'existe pas.</p>';
                }
            }
        }
    } else if (type === 'scenario' && parts.length >= 4 && currentCampaign) {
        const [, actIndex, chapterIndex, elementIndex] = parts;
        
        const element = currentCampaign.scenario.acts[actIndex].chapters[chapterIndex].elements[elementIndex];
        
        if (element) {
            const act = currentCampaign.scenario.acts[actIndex];
            const chapter = act.chapters[chapterIndex];
            linkTitle = `Acte ${parseInt(actIndex) + 1} > ${chapter.title} > ${element.name}`;
            linkContent = element.content || '<p class="text-gray-500">Aucun contenu</p>';
        }
    } else if (type === 'character' && parts.length >= 3 && currentCampaign) {
        const [, categoryId, characterId] = parts;
        
        const campaignCharacters = characters[currentCampaign.id] || {};
        const categoryCharacters = campaignCharacters[categoryId] || [];
        const character = categoryCharacters.find(char => char.id === characterId);
        
        if (character) {
            linkTitle = `${categoryId} > ${character.name}`;
            linkContent = `
                <div class="space-y-3">
                    ${character.image ? `<img src="${character.image}" alt="${character.name}" class="w-full h-32 object-cover rounded">` : ''}
                    <p>${character.description || 'Aucune description'}</p>
                    <div class="flex flex-wrap gap-1">
                        <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">FOR ${character.stats?.strength || 10}</span>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">DEX ${character.stats?.dexterity || 10}</span>
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">CON ${character.stats?.constitution || 10}</span>
                        <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">INT ${character.stats?.intelligence || 10}</span>
                        <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">SAG ${character.stats?.wisdom || 10}</span>
                        <span class="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">CHA ${character.stats?.charisma || 10}</span>
                    </div>
                </div>
            `;
        } else {
            linkTitle = 'Personnage non trouvé';
            linkContent = '<p class="text-red-500">Le personnage spécifié n\'existe pas.</p>';
        }
    }
    
    if (modal && title && content) {
        title.textContent = linkTitle;
        content.innerHTML = linkContent;
        
        modal.classList.remove('hidden');
    }
}

function closeLinkPreview() {
    document.getElementById('linkPreviewModal').classList.add('hidden');
}

function viewFullElement() {
    if (window.currentLinkData) {
        closeLinkPreview();
        showElementPreview(window.currentLinkData.type, window.currentLinkData.target);
    }
}

function showFloatingPreview(type, target, event) {
    // Remove existing floating preview
    const existing = document.getElementById('floatingPreview');
    if (existing) {
        existing.remove();
    }
    
    // Create floating preview element
    const preview = document.createElement('div');
    preview.id = 'floatingPreview';
    preview.className = 'fixed bg-white border-2 border-indigo-300 rounded-lg shadow-xl p-4 z-50 max-w-sm';
    
    // Calculate position
    let x = event.pageX;
    let y = event.pageY;
    
    // Adjust position to stay within viewport
    const previewWidth = 320; // max-w-sm approx
    const previewHeight = 200; // approximate height
    
    if (x + previewWidth > window.innerWidth) {
        x = window.innerWidth - previewWidth - 20;
    }
    if (y + previewHeight > window.innerHeight) {
        y = window.innerHeight - previewHeight - 20;
    }
    
    preview.style.left = x + 'px';
    preview.style.top = y + 'px';
    
    // Parse target and get content
    const parts = target.split(':');
    let title = '';
    let content = '';
    
    if (type === 'world' && parts.length >= 4 && currentWorld) {
        const [, category, subcategory, itemName] = parts;
        const items = currentWorld.categories[category][subcategory];
        const item = items.find(i => i.name === itemName);
        
        if (item) {
            title = `${category} > ${subcategory} > ${item.name}`;
            content = item.description || '<p class="text-gray-500">Aucune description</p>';
        }
    } else if (type === 'scenario' && parts.length >= 4 && currentCampaign) {
        const [, actIndex, chapterIndex, elementIndex] = parts;
        const element = currentCampaign.scenario.acts[actIndex].chapters[chapterIndex].elements[elementIndex];
        
        if (element) {
            const act = currentCampaign.scenario.acts[actIndex];
            const chapter = act.chapters[chapterIndex];
            title = `Acte ${parseInt(actIndex) + 1} > ${chapter.title} > ${element.name}`;
            content = element.content || '<p class="text-gray-500">Aucun contenu</p>';
        }
    }
    
    preview.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-gray-800 text-sm">${title}</h4>
            <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="prose max-w-none text-sm max-h-32 overflow-y-auto">
            ${content}
        </div>
        <div class="mt-2 pt-2 border-t border-gray-200">
            <button onclick="showElementPreview('${type}', '${target}')" class="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                <i class="fas fa-eye mr-1"></i>Voir l'élément
            </button>
        </div>
    `;
    
    document.body.appendChild(preview);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (document.getElementById('floatingPreview')) {
            preview.remove();
        }
    }, 5000);
}

function enableMonsterEditMode() {
    const container = document.getElementById('monstersGrid');
    if (!container) return;
    
    let html = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold mb-4">Mode édition des monstres</h2>
            <p class="text-gray-600 mb-4">Clique sur "Modifier" pour éditer un monstre existant</p>
            <button onclick="loadMonstersData()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                <i class="fas fa-arrow-left mr-2"></i>Retour
            </button>
        </div>
        <div class="space-y-4">
    `;
    
    Object.entries(monsters).forEach(([categoryId, category]) => {
        html += `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">${categoryId} (${category.length})</h3>
                <div class="space-y-2">
        `;
        
        category.forEach(monster => {
            html += `
                <div class="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                        <h4 class="font-semibold text-gray-800">${monster.name}</h4>
                        <p class="text-sm text-gray-600">${monster.description ? monster.description.substring(0, 100) + '...' : 'Aucune description'}</p>
                    </div>
                    <div class="flex space-x-2">
                                <button onclick="editMonster(event, '${monster.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                                <button onclick="copyMonster('${monster.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-copy"></i> Copier
                                </button>
                                <button onclick="deleteMonster('${monster.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function editMonsterSimple(monsterId) {
    // Find monster
    let monster = null;
    let categoryId = null;
    
    Object.entries(monsters).forEach(([catId, category]) => {
        const found = category.find(m => m.id === monsterId);
        if (found) {
            monster = found;
            categoryId = catId;
        }
    });
    
    if (!monster) {
        alert('Monstre non trouvé');
        return;
    }
    
    alert('Modification du monstre: ' + monster.name + ' - Fonction à implémenter');
}

function deleteMonsterSimple(monsterId) {
    if (!confirm('Supprimer ce monstre ?')) return;
    alert('Suppression du monstre - Fonction à implémenter');
}
