import React from 'react';
import { HomeIcon, CopyIcon, ClockIcon, GearIcon } from '@radix-ui/react-icons';

export type PageType = 'home' | 'history' | 'settings';

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  isShow?: boolean;
  isToggle?: boolean;
}

export const menuItems: MenuItem[] = [
  { key: 'main', icon: <HomeIcon />, label: '点击展开', isShow: true, isToggle: true },
  { key: 'home', icon: <CopyIcon />, label: '首页', isShow: false },
  { key: 'history', icon: <ClockIcon />, label: '历史', isShow: false },
  // { key: 'settings', icon: <GearIcon />, label: '设置', isShow: false },
];

/**
 * 处理菜单项点击事件
 * @param key 菜单项的key
 * @param menuExpanded 当前菜单展开状态
 * @param setMenuExpanded 设置菜单展开状态的函数
 * @param setCurrentPage 设置当前页面的函数
 */
export const handleMenuSelect = (
  key: string,
  menuExpanded: boolean,
  setMenuExpanded: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentPage: React.Dispatch<React.SetStateAction<PageType | undefined>>
) => {
  const item = menuItems.find(i => i.key === key);
  if (item?.isToggle) {
    const newExpanded = !menuExpanded;
    setMenuExpanded(newExpanded);
    menuItems.forEach(m => {
      if (!m.isToggle) {
        m.isShow = newExpanded;
      }
    });
    item.label = newExpanded ? '点击收起' : '点击展开';
  }
  else if (item?.isShow) {
    setCurrentPage(key as PageType);
  }
};

/**
 * 处理页面选择事件
 * @param key 菜单项的key
 * @param setCurrentPage 设置当前页面的函数
 */
export const handlePageSelect = (
  key: string,
  setCurrentPage: React.Dispatch<React.SetStateAction<PageType | undefined>>
) => {
  setCurrentPage(key as PageType);
};
