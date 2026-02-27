// Script pour le popup de l'extension Facebook Ads Downloader

class PopupController {
  constructor() {
    this.adsCount = 0;
    this.downloadCount = 0;
    this.currentTab = null;
    this.settings = {};
    
    this.init();
  }

  async init() {
    // Afficher le loading state immédiatement
    this.showLoadingState();
    
    try {
      await this.getCurrentTab();
      await this.loadSettings();
      this.setupEventListeners();
      await this.updateStatus();
      this.setupUI();
      this.initFilters();
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    } finally {
      // TOUJOURS masquer le loading, même en cas d'erreur
      setTimeout(() => {
        this.hideLoadingState();
      }, 1000); // Max 1 seconde de loading
    }
  }

  // Afficher l'état de chargement
  showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('mainContent');
    
    if (loadingState) loadingState.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
  }

  // Masquer l'état de chargement avec animation
  hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('mainContent');
    
    if (loadingState && mainContent) {
      // Fade out loading
      loadingState.style.opacity = '0';
      
      setTimeout(() => {
        loadingState.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.classList.add('fade-in');
      }, 200);
    }
  }

  // Obtenir l'onglet actuel
  async getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
  }

  // Charger les paramètres
  async loadSettings() {
    try {
      const response = await this.sendMessage({ action: 'getSettings' });
      if (response.success) {
        this.settings = response.settings;
        this.applySettingsToUI();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  }

  // Appliquer les paramètres à l'interface
  applySettingsToUI() {
    const downloadFormatSelect = document.getElementById('downloadFormat');
    const downloadQualitySelect = document.getElementById('downloadQuality');
    const includeMetadataCheckbox = document.getElementById('includeMetadata');
    const autoDownloadCheckbox = document.getElementById('autoDownload');

    if (downloadFormatSelect) downloadFormatSelect.value = this.settings.downloadFormat || 'original';
    if (downloadQualitySelect) downloadQualitySelect.value = this.settings.downloadQuality || 'high';
    if (includeMetadataCheckbox) includeMetadataCheckbox.checked = this.settings.includeMetadata || false;
    if (autoDownloadCheckbox) autoDownloadCheckbox.checked = this.settings.autoDownload || false;
  }

  // Configurer les événements
  setupEventListeners() {
    // Boutons d'action
    document.getElementById('downloadAllBtn')?.addEventListener('click', () => this.downloadAllAds());
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshDetection());

    // Paramètres
    document.getElementById('downloadFormat')?.addEventListener('change', (e) => this.updateSetting('downloadFormat', e.target.value));
    document.getElementById('downloadQuality')?.addEventListener('change', (e) => this.updateSetting('downloadQuality', e.target.value));
    document.getElementById('includeMetadata')?.addEventListener('change', (e) => this.updateSetting('includeMetadata', e.target.checked));
    document.getElementById('autoDownload')?.addEventListener('change', (e) => this.updateSetting('autoDownload', e.target.checked));

    // Liens d'aide
    document.getElementById('helpBtn')?.addEventListener('click', () => this.showHelp());
    document.getElementById('aboutBtn')?.addEventListener('click', () => this.showAbout());

    // Filtres
    this.setupFilterListeners();
  }

  // Configurer l'interface utilisateur
  setupUI() {
    // Vérifier si on est sur Facebook Ads Library
    if (!this.isOnFacebookAdsLibrary()) {
      this.showNotOnFacebookMessage();
      return;
    }

    // Activer les fonctionnalités
    this.enableFeatures();
    
    // S'assurer que le contenu est visible
    this.ensureContentVisibility();
  }

  // S'assurer que le contenu du popup est visible
  ensureContentVisibility() {
    const content = document.querySelector('.popup-content');
    if (content) {
      content.style.minHeight = '400px';
      content.style.display = 'block';
    }

    // Forcer l'affichage si masqué
    const container = document.querySelector('.popup-container');
    if (container) {
      container.style.display = 'block';
      container.style.width = '350px';
      container.style.minHeight = '500px';
    }
  }

  // Vérifier si on est sur Facebook Ads Library
  isOnFacebookAdsLibrary() {
    return this.currentTab && 
           this.currentTab.url && 
           this.currentTab.url.includes('facebook.com/ads/library');
  }

  // Afficher le message si pas sur Facebook
  showNotOnFacebookMessage() {
    const content = document.querySelector('.popup-content');
    content.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="margin-bottom: 16px; color: #65676b;">
          Cette extension ne fonctionne que sur Facebook Ads Library.
        </p>
        <button id="openFacebookBtn" class="btn btn-primary">
          Ouvrir Facebook Ads Library
        </button>
      </div>
    `;

    document.getElementById('openFacebookBtn')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.facebook.com/ads/library' });
      window.close();
    });
  }

  // Activer les fonctionnalités
  enableFeatures() {
    // Déjà implémenté dans init()
  }

  // Envoyer un message au content script
  async sendMessage(message) {
    try {
      if (!this.currentTab || !this.currentTab.id) {
        throw new Error('Aucun onglet actif trouvé');
      }

      return await chrome.tabs.sendMessage(this.currentTab.id, message);
    } catch (error) {
      // Si le content script n'est pas disponible, essayer le background script
      return await chrome.runtime.sendMessage(message);
    }
  }

  // Mettre à jour le statut
  async updateStatus() {
    try {
      // Timeout très rapide pour éviter les blocages
      const response = await Promise.race([
        this.sendMessage({ action: 'getStatus' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 800) // 800ms max
        )
      ]);
      
      if (response && response.success) {
        this.adsCount = response.adsCount || 0;
        this.downloadCount = response.downloadCount || 0;
      } else {
        this.adsCount = 0;
        this.downloadCount = 0;
      }
    } catch (error) {
      console.log('Content script non disponible, valeurs par défaut');
      this.adsCount = 0;
      this.downloadCount = 0;
    }

    // Animation lors de la mise à jour des nombres
    this.updateCounterWithAnimation('adsCount', this.adsCount);
    this.updateCounterWithAnimation('downloadCount', this.downloadCount);
    
    // Afficher un message informatif si pas sur la bonne page
    if (this.adsCount === 0) {
      setTimeout(() => this.showHelpMessage(), 500);
    }
  }

  // Mettre à jour un compteur avec animation
  updateCounterWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Supprimer les loading dots s'ils existent
    const loadingDots = element.querySelector('.loading-dots');
    if (loadingDots) {
      loadingDots.style.opacity = '0';
      setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 150);
      }, 200);
    } else {
      // Mise à jour normale avec micro-animation
      element.style.transform = 'scale(1.1)';
      element.textContent = newValue;
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 150);
    }
  }

  // Afficher un message d'aide si aucune publicité détectée
  showHelpMessage() {
    const statusSection = document.querySelector('.status-section');
    if (statusSection && this.adsCount === 0) {
      const helpDiv = document.createElement('div');
      helpDiv.style.cssText = `
        margin-top: 12px;
        padding: 8px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        font-size: 12px;
        color: #856404;
      `;
      helpDiv.innerHTML = `
        💡 Aucune publicité détectée. Assurez-vous d'être sur Facebook Ads Library et que la page soit entièrement chargée.
      `;
      statusSection.appendChild(helpDiv);
    }
  }

  // Télécharger toutes les publicités
  async downloadAllAds() {
    const downloadBtn = document.getElementById('downloadAllBtn');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    try {
      // Désactiver le bouton et afficher la progression
      downloadBtn.disabled = true;
      downloadBtn.textContent = 'Téléchargement en cours...';
      progressSection.style.display = 'block';

      // Envoyer la commande de téléchargement
      const response = await this.sendMessage({ action: 'downloadAllAds' });

      if (response && response.success) {
        // Simuler la progression (à améliorer avec de vrais événements)
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          progressFill.style.width = `${progress}%`;
          progressText.textContent = `${progress}%`;

          if (progress >= 100) {
            clearInterval(interval);
            
            // Réactiver le bouton
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Télécharger toutes les publicités
            `;
            
            // Masquer la progression après un délai
            setTimeout(() => {
              progressSection.style.display = 'none';
              progressFill.style.width = '0%';
              progressText.textContent = '0%';
            }, 2000);

            this.updateStatus();
          }
        }, 200);
      } else {
        throw new Error('Échec du téléchargement');
      }

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      
      // Réactiver le bouton
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Télécharger toutes les publicités
      `;
      
      progressSection.style.display = 'none';
      alert('Erreur lors du téléchargement des publicités.');
    }
  }

  // Actualiser la détection
  async refreshDetection() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    try {
      refreshBtn.disabled = true;
      refreshBtn.classList.add('loading');

      await this.sendMessage({ action: 'refreshDetection' });
      
      // Attendre un peu puis mettre à jour le statut
      setTimeout(() => {
        this.updateStatus();
        refreshBtn.disabled = false;
        refreshBtn.classList.remove('loading');
      }, 1500);

    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('loading');
    }
  }

  // Mettre à jour un paramètre
  async updateSetting(key, value) {
    this.settings[key] = value;
    
    try {
      await this.sendMessage({ 
        action: 'saveSettings', 
        data: { [key]: value } 
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
  }

  // Afficher l'aide
  showHelp() {
    const helpContent = `
      <div class="help-modal">
        <h3>Comment utiliser l'extension ?</h3>
        <ol>
          <li>Naviguez vers Facebook Ads Library</li>
          <li>Les icônes de téléchargement apparaîtront sur chaque publicité</li>
          <li>Cliquez sur l'icône pour télécharger une publicité</li>
          <li>Ou utilisez "Télécharger toutes les publicités" pour un téléchargement en lot</li>
        </ol>
        <p><strong>Note:</strong> Cette extension respecte les conditions d'utilisation de Facebook.</p>
      </div>
    `;
    
    this.showModal('Aide', helpContent);
  }

  // Afficher à propos
  showAbout() {
    const aboutContent = `
      <div class="about-modal">
        <h3>Facebook Ads Downloader</h3>
        <p><strong>Version:</strong> 1.0</p>
        <p><strong>Description:</strong> Téléchargez facilement les publicités depuis la bibliothèque publicitaire Facebook.</p>
        <p><strong>Développé par:</strong> Assistant IA</p>
        <p style="margin-top: 16px; font-size: 12px; color: #65676b;">
          Cette extension est conçue pour un usage légal et respecte les conditions d'utilisation de Facebook.
        </p>
      </div>
    `;
    
    this.showModal('À propos', aboutContent);
  }

  // Afficher une modal
  showModal(title, content) {
    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 18px;">${title}</h2>
        <button id="closeModal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #65676b;">×</button>
      </div>
      ${content}
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Fermer la modal
    const closeModal = () => {
      document.body.removeChild(overlay);
    };

    modal.querySelector('#closeModal').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // Initialiser le système de filtres
  initFilters() {
    this.filters = new PopupFilters(this);
    this.loadFilterSettings();
  }

  // Configurer les événements de filtrage
  setupFilterListeners() {
    document.getElementById('dateFilter')?.addEventListener('change', (e) => {
      if (this.filters) {
        this.filters.handleDateFilterChange(e.target.value);
      }
    });

    document.getElementById('startDate')?.addEventListener('change', () => {
      if (this.filters) {
        this.filters.updateCustomDateFilter();
      }
    });

    document.getElementById('endDate')?.addEventListener('change', () => {
      if (this.filters) {
        this.filters.updateCustomDateFilter();
      }
    });

    document.getElementById('mediaFilter')?.addEventListener('change', (e) => {
      if (this.filters) {
        this.filters.currentFilters.mediaFilter = e.target.value;
        this.filters.updateSetting('mediaFilter', e.target.value);
      }
    });

    document.getElementById('statusFilter')?.addEventListener('change', (e) => {
      if (this.filters) {
        this.filters.currentFilters.statusFilter = e.target.value;
        this.filters.updateSetting('statusFilter', e.target.value);
      }
    });

    document.getElementById('brandFilter')?.addEventListener('input', (e) => {
      if (this.filters) {
        this.filters.currentFilters.brandFilter = e.target.value;
        this.filters.updateSetting('brandFilter', e.target.value);
      }
    });

    document.getElementById('applyFilters')?.addEventListener('click', () => {
      if (this.filters) {
        this.filters.applyFilters();
      }
    });
  }

  // Charger les paramètres de filtrage
  async loadFilterSettings() {
    try {
      const response = await this.sendMessage({ action: 'getFilterSettings' });
      if (response && response.success && response.filterSettings) {
        const settings = response.filterSettings;
        
        // Appliquer les paramètres aux contrôles avec vérifications
        const dateFilter = document.getElementById('dateFilter');
        const mediaFilter = document.getElementById('mediaFilter');
        const statusFilter = document.getElementById('statusFilter');
        const brandFilter = document.getElementById('brandFilter');
        
        if (settings.dateFilter && dateFilter) dateFilter.value = settings.dateFilter;
        if (settings.mediaFilter && mediaFilter) mediaFilter.value = settings.mediaFilter;
        if (settings.statusFilter && statusFilter) statusFilter.value = settings.statusFilter;
        if (settings.brandFilter && brandFilter) brandFilter.value = settings.brandFilter;
        
        // Mettre à jour les filtres
        if (this.filters) {
          this.filters.currentFilters = {
            ...this.filters.currentFilters,
            ...settings
          };
          
          // Gérer l'affichage des dates personnalisées
          if (settings.dateFilter === 'custom') {
            this.filters.handleDateFilterChange('custom');
            const startDate = document.getElementById('startDate');
            const endDate = document.getElementById('endDate');
            if (settings.startDate && startDate) startDate.value = settings.startDate;
            if (settings.endDate && endDate) endDate.value = settings.endDate;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de filtrage:', error);
      // Utiliser des valeurs par défaut en cas d'erreur
      this.useDefaultFilterSettings();
    }
  }

  // Utiliser des paramètres par défaut
  useDefaultFilterSettings() {
    if (this.filters) {
      this.filters.currentFilters = {
        dateFilter: 'all',
        startDate: null,
        endDate: null,
        mediaFilter: 'all',
        statusFilter: 'all',
        brandFilter: ''
      };
    }
  }
}

// Initialiser le popup quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});