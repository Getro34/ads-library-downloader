// Background script pour l'extension Facebook Ads Downloader

// Gérer l'installation de l'extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Facebook Ads Downloader installé');
  
  // Configurer les réglages par défaut
  chrome.storage.sync.set({
    autoDownload: false,
    downloadFormat: 'original',
    downloadLocation: 'downloads'
  });

  // Créer le menu contextuel
  chrome.contextMenus.create({
    id: 'downloadAllAds',
    title: 'Télécharger toutes les publicités visibles',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.facebook.com/ads/library/*']
  });
});

// Gérer les messages du content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'downloadFile':
      handleDownload(request.data, sendResponse);
      return true; // Garde la connexion ouverte pour la réponse asynchrone
      
    case 'getSettings':
      getSettings(sendResponse);
      return true;
      
    case 'saveSettings':
      saveSettings(request.data, sendResponse);
      return true;
      
    case 'bulkDownload':
      handleBulkDownload(request.data, sendResponse);
      return true;
  }
});

// Gérer le téléchargement d'un fichier
async function handleDownload(downloadData, sendResponse) {
  try {
    const { url, filename, adId } = downloadData;
    
    // Créer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFilename = `${timestamp}_${filename}`;
    
    // Télécharger le fichier via Chrome Downloads API
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: `facebook_ads/${uniqueFilename}`,
      conflictAction: 'uniquify'
    });
    
    // Sauvegarder les métadonnées du téléchargement
    await saveDownloadMetadata(downloadId, {
      adId,
      originalUrl: url,
      downloadTime: new Date().toISOString(),
      filename: uniqueFilename
    });
    
    sendResponse({ success: true, downloadId });
    
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Gérer le téléchargement en lot
async function handleBulkDownload(downloads, sendResponse) {
  try {
    const results = [];
    
    for (const download of downloads) {
      try {
        const result = await new Promise((resolve) => {
          handleDownload(download, resolve);
        });
        results.push({ ...download, ...result });
      } catch (error) {
        results.push({ ...download, success: false, error: error.message });
      }
      
      // Petit délai entre les téléchargements pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    sendResponse({ success: true, results });
    
  } catch (error) {
    console.error('Erreur lors du téléchargement en lot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Obtenir les réglages
async function getSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get({
      autoDownload: false,
      downloadFormat: 'original',
      downloadLocation: 'downloads',
      downloadQuality: 'high',
      includeMetadata: true
    });
    
    sendResponse({ success: true, settings });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Sauvegarder les réglages
async function saveSettings(settings, sendResponse) {
  try {
    await chrome.storage.sync.set(settings);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Sauvegarder les métadonnées d'un téléchargement
async function saveDownloadMetadata(downloadId, metadata) {
  try {
    const key = `download_${downloadId}`;
    await chrome.storage.local.set({ [key]: metadata });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des métadonnées:', error);
  }
}

// Gérer les événements de téléchargement
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    // Notifier que le téléchargement est terminé
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'downloadComplete',
          downloadId: downloadDelta.id
        }).catch(() => {
          // Ignorer les erreurs si le content script n'est pas disponible
        });
      }
    });
  }
});

// Gérer les clics du menu contextuel
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'downloadAllAds') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'downloadAllAds'
    }).catch(() => {
      console.log('Content script non disponible');
    });
  }
});

// Gérer les mises à jour de l'extension
chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});

// Fonction utilitaire pour nettoyer les anciens téléchargements
async function cleanupOldDownloads() {
  try {
    const storage = await chrome.storage.local.get();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const key in storage) {
      if (key.startsWith('download_')) {
        const metadata = storage[key];
        const downloadTime = new Date(metadata.downloadTime).getTime();
        
        if (downloadTime < thirtyDaysAgo) {
          await chrome.storage.local.remove(key);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}

// Nettoyer les anciens téléchargements une fois par jour
setInterval(cleanupOldDownloads, 24 * 60 * 60 * 1000);