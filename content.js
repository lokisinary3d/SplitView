(async () => {
  const existing = document.getElementById('split-view-overlay');
  if (existing) {
    existing.remove();
    return;
  }

  const storage = await chrome.storage.sync.get([
    'syncScroll',
    'dividerPosition',
    'layout',
    'dividerWidth',
    'dividerColor',
    'syncNavigation'
  ]);

  const overlay = document.createElement('div');
  overlay.id = 'split-view-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    z-index: 99999999;
    display: flex;
    background: white;
    flex-direction: ${storage.layout === 'horizontal' ? 'column' : 'row'};
  `;

  const createPane = () => {
    const iframe = document.createElement('iframe');
    iframe.src = location.href;
    iframe.style.cssText = `
      border: none;
      ${storage.layout === 'horizontal' ? 'width: 100%;' : 'height: 100%;'}
    `;
    return iframe;
  };

  const left = createPane();
  const right = createPane();

  // Set initial dimensions
  const dividerWidth = parseInt(storage.dividerWidth, 10) || 5;
  const dividerPosition = storage.dividerPosition || 50;
  
  const setPaneDimensions = () => {
    const dimension = storage.layout === 'horizontal' ? 'height' : 'width';
    const leftSize = `calc(${dividerPosition}% - ${dividerWidth/2}px)`;
    const rightSize = `calc(${100 - dividerPosition}% - ${dividerWidth/2}px)`;
    
    left.style[dimension] = leftSize;
    right.style[dimension] = rightSize;
  };
  setPaneDimensions();

  // Create divider
  const divider = document.createElement('div');
  divider.style.cssText = `
    background: ${storage.dividerColor || '#ddd'};
    transition: background 0.2s;
    ${storage.layout === 'horizontal' ? `
      height: ${dividerWidth}px;
      cursor: row-resize;
      width: 100%;
    ` : `
      width: ${dividerWidth}px;
      cursor: col-resize;
      height: 100%;
    `}
  `;

  // Divider hover effects
  divider.addEventListener('mouseenter', () => divider.style.background = '#999');
  divider.addEventListener('mouseleave', () => divider.style.background = storage.dividerColor || '#ddd');

// Drag handling
let isDragging = false;
let startPos, startPaneSize;

const handleDrag = (e) => {
  if (!isDragging) return;
  
  const currentPos = storage.layout === 'horizontal' ? e.clientY : e.clientX;
  const overlaySize = storage.layout === 'horizontal' ? 
    overlay.offsetHeight : overlay.offsetWidth;
  const delta = currentPos - startPos;
  let newSize = startPaneSize + (delta / overlaySize) * 100;
  newSize = Math.max(10, Math.min(90, newSize));

  const dimension = storage.layout === 'horizontal' ? 'height' : 'width';
  left.style[dimension] = `calc(${newSize}% - ${dividerWidth/2}px)`;
  right.style[dimension] = `calc(${100 - newSize}% - ${dividerWidth/2}px)`;
  
  chrome.storage.sync.set({ dividerPosition: newSize });
};

divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  startPos = storage.layout === 'horizontal' ? e.clientY : e.clientX;
  startPaneSize = parseFloat(
    storage.layout === 'horizontal' ? 
    left.style.height : 
    left.style.width
  ) || 50;
  
  // Disable pointer events on iframes during drag
  left.style.pointerEvents = 'none';
  right.style.pointerEvents = 'none';

  const cleanup = () => {
    isDragging = false;
    left.style.pointerEvents = 'auto';
    right.style.pointerEvents = 'auto';
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', cleanup);
    document.removeEventListener('mouseleave', cleanup);
  };

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', cleanup);
  document.addEventListener('mouseleave', cleanup);
});

  // Sync navigation
  if (storage.syncNavigation) {
    const syncNavigation = (src, target) => {
      src.addEventListener('load', () => {
        try {
          const newUrl = src.contentWindow.location.href;
          if (target.src !== newUrl) target.src = newUrl;
        } catch (e) {}
      });
    };
    syncNavigation(left, right);
    syncNavigation(right, left);
  }

  // Sync scroll
  if (storage.syncScroll) {
    const syncScroll = (src, target) => {
      let ignore = false;
      src.contentWindow.addEventListener('scroll', () => {
        if (ignore) return;
        ignore = true;
        target.contentWindow.scrollTo({
          top: src.contentWindow.scrollY,
          left: src.contentWindow.scrollX
        });
        setTimeout(() => ignore = false, 50);
      });
    };
    left.addEventListener('load', () => syncScroll(left, right));
    right.addEventListener('load', () => syncScroll(right, left));
  }

  overlay.append(left, divider, right);
  document.body.appendChild(overlay);
})();