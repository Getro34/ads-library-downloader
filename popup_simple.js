// Popup simple pour l'extension
document.addEventListener('DOMContentLoaded', function() {
  const adsCountElement = document.getElementById('adsCount');
  const downloadCountElement = document.getElementById('downloadCount');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  function updateStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getStatus'}, function(response) {
        if (chrome.runtime.lastError) {
          adsCountElement.textContent = '0';
          downloadCountElement.textContent = '0';
          console.log('Erreur communication:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          adsCountElement.textContent = response.adsFound || 0;
          downloadCountElement.textContent = response.downloads || 0;
        } else {
          adsCountElement.textContent = '0';
          downloadCountElement.textContent = '0';
        }
      });
    });
  }

  // Event listeners
  downloadAllBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'downloadAll'}, function(response) {
        if (response && response.success) {
          console.log('Boutons ajoutés');
          setTimeout(updateStatus, 1000); // Mise à jour après 1 seconde
        }
      });
    });
  });

  refreshBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  });

  // Mise à jour initiale
  updateStatus();
  
  // Mise à jour périodique
  setInterval(updateStatus, 3000);
});