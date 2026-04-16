// flowerEffect.ts
import React from 'react';
import GoodIcon from '@/assets/icon/GoodIcon';
import ReactDOM from 'react-dom/client';

class FlowerEffect {
    // 实时保存鼠标坐标
    private mouseX: number = window.innerWidth / 2;
    private mouseY: number = window.innerHeight / 2;

    constructor() {
        this.initMouseTracker();
        // 提前注入样式，避免首次触发时的样式加载延迟
        this.injectAnimationStyle();
    }

    // 监听鼠标移动，跟踪实时坐标
    private initMouseTracker(): void {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    // 注入动画样式（仅执行一次）
    private injectAnimationStyle(): void {
        if (document.getElementById('custom-icon-animation')) return;

        const style = document.createElement('style');
        style.id = 'custom-icon-animation';
        style.textContent = `
      @keyframes custom-fall {
        0% {
          transform: rotate(0deg) translate(0, 0); /* 明确初始位置 */
          opacity: 0.9;
        }
        100% {
          transform: translate(var(--dx, 0px), var(--dy, 0px)) rotate(360deg);
          opacity: 0;
        }
      }
      
      /* 新增：预定义动画基础样式，避免运行时计算 */
      .flower-effect-element {
        will-change: transform, opacity; /* 告诉浏览器提前优化 */
        backface-visibility: hidden; /* 开启硬件加速 */
        transform: translateZ(0); /* 触发GPU渲染 */
      }
    `;
        document.head.appendChild(style);
    }

    // 创建自定义样式元素
    private createCustomIconElement(): HTMLDivElement {
        // 创建外层容器
        const wrapper = document.createElement('div');
        wrapper.classList.add('flower-effect-element'); // 添加优化类

        // 完全复制样式
        const customStyles = {
            background: 'var(--semi-color-ai-general)',
            color: 'var(--semi-color-white)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            lineHeight: '16px',
            border: 'none',
            fontSize: '8px',
            position: 'fixed',
            zIndex: '321456789',
            pointerEvents: 'none',
            opacity: '0.9',
            // 提前设置动画相关属性，避免样式重排
            animationFillMode: 'forwards',
            animationTimingFunction: 'cubic-bezier(0.2, 0, 0.1, 1)', // 轻快且顺滑的缓动
        };
        Object.assign(wrapper.style, customStyles);

        // 修复核心：同步渲染图标 + 兜底判断
        const iconElement = React.createElement(GoodIcon, {});
        const iconDom = this.renderReactElementToDom(iconElement);
        if (iconDom) {
            wrapper.appendChild(iconDom);
        } else {
            // 兜底：如果图标渲染失败，创建一个占位元素避免报错
            const fallbackIcon = document.createElement('span');
            fallbackIcon.textContent = '👍';
            fallbackIcon.style.color = 'white';
            fallbackIcon.style.fontSize = '8px';
            wrapper.appendChild(fallbackIcon);
        }

        return wrapper;
    }

    // 同步将React元素转为DOM节点
    private renderReactElementToDom(element: React.ReactElement): HTMLElement | null {
        try {
            const container = document.createElement('div');
            const root = ReactDOM.createRoot(container);
            root.render(element);
            return container.firstElementChild as HTMLElement | null;
        } catch (error) {
            console.warn('图标渲染失败:', error);
            return null;
        }
    }

    /**
     * 触发撒花：无需传坐标，自动用当前鼠标位置
     * @param count 显示数量（默认8个）
     */
    public triggerFlower(count: number = 8): void {
        const mouseX = this.mouseX;
        const mouseY = this.mouseY;

        // 随机选一个位置作为精准定位的图标（避免固定第一个，更自然）
        const exactPositionIndex = Math.floor(Math.random() * count);

        for (let i = 0; i < count; i++) {
            const customElement = this.createCustomIconElement();
            
            // 预估尺寸（实际尺寸差异很小，优先保证动画启动速度）
            const estimatedWidth = 16;
            const estimatedHeight = 16;
            
            let initOffsetX = 0;
            let initOffsetY = 0;

            // ========== 核心逻辑：只有指定索引的图标精准定位，其余在鼠标上方偏移 ==========
            if (i !== exactPositionIndex) {
                // 非精准图标：X轴左右偏移 -15 ~ 15px，Y轴上方偏移 -40 ~ -10px
                initOffsetX = Math.floor(Math.random() * 30) - 15;
                initOffsetY = -Math.floor(Math.random() * 30) - 10;
            }
            // 精准图标：offsetX和offsetY都为0，无偏移
            
            // 计算初始位置
            const startX = mouseX - estimatedWidth / 2 + initOffsetX;
            const startY = mouseY - estimatedHeight / 2 + initOffsetY;
            
            // 先设置定位再添加到DOM
            customElement.style.left = `${startX}px`;
            customElement.style.top = `${startY}px`;

            // 动画参数（保持慢速、平缓的效果）
            const dx = Math.floor(Math.random() * 100) - 50;
            const dy = Math.floor(Math.random() * 60) - 80;
            const duration = Math.random() * 0.8 + 1.2; // 1.2 ~ 2.0秒，慢速飘落
            const delay = Math.random() * 0.1; // 0 ~ 0.1秒，几乎无延迟

            // 应用动画
            customElement.style.animation = `custom-fall ${duration}s ${customElement.style.animationTimingFunction} ${delay}s`;
            customElement.style.setProperty('--dx', `${dx}px`);
            customElement.style.setProperty('--dy', `${dy}px`);

            // 先添加动画再加入DOM，避免首次渲染延迟
            document.body.appendChild(customElement);

            // 动画结束后移除
            const removeElement = () => {
                customElement.removeEventListener('animationend', removeElement);
                customElement.remove();
            };
            customElement.addEventListener('animationend', removeElement);

            // 兜底：防止动画事件未触发导致元素残留
            setTimeout(() => {
                if (document.body.contains(customElement)) {
                    customElement.remove();
                }
            }, (duration + delay) * 1000 + 100);
        }
    }
}

// 导出单例
export const flowerEffect = new FlowerEffect();