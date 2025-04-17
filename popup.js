const elements = {
  toggle: document.getElementById('toggle'),
  syncScroll: document.getElementById('syncScroll'),
  syncNavigation: document.getElementById('syncNavigation'),
  switchLayout: document.getElementById('switchLayout'),
  dividerWidth: document.getElementById('dividerWidth'),
  dividerColor: document.getElementById('dividerColor')
};

// Load settings
chrome.storage.sync.get([
  'syncScroll',
  'syncNavigation',
  'layout',
  'dividerWidth',
  'dividerColor'
], (result) => {
  elements.syncScroll.checked = result.syncScroll || false;
  elements.syncNavigation.checked = result.syncNavigation || false;
  elements.dividerWidth.value = result.dividerWidth || 5;
  elements.dividerColor.value = result.dividerColor || '#dddddd';
  
  const layout = result.layout || 'vertical';
  elements.switchLayout.textContent = 
    `Switch to ${layout === 'vertical' ? 'Horizontal' : 'Vertical'}`;
});

// Save settings
elements.syncScroll.addEventListener('change', () => 
  chrome.storage.sync.set({ syncScroll: elements.syncScroll.checked }));

elements.syncNavigation.addEventListener('change', () => 
  chrome.storage.sync.set({ syncNavigation: elements.syncNavigation.checked }));

elements.switchLayout.addEventListener('click', () => {
  chrome.storage.sync.get(['layout'], (result) => {
    const newLayout = result.layout === 'vertical' ? 'horizontal' : 'vertical';
    chrome.storage.sync.set({ layout: newLayout }, () => {
      elements.switchLayout.textContent = 
        `Switch to ${newLayout === 'vertical' ? 'Horizontal' : 'Vertical'}`;
    });
  });
});

elements.dividerWidth.addEventListener('change', () => 
  chrome.storage.sync.set({ dividerWidth: elements.dividerWidth.value }));

elements.dividerColor.addEventListener('change', () => 
  chrome.storage.sync.set({ dividerColor: elements.dividerColor.value }));

// Toggle split view
elements.toggle.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  window.close();
});