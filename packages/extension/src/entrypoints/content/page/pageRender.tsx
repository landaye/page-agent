import React from 'react';
import HomePage from './home';
import HistoryPage from './history';
import { PageType } from './pageMenu';

/**
 * 渲染面板内容
 * @param currentPage 当前选中的页面
 * @returns React节点
 */
export const renderPanelContent = (currentPage: PageType | undefined) => (
  <div style={{ width: 320}}>
    {currentPage === 'home' && <HomePage />}
    {currentPage === 'history' && <HistoryPage />}
  </div>
);
