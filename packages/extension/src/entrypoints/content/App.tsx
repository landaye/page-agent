import React, { useState, useEffect } from 'react'; // 新增：导入useEffect
import styles from './App.module.css';
import '@/assets/index.css';
import { useUtilityButton } from '@/entrypoints/content/hooks/useUtilityButton';
import { useDraggable } from '@/entrypoints/content/hooks/useDraggable';
import { Button } from '@/components/ui/button';
import { MagicWandIcon, MagnifyingGlassIcon, ClockIcon } from '@radix-ui/react-icons';
import HomePage from '@/entrypoints/content/page/index';
import DragModal from '@/entrypoints/content/page/modal';
import TranslateIcon from '@/assets/icon/Translate';
import FeedbackIcon from '@/assets/icon/Feedback';
import { flowerEffect } from '@/entrypoints/content/utils/flowerEffect';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEYS } from '@/utils/storageKeys';
function App() {
  const [modalVisible, setModalVisible] = useState(false);
  // 加载中状态
  const [loading, setLoading] = useState(true);
  const [modalPosition, setModalPosition] = useState({ top: 150, left: 200 });
  // 工具标题
  const [utilityTitle, setUtilityTitle] = useState('AI解答');
  // 控制功能按钮显示/隐藏的状态
  const [showButtons, setShowButtons] = useState(false);
  // 使用悬浮工具按钮 Hook
  const { state: utilityButtonState, hideUtilityButton } = useUtilityButton();
  // 使用拖动功能 Hook，初始位置设置在右上角
  const { bind } = useDraggable({ initialX: window.innerWidth - 80, initialY: 50, boundaryPadding: 10 });

  return (
    <div className="wxt-content-container" >
      {/* 配置固定悬浮菜单 */}
      <div style={{ ...bind.style, zIndex: 12345678 }} onMouseDown={bind.onMouseDown}>
        <div className={styles.floatingContainer}>
          <div className={styles.verticalMenu}
            onMouseEnter={() => setShowButtons(true)}
            onMouseLeave={() => setShowButtons(true)}>
            {/* 拖动固定菜单 */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: " #ffffff",
              boxShadow: '1px 6px 6px 1px rgba(0, 0, 0, 0.1)',
              width: "45px",
              height: "45px",
              boxSizing: "border-box",
              borderRadius: "50%",
            }}>

              <div className="bg-gradient-ai-general-5"  style={{
                width: '40px',
                height: '40px',      // 补充内边距，让内容不拥挤
                borderRadius: '50%',      // 补充圆角，提升视觉效果
                display: 'flex',   // 让图标和文字水平对齐
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '4px',               // 图标和文字之间的间距
                // 鼠标悬浮显示手型
                border: 'none',            // 清除默认边框
                fontSize: '12px',
                cursor: 'pointer',
              }}>
               <MagicWandIcon className="text-white" />
              </div>

            </div>
            {/* 按钮 */}
            {showButtons && (
              <>
                <div style={
                  {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: '1px 6px 6px 1px rgba(0, 0, 0, 0.1)',
                    padding: "6px",
                    gap: "6px",
                    width: "32px",
                    boxSizing: "border-box",
                    borderRadius: "16px",
                  }
                }>
                  {/* 打开ai解答页面的按钮 */}
                  <Button
                    className='bg-gradient-ai-general-5 ct-ai-answer-button rounded-full p-2'
                    onClick={async (e) => {
                      // 阻止事件冒泡，避免触发modal的关闭逻辑
                      e.stopPropagation();
                      // 获取按钮位置
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      // 设置模态框初始位置为按钮下方
                      setModalPosition({
                        top: rect.bottom,
                        left: rect.left
                      });
                      setModalVisible(true);
                      // 加载中状态
                      storage.setItem(await STORAGE_KEYS.tabIsolated.IS_LOADING(), false);
                      // 关闭工具按钮
                      hideUtilityButton();
                      // 设置弹窗工具标题
                      setUtilityTitle('AI解答');
                    }} >
                    <ClockIcon/>
                  </Button>

                  {/* 反馈 */}
                  <Button
                    className='bg-gradient-ai-general-5 ct-ai-answer-button rounded-full p-2'
                    onClick={(e) => {
                    }} >
                    <FeedbackIcon />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 配置鼠标滑动动态悬浮工具 */}
      <div className="copy-buttons-container" id="ct-copy-button-container" style={{
        position: 'fixed',
        zIndex: 12345678,
        left: `${utilityButtonState.position.x + 10}px`,
        top: `${utilityButtonState.position.y - 25}px`,
        display: 'flex',
        gap: '4px',
        visibility: utilityButtonState.visible ? 'visible' : 'hidden',
        maxWidth: '300px',
        maxHeight: '200px',
      }}>
        {/* 打开ai解答页面的按钮 */}
        <Button
          className='ct-ai-answer-button rounded-full p-2'
          style={{
            background: 'var(--semi-color-ai-general)',
          }} size="icon-sm" onClick={async (e) => {
            // 阻止事件冒泡，避免触发modal的关闭逻辑
            e.stopPropagation();
            // 触发撒花效果
            flowerEffect.triggerFlower(3);
            // 获取按钮位置
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            // 设置模态框初始位置为按钮下方
            setModalPosition({
              top: rect.bottom,
              left: rect.left
            });
            setModalVisible(true);
            // 加载中状态
            storage.setItem(await STORAGE_KEYS.tabIsolated.IS_LOADING(), true);
            // 关闭工具按钮
            hideUtilityButton();
            // 设置弹窗工具标题
            setUtilityTitle('AI解答');
            // 从存储中获取当前选中的文本
            const selectedText = await storage.getItem(await STORAGE_KEYS.tabIsolated.SELECTED_TEXT());
            // 如果有选中的文本，添加到AI解答中
            console.log('AI解答:', selectedText);
            const result = selectedText + ',请帮我解答';
            setTimeout(() => {
             console.log('AI解答:', result);
            }, 300);
          }} >
          <MagnifyingGlassIcon className="text-white" />
        </Button>

        <Button
          className='ct-ai-answer-button rounded-full p-2'
          style={{
            background: 'var(--semi-color-ai-general)',
          }} size="icon-sm" onClick={async (e) => {
            // 阻止事件冒泡，避免触发modal的关闭逻辑
            e.stopPropagation();
            // 获取按钮位置
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            // 设置模态框初始位置为按钮下方
            setModalPosition({
              top: rect.bottom,
              left: rect.left
            });
            setModalVisible(true);
            // 加载中状态
            storage.setItem(await STORAGE_KEYS.tabIsolated.IS_LOADING(), true);
            // 关闭工具按钮
            hideUtilityButton();
            // 设置弹窗工具标题
            setUtilityTitle('AI翻译');
            // 从存储中获取当前选中的文本
            const selectedText = await storage.getItem(await STORAGE_KEYS.tabIsolated.SELECTED_TEXT());
            // 如果有选中的文本，添加到AI解答中
            console.log('AI翻译:', selectedText);
            // 调用翻译接口
            const result = selectedText + '，请翻译为中文';
            setTimeout(() => {
              console.log('AI翻译:', result);
            }, 300);
          }} >
          <TranslateIcon />
        </Button>

      </div>

      {/* 悬浮窗口 */}
      {modalVisible && (
        <DragModal
          // 传递visible属性，确保状态同步
          visible={modalVisible}
          // 使用按钮位置作为初始位置
          initTop={modalPosition.top}
          initLeft={modalPosition.left}
          // 关闭弹窗回调
          onClose={() => setModalVisible(false)}
          // 自定义头部（具名插槽）
          header={<div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {/* 第一种样式：主色背景+白色文字 */}
            <div className='bg-gradient-ai-general-5 text-white'  style={{
              padding: '2px 8px',       // 补充内边距，让内容不拥挤
              borderRadius: '15px',      // 补充圆角，提升视觉效果
              display: 'inline-flex',   // 让图标和文字水平对齐
              alignItems: 'center',     // 垂直居中
              gap: '6px',               // 图标和文字之间的间距
              // 鼠标悬浮显示手型
              border: 'none',            // 清除默认边框
              fontSize: '12px',
            }}
              onClick={() => {
                // 触发撒花效果
                flowerEffect.triggerFlower(3);
              }}
            >
              <MagicWandIcon className="text-white w-4 h-4" />
              {utilityTitle}
            </div>

            {/* 第二种样式：白色背景+紫色文字+主色边框 */}
            {/* <div
              style={{
                background: 'var(--semi-color-white)',
                color: 'var(--semi-color-ai-purple)',
                // 先设置边框宽度和样式（必须，border-image 依赖）
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '15px',
                // 设置渐变边框（border-image 会覆盖 border-color）
                borderImage: 'linear-gradient(278deg, rgba(194, 53, 219), rgba(134, 54, 219) 30%, rgba(88, 77, 219) 60%, rgba(33, 114, 219)) 1',
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              <IconAIFilledLevel1 size="small" />AI解答2
            </div> */}

            {/* 第三种样式：浅背景+紫色文字+主色边框 */}
            {/* <div style={{
              background: 'var(--semi-ai-general-0)',
              color: 'var(--semi-color-ai-purple)',
              padding: '2px 8px',
              borderRadius: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
            }}>
              <IconAIFilledLevel3 size="small" />AI解答3
            </div> */}
            {/* 第四种样式：浅背景+紫色文字+渐变边框 */}
            {/* <div
              style={{
                // 外层容器用渐变背景模拟边框
                background: 'linear-gradient(278deg, rgba(194, 53, 219), rgba(134, 54, 219) 30%, rgba(88, 77, 219) 60%, rgba(33, 114, 219))',
                padding: '1px', // 边框宽度（对应原 border 1px）
                borderRadius: '15px',
                display: 'inline-flex',
                
              }}
            >
              <div
                style={{
                  background: 'var(--semi-color-white)',
                  color: 'var(--semi-color-ai-purple)',
                  padding: '2px 8px',
                  borderRadius: '15px', // 比外层小 1px 避免圆角溢出
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <IconAIFilledLevel3 size="small" />AI解答4
              </div>
            </div> */}
          </div>}
        >
          {/* 弹窗主体内容（默认插槽） */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            {/* 优化：传递当前选中的历史记录内容 */}
            <HomePage
              // text={''}
              // onClose={() => setModalVisible(false)}
            />
          </div>
        </DragModal>
      )}
    </div>
  );
}

export default App;