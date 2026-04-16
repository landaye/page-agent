import { useState, useEffect, useRef } from 'react';
import { throttle } from '@/entrypoints/content/utils/throttle';
import { getSelectionPosition } from '@/entrypoints/content/utils/selectionUtils';
import { calculateBestPopoverPosition } from '@/entrypoints/content/utils/positionUtils';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEYS } from '@/utils/storageKeys';

interface CopyButtonState {
  visible: boolean;
  position: { x: number; y: number };
  text: string;
  bestPosition:
  | 'top' | 'topLeft' | 'topRight'
  | 'left' | 'leftTop' | 'leftBottom'
  | 'right' | 'rightTop' | 'rightBottom'
  | 'bottom' | 'bottomLeft' | 'bottomRight';
}

export const useUtilityButton = () => {
  const [state, setState] = useState<CopyButtonState>({
    visible: false,
    position: { x: 0, y: 0 },
    text: '',
    bestPosition: 'topRight'
  });
  //存储上一次text，用于判断是否需要更新工具按钮
  const [lastText, setLastText] = useState<string>('');

  const utilityButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 处理鼠标抬起事件
  const handleMouseUp = (e: MouseEvent) => {

    // 2. 点击 ct-ai-answer-button 元素时，拦截
    console.log("点击了utilityButton", e.target);

    // 拦截包含wxt-react-page的标签
    if (e.target instanceof HTMLElement) {
      console.log("e.target.tagName", e.target.tagName);
      if (e.target.tagName == 'WXT-REACT-PAGE') {
        console.log("点击了wxt-react-page元素", e.target);
        return;
      }
    }

    const selectionInfo = getSelectionPosition();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    if (selectionInfo) {
      setTimeout(() => {
        const currentSelection = getSelectionPosition();
        if (currentSelection && currentSelection.text === selectionInfo.text) {
          showUtilityButton(mouseX, mouseY, selectionInfo.text);
        }
      }, 100);
    }
  };

  // 处理点击外部区域
  const handleOutsideClick = (e: MouseEvent) => {
    // 检查点击的是否是AI回答面板或其内部元素
    const aiAnswerContainer = document.getElementById('ct-ai-answer-container');
    if (aiAnswerContainer && aiAnswerContainer.contains(e.target as Node)) {
      return;
    }

    const copyButtonContainer = document.getElementById('ct-copy-button-container');
    if (state.visible && copyButtonContainer && !copyButtonContainer.contains(e.target as Node)) {
      hideUtilityButton();
    }
  };

  // 处理滚动事件
  const handleScroll = () => {
    hideUtilityButton();
  };

  //点击工具按钮时，隐藏工具按钮
  const handleUtilityButtonClick = () => {
    hideUtilityButton();
  };

  // 显示工具按钮
  const showUtilityButton = async (x: number, y: number, text: string) => {
    // 只有当文本发生变化时才更新工具按钮
    setLastText(text);
    const bestPosition = calculateBestPopoverPosition(x, y);
    setState(prev => ({
      ...prev,
      visible: true,
      position: { x, y },
      text,
      bestPosition,
    }));
    console.log("显示工具按钮", x, y, text);
    //存储当前选中的文本
    storage.setItem(await STORAGE_KEYS.tabIsolated.SELECTED_TEXT(), text);

    // 重置自动隐藏定时器
    if (utilityButtonTimerRef.current) {
      clearTimeout(utilityButtonTimerRef.current);
    }
    utilityButtonTimerRef.current = setTimeout(() => {
      if (state.visible) {
        hideUtilityButton();
      }
    }, 3000);
  };

  // 隐藏工具按钮
  const hideUtilityButton = () => {
    // 只有当弹窗不可见时才隐藏按钮容器
    setState(prev => ({ ...prev, visible: false }));
  };

  // 添加事件监听器
  useEffect(() => {
    // 为滚动事件创建节流版本的函数，减少触发频率
    const throttledHandleScroll = throttle(handleScroll, 500, { leading: true });

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('scroll', throttledHandleScroll, true);
    document.addEventListener('wheel', throttledHandleScroll, true);
    document.addEventListener('click', handleUtilityButtonClick);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('scroll', throttledHandleScroll, true);
      document.removeEventListener('wheel', throttledHandleScroll, true);
      document.removeEventListener('click', handleUtilityButtonClick);

      if (utilityButtonTimerRef.current) {
        clearTimeout(utilityButtonTimerRef.current);
      }
      // 清除节流函数的定时器
      throttledHandleScroll.cancel();
    };
  }, [state.visible]);

  return {
    state,
    hideUtilityButton,
  };
};

