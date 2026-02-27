// Script de contenu pour détecter et ajouter des boutons de téléchargement aux publicités

class FacebookAdsDownloader {
  constructor() {
    this.downloadIcon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#1877F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="7,10 12,15 17,10" stroke="#1877F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="#1877F2" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    this.processedAds = new Set();
    this.downloadCount = 0; // Compteur de téléchargements réels
    this.init();
  }

  init() {
    // Nettoyer d'abord les boutons existants
    this.cleanupExistingButtons();
    
    this.observeAdsContainer();
    this.observeScroll();
    this.processExistingAds();
  }

  // Nettoyer les boutons existants
  cleanupExistingButtons() {
    const existingButtons = document.querySelectorAll('.fb-ads-download-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Nettoyer les attributs de traitement
    const processedElements = document.querySelectorAll('[data-downloader-processed]');
    processedElements.forEach(el => {
      el.removeAttribute('data-downloader-processed');
    });
    
    // RÉINITIALISER COMPLÈTEMENT les compteurs
    this.processedAds.clear();
    this.downloadCount = 0;
    
    console.log('🧹 Nettoyage complet effectué');
  }

  // Observer les changements dans le DOM pour détecter de nouvelles publicités
  observeAdsContainer() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Vérifier si de nouveaux conteneurs de publicités ont été ajoutés
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.isAdContainer(node) || node.querySelector && this.findAdContainers(node).length > 0) {
                shouldProcess = true;
              }
            }
          });
        }
      });

      if (shouldProcess) {
        // Délai pour laisser le DOM se stabiliser
        setTimeout(() => {
          this.processExistingAds();
        }, 1000);
      }
    });

    // Observer le conteneur principal
    const targetNode = document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  // Observer le scroll pour ajouter des boutons aux nouvelles publicités visibles
  observeScroll() {
    let scrollTimeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        console.log('🔄 Scroll détecté, traitement des nouvelles publicités visibles');
        this.processExistingAds();
      }, 300); // Délai pour éviter trop d'exécutions
    };

    window.addEventListener('scroll', handleScroll);
    
    // Aussi observer les changements de taille de fenêtre
    window.addEventListener('resize', handleScroll);
  }

  // Traiter les publicités existantes
  processExistingAds() {
    // Chercher les conteneurs de publicités spécifiques
    const adContainers = this.findAdContainers(document);
    
    // Filtrer seulement les publicités visibles à l'écran
    const visibleAds = adContainers.filter(ad => this.isElementVisible(ad));
    
    console.log(`Trouvé ${adContainers.length} conteneurs de publicités, ${visibleAds.length} visibles`);
    
    visibleAds.forEach(adContainer => {
      const adId = this.getAdId(adContainer);
      
      if (!this.processedAds.has(adId)) {
        this.addDownloadButton(adContainer);
        this.processedAds.add(adId);
      }
    });
  }

  // Vérifier si un élément est visible à l'écran
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // L'élément est visible s'il intersecte avec la zone visible
    const isVisible = rect.top < windowHeight && 
                     rect.bottom > 0 && 
                     rect.left < windowWidth && 
                     rect.right > 0 &&
                     rect.width > 0 && 
                     rect.height > 0;
    
    // Aussi vérifier que l'élément n'est pas masqué par CSS
    const style = getComputedStyle(element);
    const isDisplayed = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0';
    
    return isVisible && isDisplayed;
  }

  // Trouver les conteneurs de publicités - VERSION SIMPLE QUI MARCHE
  findAdContainers(container) {
    console.log('🔍 DÉTECTION SIMPLIFIÉE');
    
    // Essayer le sélecteur standard Facebook Ads Library
    let ads = container.querySelectorAll('[data-testid="ad_library_result"]');
    console.log(`📊 Sélecteur standard: ${ads.length} ads trouvées`);
    
    // Si ça marche pas, essayer tous les divs qui ont des vidéos ou images
    if (ads.length === 0) {
      console.log('🔄 Fallback: chercher divs avec média');
      const allDivs = container.querySelectorAll('div');
      const candidates = [];
      
      allDivs.forEach(div => {
        const hasVideo = div.querySelector('video');
        const hasImg = div.querySelector('img[src*="fbcdn"], img[src*="scontent"]');
        const rect = div.getBoundingClientRect();
        
        if ((hasVideo || hasImg) && rect.width > 250 && rect.height > 150) {
          candidates.push(div);
        }
      });
      
      console.log(`📊 Candidats trouvés: ${candidates.length}`);
      ads = candidates;
    }
    
    console.log(`✅ RÉSULTAT: ${ads.length} publicités détectées`);
    return Array.from(ads);
  }

  // Vérifier si c'est un conteneur de publicité valide (assoupli)
  isValidAdContainer(element) {
    // 1. Doit avoir du contenu média OU des indicateurs de pub
    const hasMedia = element.querySelector('video, img[src*="fbcdn.net"], img[src*="scontent"]');
    const text = element.textContent || '';
    const hasAdIndicators = text.includes('Sponsored') || 
                           text.includes('Started running on') ||
                           text.includes('Active') || 
                           text.includes('Inactive') ||
                           text.includes('Library ID');

    // Au moins un des deux critères doit être rempli
    if (!hasMedia && !hasAdIndicators) {
      return false;
    }

    // 2. Doit avoir une taille minimale raisonnable
    if (element.offsetHeight < 50 || element.offsetWidth < 100) {
      return false;
    }

    // 3. Ne doit pas déjà avoir notre bouton
    if (element.querySelector('.fb-ads-download-btn')) {
      return false;
    }

    // 4. Ne doit pas être un élément de navigation/header
    if (element.closest('nav, header, .navigation, [role="banner"]')) {
      return false;
    }

    return true;
  }

  // Vérifier si c'est un conteneur de publicité
  isAdContainer(element) {
    // Vérifier les attributs spécifiques
    const hasAdTestId = element.getAttribute('data-testid') === 'ad_library_result';
    const hasAdPagelet = element.getAttribute('data-pagelet') && 
                        element.getAttribute('data-pagelet').includes('AdLibrary');
    const isArticle = element.getAttribute('role') === 'article';
    
    return hasAdTestId || hasAdPagelet || isArticle;
  }

  // Vérifier si c'est un conteneur de publicité par structure
  isAdContainerByStructure(element) {
    // Doit être assez grand
    if (element.offsetHeight < 200 || element.offsetWidth < 200) {
      return false;
    }

    // Doit contenir du média
    const hasMedia = element.querySelector('video, img[src*="fbcdn.net"]');
    if (!hasMedia) {
      return false;
    }

    // Doit avoir du texte "Sponsored" ou des indicateurs de publicité
    const text = element.textContent || '';
    const hasAdIndicators = text.includes('Sponsored') || 
                           text.includes('Started running on') ||
                           text.includes('See ad details') ||
                           text.includes('Active') ||
                           text.includes('Inactive');

    // Doit avoir des plateformes sociales (Facebook, Instagram, etc.)
    const hasPlatformIcons = element.querySelector('i[style*="background-image"]');

    return hasAdIndicators && hasPlatformIcons;
  }

  // Vérifier si c'est une carte de publicité valide
  isValidAdCard(adElement) {
    // Éviter les doublons
    if (adElement.querySelector('.fb-ads-download-btn')) {
      return false;
    }

    // Doit avoir un média
    const hasMedia = adElement.querySelector('video, img');
    if (!hasMedia) {
      return false;
    }

    // Doit être visible
    if (adElement.offsetHeight === 0 || adElement.offsetWidth === 0) {
      return false;
    }

    return true;
  }

  // Générer un ID unique pour la publicité
  getAdId(adElement) {
    // Utiliser l'URL de la vidéo/image comme ID unique
    const video = adElement.querySelector('video[src]');
    const img = adElement.querySelector('img[src*="fbcdn.net"]');
    
    if (video && video.src) {
      return video.src.split('?')[0]; // Enlever les paramètres pour avoir un ID stable
    }
    
    if (img && img.src) {
      return img.src.split('?')[0];
    }
    
    // Fallback : utiliser la position dans le DOM
    const rect = adElement.getBoundingClientRect();
    return `${rect.top}_${rect.left}_${adElement.textContent.substring(0, 50)}`;
  }

  // Ajouter le bouton de téléchargement
  addDownloadButton(adElement) {
    // Chercher le conteneur de média principal
    const mediaContainer = this.findMainMediaContainer(adElement);
    if (!mediaContainer) {
      console.log('Aucun conteneur de média trouvé pour:', adElement);
      return;
    }

    // Vérifier qu'il n'y a pas déjà un bouton
    if (mediaContainer.querySelector('.fb-ads-download-btn')) {
      return;
    }

    // Créer le bouton de téléchargement
    const downloadBtn = document.createElement('div');
    downloadBtn.className = 'fb-ads-download-btn';
    downloadBtn.innerHTML = `
      <div class="download-icon" title="Télécharger cette publicité">
        ${this.downloadIcon}
      </div>
    `;

    // Style du bouton
    downloadBtn.style.cssText = `
      position: absolute !important;
      top: 10px !important;
      right: 10px !important;
      z-index: 10001 !important;
      cursor: pointer !important;
      background: rgba(255, 255, 255, 0.95) !important;
      border-radius: 20px !important;
      padding: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
      transition: all 0.3s ease !important;
      border: 2px solid #1877F2 !important;
    `;

    // Positionner le conteneur parent en relatif si nécessaire
    if (getComputedStyle(mediaContainer).position === 'static') {
      mediaContainer.style.position = 'relative';
    }

    // Ajouter les événements
    this.addButtonEvents(downloadBtn, adElement);
    
    // Ajouter le bouton au conteneur
    mediaContainer.appendChild(downloadBtn);
    
    console.log('Bouton ajouté pour la publicité:', this.getAdId(adElement));
  }

  // Trouver le conteneur de média principal
  findMainMediaContainer(adElement) {
    // PRIORITÉ 1: Chercher le conteneur de vidéo spécifique Facebook Ads Library
    let videoContainer = adElement.querySelector('[data-testid="ad-content-body-video-container"]');
    if (videoContainer) {
      // S'assurer qu'il n'a pas déjà notre bouton
      if (!videoContainer.querySelector('.fb-ads-download-btn')) {
        return videoContainer;
      }
    }

    // PRIORITÉ 2: Chercher d'autres conteneurs vidéo spécifiques
    const alternativeVideoContainers = [
      '[data-testid*="video"]',
      '[aria-label*="video"]',
      '.video-container',
      '[role="group"][aria-label*="Video"]'
    ];

    for (const selector of alternativeVideoContainers) {
      const container = adElement.querySelector(selector);
      if (container && !container.querySelector('.fb-ads-download-btn')) {
        return container;
      }
    }

    // PRIORITÉ 3: Pour les vidéos, chercher le conteneur parent direct
    const video = adElement.querySelector('video');
    if (video) {
      // Remonter jusqu'au conteneur qui contient les contrôles vidéo
      let parent = video.parentElement;
      let iterations = 0;
      while (parent && parent !== adElement && iterations < 5) {
        // Si ce parent contient des contrôles vidéo et pas notre bouton
        if (parent.querySelector('[aria-label*="Play"], [aria-label*="pause"], [role="slider"]') && 
            !parent.querySelector('.fb-ads-download-btn')) {
          return parent;
        }
        parent = parent.parentElement;
        iterations++;
      }
      
      // Fallback pour vidéo : utiliser le parent direct si pas de bouton
      if (video.parentElement && !video.parentElement.querySelector('.fb-ads-download-btn')) {
        return video.parentElement;
      }
    }

    // PRIORITÉ 4: Pour les images, chercher le conteneur principal
    const images = adElement.querySelectorAll('img[src*="fbcdn.net"]');
    for (const img of images) {
      if (img.offsetWidth > 200 && img.offsetHeight > 200 && 
          !img.alt?.toLowerCase().includes('profile') &&
          !img.parentElement.querySelector('.fb-ads-download-btn')) {
        return img.parentElement;
      }
    }

    return null;
  }

  // Ajouter les événements au bouton
  addButtonEvents(button, adElement) {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.background = 'rgba(255, 255, 255, 1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.background = 'rgba(255, 255, 255, 0.95)';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.downloadAd(adElement);
    });
  }

  // Télécharger la publicité
  async downloadAd(adElement) {
    try {
      // Animation de chargement
      const button = adElement.querySelector('.fb-ads-download-btn .download-icon');
      const originalContent = button.innerHTML;
      button.innerHTML = '⏳';
      button.style.color = '#1877F2';

      const mediaElements = this.extractMediaFromAd(adElement);
      
      if (mediaElements.length === 0) {
        alert('Aucun média trouvé dans cette publicité.');
        button.innerHTML = originalContent;
        return;
      }

      // Télécharger chaque média
      for (let i = 0; i < mediaElements.length; i++) {
        await this.downloadMedia(mediaElements[i], i, adElement);
        // Petit délai entre les téléchargements
        if (i < mediaElements.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Succès
      button.innerHTML = '✓';
      button.style.color = 'green';
      
      // INCRÉMENTER le compteur de téléchargements
      this.downloadCount++;
      console.log('📥 Téléchargement réussi, nouveau compteur:', this.downloadCount);
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.color = '';
      }, 2000);

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement de la publicité.');
      const button = adElement.querySelector('.fb-ads-download-btn .download-icon');
      if (button) {
        button.innerHTML = '❌';
        button.style.color = 'red';
        setTimeout(() => {
          button.innerHTML = this.downloadIcon;
          button.style.color = '';
        }, 2000);
      }
    }
  }

  // Extraire les médias d'une publicité
  extractMediaFromAd(adElement) {
    const media = [];
    
    // Vidéos - prioriser les vidéos avec des URLs complètes
    const videos = adElement.querySelectorAll('video[src]');
    videos.forEach(video => {
      if (video.src && !video.src.startsWith('blob:') && !video.src.startsWith('data:')) {
        media.push({
          type: 'video',
          url: video.src,
          alt: 'Facebook Ad Video',
          element: video
        });
      }
    });

    // Images - seulement les grandes images de contenu
    const images = adElement.querySelectorAll('img[src]');
    images.forEach(img => {
      if (img.src && 
          img.src.includes('fbcdn.net') && 
          !img.src.includes('rsrc.php') && 
          !img.src.startsWith('data:') && 
          img.offsetWidth > 100 && 
          img.offsetHeight > 100 &&
          !img.alt?.toLowerCase().includes('profile')) {
        
        media.push({
          type: 'image',
          url: img.src,
          alt: img.alt || 'Facebook Ad Image',
          element: img
        });
      }
    });

    // Enlever les doublons basés sur l'URL
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    media.forEach(item => {
      const baseUrl = item.url.split('?')[0]; // Enlever les paramètres de requête
      if (!seenUrls.has(baseUrl)) {
        seenUrls.add(baseUrl);
        uniqueMedia.push(item);
      }
    });

    return uniqueMedia;
  }

  // Extraire les métadonnées de la publicité
  extractAdMetadata(adElement) {
    const metadata = {
      brand: '',
      account: '',
      date: '',
      platforms: [],
      adText: '',
      status: ''
    };

    const textContent = adElement.textContent || '';

    // EXTRACTION SIMPLIFIÉE ET CIBLÉE DU NOM DE PAGE
    let pageName = 'UnknownPage';
    
    console.log('🔍 DEBUT extraction du nom de page');
    console.log('📝 Texte complet:', textContent.substring(0, 300));

    // MÉTHODE 1: Chercher dans le titre/header de la publicité
    const titleSelectors = ['h3', 'h2', 'h1', '[data-testid*="title"]', '[role="heading"]'];
    for (const selector of titleSelectors) {
      const titleElement = adElement.querySelector(selector);
      if (titleElement) {
        const titleText = titleElement.textContent.trim();
        console.log('🏷️ Titre trouvé:', titleText);
        
        // Si le titre contient un nom simple et court
        if (titleText.length > 2 && titleText.length < 20 && 
            titleText !== 'Sponsored' && 
            /^[a-zA-Z0-9\s]+$/.test(titleText)) {
          pageName = titleText.replace(/\s+/g, '').toLowerCase();
          console.log('✅ Nom extrait du titre:', pageName);
          break;
        }
      }
    }

    // MÉTHODE 2: Extraction intelligente du nom de page
    if (pageName === 'UnknownPage') {
      // Chercher le premier mot qui ressemble à un nom de page avant "Sponsored"
      const words = textContent.split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && word.length < 20 && 
            /^[A-Z][a-zA-Z0-9]*$/.test(word) &&
            word !== 'Sponsored' && 
            word !== 'Started' &&
            word !== 'Active' &&
            word !== 'Inactive') {
          pageName = word.toLowerCase();
          console.log('✅ Nom intelligemment extrait:', pageName);
          break;
        }
      }
    }

    // MÉTHODE 3: Extraire le premier mot "propre" avant "Sponsored"
    if (pageName === 'UnknownPage') {
      // Chercher le texte avant "Sponsored"
      const beforeSponsored = textContent.split('Sponsored')[0];
      const words = beforeSponsored.trim().split(/\s+/);
      
      // Prendre le dernier mot avant "Sponsored" qui ressemble à un nom
      for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i].trim();
        if (word.length > 2 && word.length < 20 && 
            /^[a-zA-Z0-9]+$/.test(word) &&
            !word.includes('with') &&
            !word.includes('running')) {
          pageName = word.toLowerCase();
          console.log('✅ Nom trouvé avant Sponsored:', pageName);
          break;
        }
      }
    }

    // MÉTHODE 4: Fallback - chercher dans les liens Facebook
    if (pageName === 'UnknownPage') {
      const links = adElement.querySelectorAll('a[href*="facebook.com/"]');
      for (const link of links) {
        const href = link.href;
        const urlMatch = href.match(/facebook\.com\/([a-zA-Z0-9._-]+)/);
        if (urlMatch && urlMatch[1] !== 'ads' && urlMatch[1].length > 2) {
          pageName = urlMatch[1].toLowerCase();
          console.log('✅ Nom extrait de l\'URL:', pageName);
          break;
        }
      }
    }

    console.log('🏆 NOM FINAL RETENU:', pageName);
    
    metadata.brand = pageName;
    metadata.account = pageName;

    // Extraire la date de début
    const dateMatch = textContent.match(/Started running on (\w+ \d+, \d+)/);
    if (dateMatch) {
      metadata.date = new Date(dateMatch[1]).toISOString().split('T')[0];
    } else {
      metadata.date = new Date().toISOString().split('T')[0];
    }

    // Extraire les plateformes (Facebook, Instagram, etc.)
    const platformIcons = adElement.querySelectorAll('i[style*="background-image"]');
    if (platformIcons.length > 0) {
      if (platformIcons.length >= 2) {
        metadata.platforms = ['Facebook', 'Instagram'];
      } else {
        metadata.platforms = ['Facebook'];
      }
    }

    // Extraire le statut (Active/Inactive)
    if (textContent.includes('Active')) {
      metadata.status = 'Active';
    } else if (textContent.includes('Inactive')) {
      metadata.status = 'Inactive';
    }

    // Extraire le texte de la publicité (premiers mots)
    const adTextElements = adElement.querySelectorAll('[style*="white-space: pre-wrap"], .x14vqqas');
    for (const element of adTextElements) {
      const text = element.textContent?.trim();
      if (text && text.length > 10 && !text.includes('Sponsored') && !text.includes('Started running')) {
        metadata.adText = text.substring(0, 50).replace(/[^\w\s]/g, '');
        break;
      }
    }

    return metadata;
  }

  // Générer un nom de fichier intelligent
  generateIntelligentFilename(mediaItem, metadata, index, extension) {
    // Nettoyer les noms pour les noms de fichiers
    const cleanString = (str) => {
      return str.replace(/[^\w\-_.]/g, '').substring(0, 20);
    };

    const components = [];

    // Marque
    if (metadata.brand) {
      components.push(cleanString(metadata.brand));
    }

    // Compte (si différent de la marque)
    if (metadata.account && metadata.account !== metadata.brand) {
      components.push(cleanString(metadata.account));
    }

    // Date
    if (metadata.date) {
      components.push(metadata.date);
    } else {
      components.push(new Date().toISOString().split('T')[0]);
    }

    // Type de média
    const mediaType = mediaItem.type === 'video' ? 'video' : 'image';
    components.push(mediaType);

    // Index si plusieurs médias
    if (index > 0) {
      components.push(`${index + 1}`);
    }

    // Statut si disponible
    if (metadata.status) {
      components.push(metadata.status.toLowerCase());
    }

    // Joindre avec des underscores
    const filename = components.join('_');
    
    return `${filename}.${extension}`;
  }

  // Télécharger un média spécifique
  async downloadMedia(mediaItem, index, adElement) {
    try {
      const response = await fetch(mediaItem.url, {
        method: 'GET',
        headers: {
          'User-Agent': navigator.userAgent,
          'Referer': window.location.href
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Extraire les métadonnées de la publicité
      const metadata = this.extractAdMetadata(adElement);
      
      // Détecter l'extension
      const extension = this.getFileExtension(mediaItem.url, blob.type);
      
      // Générer le nom de fichier intelligent
      const filename = this.generateIntelligentFilename(mediaItem, metadata, index, extension);

      // Créer le lien de téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`Téléchargé: ${filename}`, metadata);

      // Sauvegarder les métadonnées pour usage futur
      this.saveAdMetadata(filename, metadata, mediaItem);

    } catch (error) {
      console.error('Erreur lors du téléchargement du média:', error);
      
      // Fallback avec nommage intelligent
      try {
        const metadata = this.extractAdMetadata(adElement);
        const extension = this.getFileExtension(mediaItem.url, 'unknown');
        const filename = this.generateIntelligentFilename(mediaItem, metadata, index, extension);
        
        const link = document.createElement('a');
        link.href = mediaItem.url;
        link.target = '_blank';
        link.download = filename;
        link.click();
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        throw error;
      }
    }
  }

  // Sauvegarder les métadonnées dans le storage local
  async saveAdMetadata(filename, metadata, mediaItem) {
    try {
      const metadataEntry = {
        filename,
        downloadDate: new Date().toISOString(),
        metadata,
        mediaUrl: mediaItem.url,
        mediaType: mediaItem.type
      };

      // Sauvegarder dans le storage local du navigateur
      const storageKey = `ad_metadata_${Date.now()}`;
      if (chrome && chrome.storage && chrome.storage.local && chrome.runtime && chrome.runtime.id) {
        await chrome.storage.local.set({ [storageKey]: metadataEntry });
      } else {
        // Fallback vers localStorage si l'extension context est invalide
        console.log('Context extension invalide, utilisation du localStorage');
        localStorage.setItem(storageKey, JSON.stringify(metadataEntry));
      }
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.log('Extension rechargée, métadonnées sauvegardées en local');
        localStorage.setItem(`ad_metadata_${Date.now()}`, JSON.stringify({
          filename,
          downloadDate: new Date().toISOString(),
          metadata,
          mediaUrl: mediaItem.url,
          mediaType: mediaItem.type
        }));
      } else {
        console.error('Erreur lors de la sauvegarde des métadonnées:', error);
      }
    }
  }

  // Obtenir l'extension du fichier
  getFileExtension(url, mimeType) {
    // Essayer d'extraire de l'URL
    const urlExtension = url.split('.').pop().split('?')[0].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'].includes(urlExtension)) {
      return urlExtension;
    }

    // Utiliser le type MIME
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov'
    };

    return mimeToExt[mimeType] || (url.includes('mp4') ? 'mp4' : 'jpg');
  }

  // Télécharger toutes les publicités visibles
  downloadAllVisibleAds() {
    const adContainers = this.findAdContainers(document);
    
    if (adContainers.length === 0) {
      alert('Aucune publicité trouvée sur cette page.');
      return;
    }

    // Télécharger chaque publicité avec un délai
    adContainers.forEach((ad, index) => {
      setTimeout(() => {
        this.downloadAd(ad);
      }, index * 1000); // Délai de 1 seconde entre chaque téléchargement
    });

    alert(`${adContainers.length} publicité(s) en cours de téléchargement...`);
  }
}

// Initialiser l'extension quand la page est chargée
let downloaderInstance = null;

function initializeDownloader() {
  if (downloaderInstance) {
    downloaderInstance.cleanupExistingButtons();
  }
  downloaderInstance = new FacebookAdsDownloader();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDownloader);
} else {
  initializeDownloader();
}

// Système de filtrage avancé
class AdFilters {
  constructor(downloader) {
    this.downloader = downloader;
    this.currentFilters = null;
    this.filteredAds = [];
  }

  // Appliquer les filtres aux publicités
  applyFilters(filters) {
    this.currentFilters = filters;
    const allAds = this.downloader.findAdContainers(document);
    this.filteredAds = [];

    allAds.forEach(ad => {
      if (this.matchesFilters(ad, filters)) {
        this.filteredAds.push(ad);
        this.showAd(ad);
      } else {
        this.hideAd(ad);
      }
    });

    return {
      filteredCount: this.filteredAds.length,
      totalCount: allAds.length
    };
  }

  // Vérifier si une publicité correspond aux filtres
  matchesFilters(adElement, filters) {
    const metadata = this.downloader.extractAdMetadata(adElement);

    // Filtre par date
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      const adDate = new Date(metadata.date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59); // Inclure toute la journée de fin

      if (adDate < startDate || adDate > endDate) {
        return false;
      }
    }

    // Filtre par type de média
    if (filters.mediaFilter !== 'all') {
      const hasVideo = adElement.querySelector('video');
      const hasImage = adElement.querySelector('img[src*="fbcdn.net"]');

      if (filters.mediaFilter === 'video' && !hasVideo) {
        return false;
      }
      if (filters.mediaFilter === 'image' && !hasImage) {
        return false;
      }
    }

    // Filtre par statut
    if (filters.statusFilter !== 'all') {
      const isActive = metadata.status === 'Active';
      if (filters.statusFilter === 'active' && !isActive) {
        return false;
      }
      if (filters.statusFilter === 'inactive' && isActive) {
        return false;
      }
    }

    // Filtre par marque/compte
    if (filters.brandFilter && filters.brandFilter.trim()) {
      const searchTerm = filters.brandFilter.toLowerCase().trim();
      const brandMatch = metadata.brand.toLowerCase().includes(searchTerm);
      const accountMatch = metadata.account.toLowerCase().includes(searchTerm);
      
      if (!brandMatch && !accountMatch) {
        return false;
      }
    }

    return true;
  }

  // Masquer une publicité
  hideAd(adElement) {
    adElement.style.display = 'none';
    adElement.classList.add('filtered-out');
  }

  // Afficher une publicité
  showAd(adElement) {
    adElement.style.display = '';
    adElement.classList.remove('filtered-out');
  }

  // Effacer tous les filtres
  clearFilters() {
    this.currentFilters = null;
    this.filteredAds = [];
    
    // Réafficher toutes les publicités
    const allAds = this.downloader.findAdContainers(document);
    allAds.forEach(ad => {
      this.showAd(ad);
    });

    return {
      filteredCount: allAds.length,
      totalCount: allAds.length
    };
  }

  // Obtenir les statistiques de filtrage
  getFilterStats() {
    const allAds = this.downloader.findAdContainers(document);
    const stats = {
      total: allAds.length,
      videos: 0,
      images: 0,
      active: 0,
      inactive: 0,
      brands: new Set(),
      dateRange: { earliest: null, latest: null }
    };

    allAds.forEach(ad => {
      const metadata = this.downloader.extractAdMetadata(ad);

      // Compter les types de média
      if (ad.querySelector('video')) stats.videos++;
      if (ad.querySelector('img[src*="fbcdn.net"]')) stats.images++;

      // Compter les statuts
      if (metadata.status === 'Active') stats.active++;
      if (metadata.status === 'Inactive') stats.inactive++;

      // Collecter les marques
      if (metadata.brand) stats.brands.add(metadata.brand);
      if (metadata.account) stats.brands.add(metadata.account);

      // Trouver la plage de dates
      const adDate = new Date(metadata.date);
      if (!stats.dateRange.earliest || adDate < new Date(stats.dateRange.earliest)) {
        stats.dateRange.earliest = metadata.date;
      }
      if (!stats.dateRange.latest || adDate > new Date(stats.dateRange.latest)) {
        stats.dateRange.latest = metadata.date;
      }
    });

    stats.brands = Array.from(stats.brands);
    return stats;
  }
}

// Initialiser le système de filtrage
let filtersInstance = null;

// Message depuis le background script ou popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadAllAds') {
    if (downloaderInstance) {
      // Télécharger seulement les publicités filtrées si des filtres sont appliqués
      const adsToDownload = filtersInstance && filtersInstance.filteredAds.length > 0 
        ? filtersInstance.filteredAds 
        : downloaderInstance.findAdContainers(document);

      if (adsToDownload.length === 0) {
        alert('Aucune publicité trouvée avec les filtres actuels.');
        sendResponse({ success: false });
        return;
      }

      // Télécharger chaque publicité avec un délai
      adsToDownload.forEach((ad, index) => {
        setTimeout(() => {
          downloaderInstance.downloadAd(ad);
        }, index * 1000);
      });

      alert(`${adsToDownload.length} publicité(s) en cours de téléchargement...`);
    }
    sendResponse({ success: true });

  } else if (request.action === 'refreshDetection') {
    initializeDownloader();
    sendResponse({ success: true });

  } else if (request.action === 'getStatus') {
    if (downloaderInstance) {
      const allAds = downloaderInstance.findAdContainers(document);
      const visibleAds = filtersInstance && filtersInstance.currentFilters 
        ? filtersInstance.filteredAds.length 
        : allAds.length;
      
      // Utiliser les VRAIS compteurs
      console.log('📊 Status check:');
      console.log('- Ads trouvées par findAdContainers:', allAds.length);
      console.log('- Ads avec boutons ajoutés:', downloaderInstance.processedAds.size); 
      console.log('- Téléchargements réels:', downloaderInstance.downloadCount);
      
      sendResponse({ 
        success: true, 
        adsCount: allAds.length, // Le nombre RÉEL d'annonces trouvées
        totalAds: allAds.length,
        downloadCount: downloaderInstance.downloadCount // Le nombre RÉEL de téléchargements
      });
    } else {
      sendResponse({ 
        success: true, 
        adsCount: 0,
        totalAds: 0,
        downloadCount: 0
      });
    }

  } else if (request.action === 'applyFilters') {
    if (!filtersInstance && downloaderInstance) {
      filtersInstance = new AdFilters(downloaderInstance);
    }
    
    if (filtersInstance) {
      const results = filtersInstance.applyFilters(request.filters);
      sendResponse({ success: true, ...results });
    } else {
      sendResponse({ success: false, error: 'Filters not initialized' });
    }

  } else if (request.action === 'clearFilters') {
    if (filtersInstance) {
      const results = filtersInstance.clearFilters();
      sendResponse({ success: true, ...results });
    } else {
      sendResponse({ success: true });
    }

  } else if (request.action === 'getFilterStats') {
    if (filtersInstance) {
      const stats = filtersInstance.getFilterStats();
      sendResponse({ success: true, stats });
    } else if (downloaderInstance) {
      filtersInstance = new AdFilters(downloaderInstance);
      const stats = filtersInstance.getFilterStats();
      sendResponse({ success: true, stats });
    } else {
      sendResponse({ success: false });
    }

  } else if (request.action === 'getFilterSettings') {
    // Récupérer les paramètres de filtrage depuis le storage
    chrome.storage.local.get(['filterSettings'], (result) => {
      const filterSettings = result.filterSettings || {
        dateFilter: 'all',
        startDate: null,
        endDate: null,
        mediaFilter: 'all',
        statusFilter: 'all',
        brandFilter: ''
      };
      sendResponse({ success: true, filterSettings });
    });

  } else if (request.action === 'saveFilterSettings') {
    // Sauvegarder les paramètres de filtrage dans le storage
    chrome.storage.local.get(['filterSettings'], (result) => {
      const currentSettings = result.filterSettings || {};
      const newSettings = { ...currentSettings, ...request.data };
      
      chrome.storage.local.set({ filterSettings: newSettings }, () => {
        sendResponse({ success: true });
      });
    });
  }

  return true; // Garde la connexion ouverte pour la réponse asynchrone
});

// Initialiser l'extension quand la page est chargée
let downloaderInstance = null;
function initializeDownloader() {
  console.log('🚀 === INITIALISATION DOWNLOADER ===');
  console.log('📍 URL:', window.location.href);
  console.log('📍 Document ready state:', document.readyState);
  console.log('📍 Downloader instance existante:', !!downloaderInstance);
  
  if (downloaderInstance) {
    console.log('🧹 Nettoyage de l\'instance existante');
    downloaderInstance.cleanupExistingButtons();
  }
  
  console.log('🏗️ Création nouvelle instance');
  downloaderInstance = new FacebookAdsDownloader();
  console.log('✅ Downloader initialisé');
}

console.log('📄 Script content.js chargé');
console.log('📍 Document state initial:', document.readyState);

if (document.readyState === 'loading') {
  console.log('⏳ En attente du DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeDownloader);
} else {
  console.log('🏃 DOM déjà prêt, initialisation immédiate');
  initializeDownloader();
}