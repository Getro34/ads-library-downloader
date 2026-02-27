// Version debug ultra simple pour tester
console.log('🚀 CONTENT SCRIPT CHARGÉ - VERSION DEBUG');
console.log('📍 URL:', window.location.href);

function testDetection() {
  console.log('\n=== TEST DE DÉTECTION ===');
  
  // Test 1: Sélecteur standard
  const standardAds = document.querySelectorAll('[data-testid="ad_library_result"]');
  console.log('🧪 Test 1 - Sélecteur standard:', standardAds.length, 'éléments');
  
  // Test 2: Toutes les vidéos
  const allVideos = document.querySelectorAll('video');
  console.log('🧪 Test 2 - Vidéos trouvées:', allVideos.length);
  
  // Test 3: Images Facebook
  const fbImages = document.querySelectorAll('img[src*="fbcdn"]');
  console.log('🧪 Test 3 - Images Facebook:', fbImages.length);
  
  // Test 4: Articles
  const articles = document.querySelectorAll('div[role="article"]');
  console.log('🧪 Test 4 - Articles:', articles.length);
  
  // Test 5: Éléments data-testid
  const dataTestIds = document.querySelectorAll('[data-testid]');
  console.log('🧪 Test 5 - Éléments data-testid:', dataTestIds.length);
  
  // Afficher les premiers data-testid
  if (dataTestIds.length > 0) {
    console.log('📊 Premiers data-testid:');
    Array.from(dataTestIds).slice(0, 10).forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.getAttribute('data-testid')}`);
    });
  }
  
  console.log('=== FIN TEST ===\n');
}

// Tester immédiatement
testDetection();

// Tester après 3 secondes
setTimeout(testDetection, 3000);

// Tester toutes les 5 secondes
setInterval(testDetection, 5000);