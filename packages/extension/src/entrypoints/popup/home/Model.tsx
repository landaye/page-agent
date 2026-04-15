import React, { useState } from 'react';
import styles from './Model.module.css';

const Model: React.FC = () => {
  const [model, setModel] = useState('DeepSeek...');
  const [knowledgeBase, setKnowledgeBase] = useState('加载中...');

  return (
    <div className={styles['model-section']}>
      {/* <div className={styles['section-header']}>
        <h3 className={styles['section-title']}>
          <span className={styles['title-icon']}>⚙️</span>
          模型设置
        </h3>
      </div> */}
      <div className={styles['selectors-row']}>
        <div className={styles['selector-half']}>
          <label className={styles['selector-label']}>
            模型
          </label>
          <div className={styles['popover-trigger']}>
            <span className={styles['trigger-name']}>{model}</span>
            <span className={styles['dropdown-arrow']}>▼</span>
          </div>
        </div>
        <div className={styles['selector-half']}>
          <label className={styles['selector-label']}>
            知识库
          </label>
          <div className={styles['popover-trigger']}>
            <span className={styles['trigger-name']}>{knowledgeBase}</span>
            <span className={styles['dropdown-arrow']}>▼</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model;