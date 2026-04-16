import React from 'react';
import Model from './Model';
import Settings from './Settings';

const Main: React.FC = () => {
  const openSidepanel = async () => {
    try {
      // Get active tab first
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        const tab = tabs[0];
        await chrome.sidePanel.open({ tabId: tab.id!, windowId: tab.windowId });
        console.log('Sidepanel opened successfully');
      } else {
        console.error('No active tab found');
      }
    } catch (error) {
      console.error('Error opening sidepanel:', error);
    }
  };

  return (
    <main className="flex flex-col justify-between px-5 py-3  overflow-y-auto bg-gray-50">
      <Model />
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-semibold text-gray-700">最新记录</h3>
          <button className="bg-transparent border-none text-sm text-gray-500 cursor-pointer p-0 w-5 h-5 flex items-center justify-center">⋮</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-md min-h-[100px] flex items-center justify-center">
          <div className="text-center text-gray-400 text-xs">
            <p>暂无历史记录</p>
          </div>
        </div>
      </div>
      <Settings />
      <button 
        className="w-full py-3 mt-3 bg-gradient-ai-general-5 border-none rounded-md text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        onClick={openSidepanel}
      >
        打开侧边栏
      </button>
    </main>
  );
};

export default Main;