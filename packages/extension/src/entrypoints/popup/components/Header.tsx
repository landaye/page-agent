import React from 'react';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const openSidepanelSettings = async () => {
    try {
      // Get active tab first
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        const tab = tabs[0];
        
        // Set a flag in storage to open settings
        await chrome.storage.local.set({ openSettings: true });
        
        // Open sidepanel
        await chrome.sidePanel.open({ tabId: tab.id!, windowId: tab.windowId });
        console.log('Sidepanel settings opened successfully');
        
        // Close popup
        window.close();
      } else {
        console.error('No active tab found');
      }
    } catch (error) {
      console.error('Error opening sidepanel settings:', error);
    }
  };

  return (
    <header className={styles['popup-header']}>
      <div className={styles['header-content']}>
        <div className="flex items-center gap-2.5">
          <div className="text-xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 3.84L16.16 7 12 9.16 7.84 7 12 5.84zm0 12.32l-4.16-2.4L12 14.56l4.16 2.4L12 21.16zm0-6.16l-4.16 2.4L12 18.56l4.16-2.4L12 15z" />
            </svg>
          </div>
          <h1 className={styles['app-title']}>Page Agent</h1>
        </div>
        <button 
          onClick={openSidepanelSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
          <span className="text-xs font-medium">设置</span>
        </button>
      </div>
    </header>
  );
};

export default Header;