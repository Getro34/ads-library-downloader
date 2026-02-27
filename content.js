console.log('Facebook Ads Downloader loaded');

// Create download buttons
function addDownloadButtons() {
  const videos = document.querySelectorAll('video');
  
  videos.forEach(video => {
    // Skip if already processed
    if (video.dataset.processed) return;
    video.dataset.processed = 'true';
    
    // Create button
    const btn = document.createElement('div');
    btn.innerHTML = '⬇️';
    btn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      width: 30px;
      height: 30px;
      background: white;
      border: 2px solid #1877f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    // Position relative parent
    const parent = video.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    // Add click handler
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      const url = video.src || video.currentSrc;
      if (url) {
        // Generate simple filename with date and time
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const time = new Date().getHours() + 'h' + new Date().getMinutes();
        const filename = 'facebook_video_' + date + '_' + time + '.mp4';
        console.log('Downloading:', filename);
        
        chrome.runtime.sendMessage({
          action: 'download',
          url: url,
          filename: filename
        }, response => {
          if (response && response.success) {
            btn.style.background = '#28a745';
            setTimeout(() => {
              btn.style.background = 'white';
            }, 2000);
          } else {
            console.error('Download failed');
          }
        });
      }
    });
    
    // Add to parent
    if (parent) {
      parent.appendChild(btn);
    }
  });
}

// Run every 3 seconds
setInterval(addDownloadButtons, 3000);
addDownloadButtons();