import React from 'react';
import styles from './Header.module.css';

const Header: React.FC = () => {
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
        <div className={styles['connection-status']}>
          <div className={styles['status-dot']}></div>
          <span className={styles['status-text']}>未登录</span>
        </div>
      </div>
    </header>
  );
};

export default Header;