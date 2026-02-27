# Facebook Ads Library Downloader

Une extension Chrome qui permet de télécharger facilement les publicités depuis la bibliothèque publicitaire Facebook.

## 📋 Fonctionnalités

- **Détection automatique** des publicités sur Facebook Ads Library
- **Icône de téléchargement** ajoutée à chaque publicité
- **Téléchargement individuel** ou **en lot** des publicités
- **Support des images et vidéos**
- **Interface utilisateur intuitive** avec popup de contrôle
- **Paramètres personnalisables** (format, qualité, métadonnées)
- **Téléchargement automatique** (optionnel)

## 🚀 Installation

### Installation manuelle (Développement)

1. **Téléchargez ou clonez** ce projet
2. **Ouvrez Chrome** et allez sur `chrome://extensions/`
3. **Activez le "Mode développeur"** (coin supérieur droit)
4. **Cliquez sur "Charger l'extension non empaquetée"**
5. **Sélectionnez le dossier** contenant les fichiers de l'extension
6. **L'extension est maintenant installée** et apparaît dans la barre d'outils

## 📖 Utilisation

### Méthode 1 : Téléchargement individuel
1. Naviguez vers [Facebook Ads Library](https://www.facebook.com/ads/library)
2. Les icônes de téléchargement (📥) apparaissent automatiquement sur chaque publicité
3. Cliquez sur l'icône pour télécharger la publicité

### Méthode 2 : Téléchargement en lot
1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Cliquez sur "Télécharger toutes les publicités"
3. Toutes les publicités visibles seront téléchargées automatiquement

### Méthode 3 : Menu contextuel
1. Faites un clic droit sur la page Facebook Ads Library
2. Sélectionnez "Télécharger toutes les publicités visibles"

## ⚙️ Paramètres

L'extension propose plusieurs options personnalisables :

- **Format de téléchargement** : Original, JPG, PNG
- **Qualité** : Haute, Moyenne, Basse
- **Inclure les métadonnées** : Sauvegarde les informations sur la publicité
- **Téléchargement automatique** : Télécharge automatiquement les nouvelles publicités détectées

## 📁 Structure des fichiers

```
facebook-ads-downloader/
├── manifest.json          # Configuration de l'extension
├── content.js             # Script injecté dans les pages Facebook
├── background.js          # Script de background pour les téléchargements
├── popup.html            # Interface du popup
├── popup.css             # Styles du popup
├── popup.js              # Logique du popup
├── styles.css            # Styles pour les boutons de téléchargement
├── icons/                # Icônes de l'extension
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # Ce fichier
```

## 🔧 Fonctionnement technique

### Détection des publicités
L'extension utilise plusieurs méthodes pour détecter les publicités :
- **Sélecteurs CSS** spécifiques à Facebook Ads Library
- **Analyse de structure HTML** pour identifier les conteneurs de publicités
- **Observation des mutations DOM** pour détecter les nouvelles publicités chargées dynamiquement

### Téléchargement des médias
- **Extraction des URLs** des images et vidéos
- **Téléchargement via Fetch API** avec fallback sur Chrome Downloads API
- **Nommage intelligent** des fichiers avec timestamp
- **Support de tous les formats** d'images et vidéos Facebook

## 🛠️ Développement

### Prérequis
- Chrome ou navigateur basé sur Chromium
- Connaissances en JavaScript, HTML, CSS
- Familiarité avec les Chrome Extensions APIs

### APIs utilisées
- **chrome.downloads** : Téléchargement de fichiers
- **chrome.storage** : Sauvegarde des paramètres
- **chrome.tabs** : Communication avec les onglets
- **chrome.contextMenus** : Menu contextuel
- **Fetch API** : Téléchargement des médias

### Personnalisation
Vous pouvez modifier le comportement de l'extension en éditant :
- `content.js` : Détection et interface des publicités
- `background.js` : Logique de téléchargement
- `popup.js` : Interface utilisateur du popup

## 📝 Notes importantes

### Respect des conditions d'utilisation
Cette extension est conçue pour un usage **légal et éthique**. Elle respecte les conditions d'utilisation de Facebook et ne contourne aucune protection technique.

### Limitations techniques
- Fonctionne uniquement sur Facebook Ads Library
- Nécessite que les publicités soient visibles à l'écran
- Certaines publicités peuvent avoir des protections spéciales

### Permissions requises
- **storage** : Sauvegarde des paramètres
- **downloads** : Téléchargement des fichiers
- **activeTab** : Accès à l'onglet actif
- **host_permissions** : Accès aux domaines Facebook

## 🐛 Dépannage

### L'extension ne détecte pas les publicités
1. Actualisez la page Facebook Ads Library
2. Utilisez le bouton "Actualiser la détection" dans le popup
3. Vérifiez que vous êtes bien sur facebook.com/ads/library

### Les téléchargements échouent
1. Vérifiez les permissions de l'extension
2. Assurez-vous que le dossier de téléchargement est accessible
3. Certaines publicités peuvent avoir des URLs temporaires

### L'interface ne s'affiche pas
1. Actualisez la page
2. Désactivez/réactivez l'extension
3. Vérifiez la console pour les erreurs JavaScript

## 🔄 Mises à jour

Pour mettre à jour l'extension :
1. Téléchargez la nouvelle version
2. Remplacez les anciens fichiers
3. Rechargez l'extension dans `chrome://extensions/`

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les **messages d'erreur** dans la console (F12)
2. Consultez la section **Dépannage** ci-dessus
3. Assurez-vous d'utiliser la **version la plus récente**

## ⚖️ Légal

Cette extension est fournie "en l'état" sans garantie. L'utilisateur est responsable du respect des conditions d'utilisation de Facebook et des lois applicables en matière de droits d'auteur.

---

**Version:** 1.0  
**Dernière mise à jour:** Février 2026