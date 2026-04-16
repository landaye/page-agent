import React, { useState, useRef, useEffect } from 'react';
import { throttle } from '../../utils/throttle';
import styles from './index.module.css';
import { DotsHorizontalIcon, Cross2Icon, CopyIcon, MagicWandIcon, BoxIcon, GearIcon, ArrowRightIcon, ReloadIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import FixedIcon from '@/assets/icon/FixedIcon';
import { Button } from '@/components/ui/button';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEYS } from '@/utils/storageKeys';

interface DragModalProps {
  initTop?: number;
  initLeft?: number;
  onClose: () => void;
  // 新增：是否加载中状态
  loading?: boolean;
  header?: React.ReactNode;
  children: React.ReactNode;
  visible?: boolean; // 新增visible属性，统一控制弹窗显示
}
// 新增：定义历史记录项的类型，避免any，提升类型安全
interface HistoryItem {
  url: string;
  content: string;
  timestamp: string;
}

const DragModal: React.FC<DragModalProps> = ({
  initTop = 100,
  initLeft = 100,
  onClose,
  // 新增：是否加载中状态
  loading = true,
  header,
  children,
  visible = true
}) => {
  // 弹窗位置状态
  const [position, setPosition] = useState({
    top: initTop,
    left: initLeft
  });

  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // 处理鼠标按下（开始拖拽）
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.left,
      y: e.clientY - position.top
    });
    // 阻止事件冒泡，避免影响其他元素
    e.stopPropagation();
  };

  // 处理鼠标移动（拖拽中）
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newLeft = e.clientX - dragStart.x;
    const newTop = e.clientY - dragStart.y;

    // 限制弹窗在可视区域内
    const maxLeft = window.innerWidth - (modalRef.current?.offsetWidth || 300);
    const maxTop = window.innerHeight - (modalRef.current?.offsetHeight || 400);

    setPosition({
      top: Math.max(0, Math.min(newTop, maxTop)),
      left: Math.max(0, Math.min(newLeft, maxLeft))
    });
  };

  //弹窗打开时的位置检查和调整
  const checkAndAdjustPosition = () => {
    const modalRect = modalRef.current?.getBoundingClientRect();
    if (!modalRect) return;

    // 检查是否超出窗口边界
    const maxLeft = window.innerWidth - modalRect.width;
    const maxTop = window.innerHeight - modalRect.height;

    setPosition({
      top: Math.max(0, Math.min(position.top, maxTop)),
      left: Math.max(0, Math.min(position.left, maxLeft))
    });
  };
  // 弹窗打开时检查和调整位置
  useEffect(() => {
    if (visible) {
      checkAndAdjustPosition();
    }
  }, [visible]);

  // 处理鼠标松开（结束拖拽）
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 监听全局鼠标移动和松开事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 如果不可见则不渲染
  if (!visible) {
    return null;
  }
  // 固定弹窗页面一直展示
  const [isFixed, setIsFixed] = useState(false);
  // 从本地存储加载固定状态
  useEffect(() => {
    const loadFixedState = async () => {
      const fixed = await storage.getItem(await STORAGE_KEYS.tabIsolated.DRAG_MODAL_FIXED());
      console.log('加载固定状态:', fixed);
      setIsFixed(Boolean(fixed));
    };
    loadFixedState();
  }, []);
  // 处理固定弹窗
  const onFixed = async () => {
    setIsFixed(!isFixed);
    // 保存固定状态到本地存储
    await storage.setItem(await STORAGE_KEYS.tabIsolated.DRAG_MODAL_FIXED(), !isFixed);
    console.log('保存固定状态:', !isFixed);
  };

  // 监听鼠标点击关闭弹窗，如果点击的是关闭按钮，则关闭弹窗
  // 点击除drag-modal其他区域，则也关闭弹窗
  // 如果fixed为true，点击除drag-modal其他区域，则不关闭弹窗，点击关闭按钮才关闭弹窗
  // 如果fixed为false，点击除drag-modal其他区域，也关闭弹窗
  useEffect(() => {
    // 监听点击事件
    const onCloseModal = (e: MouseEvent) => {
      console.log('是否关闭窗口:', isFixed, visible);
      // 如果是固定弹窗，或者弹窗不可见，则不关闭弹窗
      if (isFixed) {
        console.log('固定弹窗: 不关闭弹窗');
        return;
      };
      if (!visible) {
        console.log('弹窗不可见: 不关闭弹窗');
        return;
      }

      console.log('关闭弹窗');
      onClose();
    };

    // 为滚动事件创建节流版本的函数，减少触发频率
    const throttledOnScroll = throttle((e: Event) => {
      if (!modalRef.current) return;
      // 拦截包含wxt-react-page的标签
      if (e.target instanceof HTMLElement) {
        console.log("点击弹窗事件目标", e.target);
        console.log("弹窗", e.target.tagName);
        if (e.target.tagName == 'WXT-REACT-PAGE') {
          console.log("wxt-react-page弹窗元素", e.target);
          return;
        }
      }
      console.log('关闭弹窗');
      onCloseModal(e as MouseEvent);
    }, 500);

    // 在document上添加点击事件监听器
    document.addEventListener('click', throttledOnScroll as unknown as EventListener);
    // 鼠标滚动时，使用节流函数处理，减少卡顿
    document.addEventListener('wheel', throttledOnScroll as unknown as EventListener);

    // 点击弹窗区域，阻止事件冒泡，避免关闭弹窗
    // 清理函数，组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('click', throttledOnScroll as unknown as EventListener);
      document.removeEventListener('wheel', throttledOnScroll as unknown as EventListener);
    };
  }, [isFixed, visible]);


  //=============菜单功能=================
  // 清除历史记录
  const clearHistory = async () => {
    //清除历史记录
    await storage.removeMeta(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST());
    // 重置索引
    await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_INDEX(), 0);
    // 重置历史记录计数器
    await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_COUNTER(), 0);
  };

  // 下拉菜单状态
  const [dropdownOpen, setDropdownOpen] = useState(false);

  //======================================================================================
  // 获取历史记录 - 优化类型定义
  const [historyList, setHistoryList] = useState<{ data: HistoryItem[] }>({ data: [] });
  // 查看的索引
  const [historyIndex, setHistoryIndex] = useState(0);
  //历史记录数量
  const [historyCount, setHistoryCount] = useState(0);

  // 封装获取历史记录的函数
  const getHistory = async () => {
    try {
      const meta = await storage.getMeta(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST());
      // 优化：严谨的类型转换和空值处理
      const rawData = meta ? (
        // 如果存储的是包装对象（{ data: [...] }），取data；否则直接用数组
        typeof meta === 'object' && !Array.isArray(meta) && 'data' in meta
          ? meta.data
          : meta
      ) : [];
      // 确保是数组且符合HistoryItem类型
      const validData = Array.isArray(rawData) ? rawData as HistoryItem[] : [];
      //获取
      setHistoryList({ data: validData });
      // 初始化时设置数量
      setHistoryCount(validData.length);
      console.log('获取历史记录', validData);
      // 新增：当有数据且当前索引为0时，同步更新显示的数据
      if (validData.length > 0 && historyIndex === 0) {
        await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_INDEX_DATA(), validData[0]);
        console.log('初始化更新显示数据:', validData[0]);
      }
    } catch (err) {
      console.error('获取历史记录失败:', err);
      // 兜底：失败时重置为空数组
      setHistoryList({ data: [] });
    }
  };

  // ========== 组件初始化时调用getHistory ==========
  useEffect(() => {
    // 组件挂载后立即获取历史记录
    getHistory();
  }, []); // 空依赖：仅在组件初始化时执行一次

  // ========== 监听存储变化 + 初始化兼容 ==========
  useEffect(() => {
    (async () => {
      // 设置监听
      const unwatch = storage.watch<number>(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_COUNTER(), (newCount, oldCount) => {
        console.log('Count changed:', { newCount, oldCount });
        //重置索引
        setHistoryIndex(0);
        //获取历史记录
        getHistory();
      });
      // 组件卸载时清理监听
      return () => {
        unwatch();
      };
    })();
  }, []); // 空依赖：仅初始化一次监听

  // 切换到下一条记录
  const switchNextHistory = async () => {
    console.log('切换到下一条记录', historyIndex, historyCount);
    if (historyIndex < historyCount - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      //存储索引
      await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_INDEX(), nextIndex);
      //通知渲染历史记录
      await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_INDEX_DATA(), historyList.data[nextIndex]);
    }
  };

  // 切换到上一条记录
  const switchPrevHistory = async () => {
    console.log('切换到上一条记录', historyIndex, historyCount);
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      //存储索引
      await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_INDEX(), prevIndex);
      //通知渲染历史记录
      await storage.setItem(await STORAGE_KEYS.tabIsolated.FULL_RESULT_LIST_INDEX_DATA(), historyList.data[prevIndex]);
    }
  };

  return (
    <div
      className={`${styles.dragModal} ${isDragging ? styles.dragging : ''}`}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 12345678,// 确保弹窗在最上层
        backgroundColor: '#ffffff',
      }}
      ref={modalRef}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <div
        className={styles.dragModalHeader}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.dragModalTitle}>
          {header || '可拖拽弹窗'}
          {/* 分页按钮 */}
          {isFixed && historyCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center',
            }}>
              <Button variant="ghost" onClick={() => switchPrevHistory()} disabled={historyList.data.length === 0}>
                <ChevronLeftIcon width={16} height={16} />
              </Button>
              <span style={{
                fontSize: '12px',
                color: '#666',
              }}>{historyIndex + 1}/{historyCount}</span>
              <Button variant="ghost" onClick={() => switchNextHistory()} disabled={historyList.data.length === 0}>
                <ChevronRightIcon width={16} height={16} />
              </Button>
            </div>
          )}

        </div>
        {/* 默认按钮 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* 固定按钮 */}
          <Button
            id="ct-ai-answer--button"
            variant="ghost"
            style={{ width: '24px', height: '24px' }}
            onClick={() => onFixed()}
          >
            <FixedIcon width={16} height={16} color={isFixed ? '#bc45ff' : '#666666'} />
          </Button>
          {/* 更多按钮 */}
          <div className="relative">
            <Button
              id="ct-ai-answer-more-button"
              variant="ghost"
              style={{ width: '24px', height: '24px' }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <DotsHorizontalIcon width={16} height={16} />
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                <div className="px-4 py-3 text-lg font-medium text-gray-800">分组1</div>
                <button className="w-full text-left px-4 py-3 text-lg text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                  <BoxIcon className="w-6 h-6" />
                  Menu Item 1
                  <span className="ml-auto text-base text-gray-500">Ctrl+B</span>
                </button>
                <button className="w-full text-left px-4 py-3 text-lg text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                  <GearIcon className="w-6 h-6" />
                  Menu Item 2
                  <span className="ml-auto text-base text-gray-500">Ctrl+V</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-3 text-lg font-medium text-gray-800">分组2</div>
                <button
                  className="w-full text-left px-4 py-3 text-lg text-red-600 hover:bg-gray-100 flex items-center gap-3"
                  onClick={() => {
                    clearHistory();
                    setDropdownOpen(false);
                  }}
                >
                  <ClockIcon className="w-6 h-6" />
                  清除缓存
                </button>
              </div>
            )}
          </div>
          {/* 关闭按钮 */}
          <Button
            id="ct-ai-answer-close-button"
            variant="ghost"
            style={{ width: '24px', height: '24px' }}
            onClick={() => onClose()}
          >
            <Cross2Icon width={16} height={16} />
          </Button>
        </div>
      </div>
      <div className={styles.dragModalContent}>
        {children}
      </div>
    </div>
  );
};

export default DragModal;