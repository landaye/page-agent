import { debounce } from '@/entrypoints/content/utils/throttle';
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface UseDraggableOptions {
  initialX?: number;
  initialY?: number;
  boundaryPadding?: number;
  elementRef?: React.RefObject<HTMLElement>;
}

interface UseDraggableReturn {
  position: { x: number; y: number };
  isDragging: boolean;
  bind: {
    style: React.CSSProperties;
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const { initialX = 0, initialY = 0, boundaryPadding = 10, elementRef } = options;

  // 初始化位置状态
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: initialX, y: initialY });
  // 存储元素尺寸，避免重复获取
  const elementSizeRef = useRef({ width: 0, height: 0 });

  // 通用位置校准函数：确保元素完全在视口内
  const calibratePosition = useCallback((x: number, y: number) => {
    let elementWidth = 0;
    let elementHeight = 0;

    // 获取元素实际尺寸
    if (elementRef?.current) {
      const rect = elementRef.current.getBoundingClientRect();
      elementWidth = rect.width;
      elementHeight = rect.height;
    } else {
      // 无elementRef时，使用缓存的尺寸（拖拽时从mousedown事件获取）
      elementWidth = elementSizeRef.current.width;
      elementHeight = elementSizeRef.current.height;
    }

    // 核心修正：边界计算要确保元素完全在视口内
    // 最小x/y：不能小于boundaryPadding（留边距）
    // 最大x：视口宽度 - 元素宽度 - boundaryPadding（右边缘不超出）
    // 最大y：视口高度 - 元素高度 - boundaryPadding（下边缘不超出）
    const minX = boundaryPadding;
    const minY = boundaryPadding;
    const maxX = window.innerWidth - elementWidth - boundaryPadding;
    const maxY = window.innerHeight - elementHeight - boundaryPadding;

    // 确保x/y在合法范围内
    const newX = Math.max(minX, Math.min(x, maxX));
    const newY = Math.max(minY, Math.min(y, maxY));

    return { x: newX, y: newY };
  }, [boundaryPadding, elementRef]);

  // 初始化位置校准
  useEffect(() => {
    const { x: safeX, y: safeY } = calibratePosition(initialX, initialY);
    setPosition({ x: safeX, y: safeY });
    positionRef.current = { x: safeX, y: safeY };
  }, [initialX, initialY, calibratePosition]);

  const animationFrameRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetElement = e.currentTarget as HTMLElement;
    // 缓存元素尺寸（解决无elementRef时无法获取尺寸的问题）
    const rect = targetElement.getBoundingClientRect();
    elementSizeRef.current = { width: rect.width, height: rect.height };

    isDraggingRef.current = true;
    setIsDragging(true);

    // 计算鼠标在元素内的偏移（鼠标位置 - 元素左/上边缘）
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        // 计算元素新的左/上边缘位置
        const newX = moveEvent.clientX - offsetRef.current.x;
        const newY = moveEvent.clientY - offsetRef.current.y;

        // 校准位置，确保完全在视口内
        const calibratedPos = calibratePosition(newX, newY);
        positionRef.current = calibratedPos;
        setPosition(calibratedPos);
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);

      // 拖拽结束再次校准，确保最终位置合法
      const finalPos = calibratePosition(positionRef.current.x, positionRef.current.y);
      positionRef.current = finalPos;
      setPosition(finalPos);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [calibratePosition]);

  useEffect(() => {
    const handleResize = () => {
      // 窗口缩放后重新校准位置
      const calibratedPos = calibratePosition(positionRef.current.x, positionRef.current.y);
      setPosition(calibratedPos);
      positionRef.current = calibratedPos;
    };

    const debounceResize = debounce(handleResize, 100);
    window.addEventListener('resize', debounceResize);
    return () => window.removeEventListener('resize', debounceResize);
  }, [calibratePosition]);

  const bind = {
    style: {
      position: 'fixed' as const,
      left: position.x,
      top: position.y,
      cursor: isDragging ? 'grabbing' : 'grab',
      // 防止元素溢出时出现滚动条
      boxSizing: 'border-box' as const,
    },
    onMouseDown: handleMouseDown,
  };

  return {
    position,
    isDragging,
    bind,
  };
}