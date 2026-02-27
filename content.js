// Extension simple pour télécharger les vidéos Facebook Ads Library
class SimpleAdsDownloader {
  constructor() {
    this.downloadIcon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#1877F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="7,10 12,15 17,10" stroke="#1877F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="#1877F2" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    this.processedVideos = new Set();
    this.init();
  }

  init() {
    console.log('🚀 Simple Ads Downloader chargé');
    this.addDownloadButtons();
    this.observeChanges();
  }

  // Observer les changements de DOM
  observeChanges() {
    const observer = new MutationObserver(() => {
      this.addDownloadButtons();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Ajouter des boutons de téléchargement aux vidéos
  addDownloadButtons() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
      const videoId = video.src || video.currentSrc;
      
      if (videoId && !this.processedVideos.has(videoId) && !video.closest('.fb-download-container')) {
        this.addButtonToVideo(video);
        this.processedVideos.add(videoId);
      }
    });
  }

  // Ajouter un bouton à une vidéo spécifique
  addButtonToVideo(video) {
    // Trouver le conteneur parent approprié
    const container = video.closest('div[role="article"]') || 
                     video.closest('div') ||
                     video.parentElement;
    
    if (!container) return;

    // Créer le bouton de téléchargement
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = this.downloadIcon;
    downloadBtn.className = 'fb-download-btn';
    downloadBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background: rgba(255,255,255,0.9);
      border: 1px solid #1877F2;
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    // Style du conteneur
    const wrapper = document.createElement('div');
    wrapper.className = 'fb-download-container';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    // Insérer le wrapper et le bouton
    video.parentNode.insertBefore(wrapper, video);
    wrapper.appendChild(video);
    wrapper.appendChild(downloadBtn);
    
    // Event listener pour le téléchargement
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.downloadVideo(video, container);
    });
    
    // Hover effects
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.background = 'rgba(24,119,242,0.1)';
      downloadBtn.style.transform = 'scale(1.1)';
    });
    
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.background = 'rgba(255,255,255,0.9)';
      downloadBtn.style.transform = 'scale(1)';
    });
    
    console.log('✅ Bouton ajouté à une vidéo');
  }

  // Télécharger la vidéo
  async downloadVideo(video, container) {
    try {
      const videoUrl = video.src || video.currentSrc;
      if (!videoUrl) {
        alert('URL vidéo introuvable');
        return;
      }

      // Générer le nom du fichier
      const filename = this.generateFilename(container);
      
      console.log('📥 Téléchargement:', filename);
      
      // Télécharger via Chrome API
      chrome.runtime.sendMessage({
        action: 'download',
        url: videoUrl,
        filename: filename
      }, (response) => {
        if (response && response.success) {
          console.log('✅ Téléchargement initié');
        } else {
          console.log('❌ Erreur téléchargement');
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors du téléchargement');
    }
  }

  // Générer nom de fichier intelligent
  generateFilename(container) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Essayer de trouver le nom de la page/marque
    let pageName = 'video';
    
    // Chercher dans le texte du conteneur
    const textContent = container.textContent || '';
    
    // Essayer différentes stratégies pour trouver le nom
    const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      // Éviter les mots communs
      if (line.length > 3 && line.length < 50 && 
          !line.includes('Sponsored') && 
          !line.includes('Learn more') && 
          !line.includes('See more') &&
          !line.match(/^\d+$/)) {
        pageName = line.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
        break;
      }
    }
    
    // Nettoyer le nom
    pageName = pageName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    if (!pageName || pageName.length < 3) {
      pageName = 'facebook_ad';
    }
    
    return `${pageName}_${today}_video.mp4`;
  }

  // Obtenir les statistiques
  getStats() {
    const totalVideos = document.querySelectorAll('video').length;
    const processedVideos = this.processedVideos.size;
    
    return {
      totalVideos,
      processedVideos,
      downloads: processedVideos // Approximation
    };
  }
}

// Messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    const stats = downloader ? downloader.getStats() : { totalVideos: 0, processedVideos: 0, downloads: 0 };
    sendResponse({
      success: true,
      adsFound: stats.totalVideos,
      downloads: stats.downloads
    });
    return true;
  }
  
  if (request.action === 'downloadAll') {
    if (downloader) {
      downloader.addDownloadButtons();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Extension non initialisée' });
    }
    return true;
  }
});

// Initialiser l'extension
let downloader = null;

function initDownloader() {
  console.log('🚀 Initialisation Simple Ads Downloader');
  downloader = new SimpleAdsDownloader();
}

// Initialiser quand la page est prête
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDownloader);
} else {
  initDownloader();
}

console.log('📄 Simple Ads Downloader script chargé');