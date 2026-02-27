// Extension du PopupController pour le système de filtrage avancé

class PopupFilters {
  constructor(popupController) {
    this.popup = popupController;
    this.currentFilters = {
      dateFilter: 'all',
      startDate: null,
      endDate: null,
      mediaFilter: 'all',
      statusFilter: 'all',
      brandFilter: ''
    };
  }

  // Gérer le changement de filtre de date
  handleDateFilterChange(value) {
    this.currentFilters.dateFilter = value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (value === 'custom') {
      customDateRange.style.display = 'block';
      this.setDefaultCustomDates();
    } else {
      customDateRange.style.display = 'none';
    }
    
    this.updateSetting('dateFilter', value);
  }

  // Définir les dates par défaut pour la période personnalisée
  setDefaultCustomDates() {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) startDateInput.value = oneMonthAgo.toISOString().split('T')[0];
    if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
  }

  // Mettre à jour le filtre de date personnalisé
  updateCustomDateFilter() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    this.currentFilters.startDate = startDate;
    this.currentFilters.endDate = endDate;
    
    this.updateSetting('startDate', startDate);
    this.updateSetting('endDate', endDate);
  }

  // Appliquer les filtres
  async applyFilters() {
    try {
      const applyBtn = document.getElementById('applyFilters');
      applyBtn.disabled = true;
      applyBtn.textContent = 'Application...';

      // Calculer les dates de filtrage
      const dateRange = this.calculateDateRange();
      
      // Envoyer les filtres au content script
      const response = await this.popup.sendMessage({
        action: 'applyFilters',
        filters: {
          ...this.currentFilters,
          dateRange: dateRange
        }
      });

      if (response.success) {
        // Mettre à jour le statut avec les résultats filtrés
        this.popup.updateStatus();
        
        // Afficher un message de succès
        this.showFilterResults(response.filteredCount || 0, response.totalCount || 0);
      }

    } catch (error) {
      console.error('Erreur lors de l\'application des filtres:', error);
      alert('Erreur lors de l\'application des filtres.');
    } finally {
      const applyBtn = document.getElementById('applyFilters');
      applyBtn.disabled = false;
      applyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2l-8 8v6l-4-2V15L3 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Appliquer les filtres
      `;
    }
  }

  // Calculer la plage de dates basée sur le filtre sélectionné
  calculateDateRange() {
    const today = new Date();
    let startDate, endDate;

    switch (this.currentFilters.dateFilter) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
        
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date(today);
        break;
        
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        endDate = new Date(today);
        break;
        
      case '3months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        endDate = new Date(today);
        break;
        
      case 'custom':
        startDate = this.currentFilters.startDate ? new Date(this.currentFilters.startDate) : null;
        endDate = this.currentFilters.endDate ? new Date(this.currentFilters.endDate) : null;
        break;
        
      default:
        return null; // Pas de filtre de date
    }

    return {
      start: startDate ? startDate.toISOString().split('T')[0] : null,
      end: endDate ? endDate.toISOString().split('T')[0] : null
    };
  }

  // Afficher les résultats du filtrage
  showFilterResults(filteredCount, totalCount) {
    const statusSection = document.querySelector('.status-section');
    
    // Créer ou mettre à jour l'élément de résultats de filtre
    let filterResults = document.getElementById('filterResults');
    if (!filterResults) {
      filterResults = document.createElement('div');
      filterResults.id = 'filterResults';
      filterResults.className = 'filter-results';
      statusSection.appendChild(filterResults);
    }

    if (filteredCount < totalCount) {
      filterResults.innerHTML = `
        <div class="filter-status">
          <span class="filter-icon">🔍</span>
          <span>Filtres appliqués: ${filteredCount}/${totalCount} publicités</span>
          <button id="clearFilters" class="clear-filters-btn">Effacer</button>
        </div>
      `;

      // Ajouter l'événement pour effacer les filtres
      document.getElementById('clearFilters')?.addEventListener('click', () => {
        this.clearAllFilters();
      });
    } else {
      filterResults.innerHTML = '';
    }
  }

  // Effacer tous les filtres
  clearAllFilters() {
    // Réinitialiser les valeurs
    this.currentFilters = {
      dateFilter: 'all',
      startDate: null,
      endDate: null,
      mediaFilter: 'all',
      statusFilter: 'all',
      brandFilter: ''
    };

    // Réinitialiser l'interface
    document.getElementById('dateFilter').value = 'all';
    document.getElementById('mediaFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('brandFilter').value = '';
    document.getElementById('customDateRange').style.display = 'none';

    // Appliquer les filtres vides (montrer tout)
    this.applyFilters();
  }

  // Mettre à jour un paramètre
  updateSetting(key, value) {
    // Sauvegarder les paramètres de filtrage
    this.saveFilterSetting(key, value);
    
    // Aussi sauvegarder dans les paramètres généraux si nécessaire
    if (this.popup.updateSetting) {
      this.popup.updateSetting(key, value);
    }
  }

  // Sauvegarder un paramètre de filtrage spécifique
  async saveFilterSetting(key, value) {
    try {
      await this.popup.sendMessage({ 
        action: 'saveFilterSettings', 
        data: { [key]: value } 
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du paramètre de filtrage:', error);
    }
  }

  // Obtenir les statistiques des filtres
  async getFilterStats() {
    try {
      const response = await this.popup.sendMessage({ action: 'getFilterStats' });
      return response.success ? response.stats : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }
}

// Styles CSS pour les résultats de filtres
const filterCSS = `
.filter-results {
  margin-top: 12px;
  padding: 8px 12px;
  background: #e7f3ff;
  border-radius: 6px;
  border: 1px solid #1877f2;
}

.filter-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1877f2;
}

.filter-icon {
  font-size: 14px;
}

.clear-filters-btn {
  background: none;
  border: 1px solid #1877f2;
  color: #1877f2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  margin-left: auto;
}

.clear-filters-btn:hover {
  background: #1877f2;
  color: white;
}
`;

// Injecter les styles CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = filterCSS;
document.head.appendChild(styleSheet);