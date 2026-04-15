import React, { useState } from 'react';
import styles from './Settings.module.css';

const Settings: React.FC = () => {
  const [notificationTime, setNotificationTime] = useState('NaN');
  const [isCopyAnswerEnabled, setIsCopyAnswerEnabled] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(false);

  return (
    <div className={styles['settings-section']}>
      <div className={styles['section-header']}>
        <h3 className={styles['section-title']}>设置选项</h3>
      </div>
      <div className={styles['settings-content']}>
        <div className={styles['setting-item']}>
          <label className={styles['toggle-label']}>
            <span className={styles['toggle-text']}>开启Copy解答</span>
            <input 
              type="checkbox" 
              checked={isCopyAnswerEnabled}
              onChange={(e) => setIsCopyAnswerEnabled(e.target.checked)}
            />
            <span className={styles['toggle-slider']}></span>
          </label>
        </div>
        {/* <div className={styles['setting-item']}>
          <div className="flex items-center gap-2">
            <label className={styles['toggle-text']}>通知提醒：</label>
            <input 
              type="text" 
              className="w-[40px] px-1.5 py-1 border border-gray-300 rounded text-xs text-center"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
            />
            <span className={styles['toggle-text']}>秒</span>
          </div>
          <label className={styles['toggle-label']}>
            <input 
              type="checkbox" 
              checked={isNotificationEnabled}
              onChange={(e) => setIsNotificationEnabled(e.target.checked)}
            />
            <span className={styles['toggle-slider']}></span>
          </label>
        </div> */}
        <div className={styles['setting-item']}>
          <label className={styles['toggle-label']}>
            <span className={styles['toggle-text']}>开启高亮显示</span>
            <input 
              type="checkbox" 
              checked={isHighlightEnabled}
              onChange={(e) => setIsHighlightEnabled(e.target.checked)}
            />
            <span className={styles['toggle-slider']}></span>
          </label>
        </div>
          <div className={styles['setting-item']}>
          <label className={styles['toggle-label']}>
            <span className={styles['toggle-text']}>开启高亮显示</span>
            <input 
              type="checkbox" 
              checked={isHighlightEnabled}
              onChange={(e) => setIsHighlightEnabled(e.target.checked)}
            />
            <span className={styles['toggle-slider']}></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;