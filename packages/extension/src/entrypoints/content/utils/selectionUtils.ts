// 获取选中文本的位置信息
export interface SelectionInfo {
    x: number;
    y: number;
    text: string;
    // 新增：区分是普通文本还是输入框文本（便于后续处理）
    type: 'normal' | 'input';
}

/**
 * 优化版：获取选中文本的精准位置（兼容所有场景，精度更高）
 */
export const getSelectionPosition = (): SelectionInfo | null => {
    // ========== 第一步：处理普通网页文本选中（核心优化） ==========
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (!text) return null;

        let x = 0;
        let y = 0;

        // 1. 优先获取选中范围的精准坐标（修复越界风险）
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // 获取选中区域的所有矩形（跨行选中时会有多个rect）
            const rects = range.getClientRects();
            if (rects.length > 0) {
                // 取第一个矩形（选中文本的起始位置）作为基准，更符合用户感知
                const firstRect = rects[0];
                // 优化：坐标取「选中区域左下角」（弹窗/菜单不会遮挡选中的文本）
                x = firstRect.left + firstRect.width / 2;
                y = firstRect.bottom;
            } else {
                // 备用：获取整个range的包围盒
                const boundingRect = range.getBoundingClientRect();
                x = boundingRect.left + boundingRect.width / 2;
                y = boundingRect.bottom;
            }
        }

        // 2. 兜底：通过锚点节点获取坐标（增加空值校验）
        if (x === 0 && y === 0 && selection.anchorNode?.parentElement) {
            const rect = selection.anchorNode.parentElement.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.bottom;
        }

        // 3. 转换为文档全局坐标（解决滚动偏移问题）
        const finalX = x + window.scrollX;
        const finalY = y + window.scrollY;

        if (finalX !== 0 || finalY !== 0) {
            return {
                x: finalX,
                y: finalY,
                text,
                type: 'normal'
            };
        }
    }

    // ========== 第二步：处理输入框/文本域选中（精准定位到字符） ==========
    const focusedElement = document.activeElement;
    if (
        (focusedElement instanceof HTMLInputElement || focusedElement instanceof HTMLTextAreaElement) &&
        focusedElement.selectionStart !== null &&
        focusedElement.selectionEnd !== null &&
        focusedElement.selectionStart !== focusedElement.selectionEnd
    ) {
        const input = focusedElement as (HTMLInputElement | HTMLTextAreaElement);
        const start = input.selectionStart!;
        const end = input.selectionEnd!;
        const text = input.value.substring(start, end).trim();
        if (!text) return null;

        // 核心优化：创建临时元素，精准计算选中字符的位置
        const getCaretPosition = (el: HTMLInputElement | HTMLTextAreaElement, position: number): { x: number; y: number } => {
            // 1. 克隆输入框样式，创建临时元素（避免影响页面布局）
            const tempEl = document.createElement('div');
            tempEl.style.position = 'absolute';
            tempEl.style.visibility = 'hidden';
            tempEl.style.whiteSpace = 'pre'; // 保留空格，保证宽度一致
            tempEl.style.font = window.getComputedStyle(el).font;
            tempEl.style.padding = window.getComputedStyle(el).padding;
            tempEl.style.border = window.getComputedStyle(el).border;
            tempEl.style.width = el.clientWidth + 'px';
            document.body.appendChild(tempEl);

            // 2. 截取到选中起始位置的文本，放入临时元素
            const preText = el.value.substring(0, position);
            tempEl.textContent = preText;

            // 3. 获取临时元素的宽度（即选中起始字符的x坐标）
            const rect = tempEl.getBoundingClientRect();
            const inputRect = el.getBoundingClientRect();
            // 计算选中字符的精准坐标
            const x = inputRect.left + tempEl.offsetWidth + 2; // +2 微调，避免紧贴边框
            const y = inputRect.top + inputRect.height + 2;

            // 4. 清理临时元素
            document.body.removeChild(tempEl);

            return {
                x: x + window.scrollX,
                y: y + window.scrollY
            };
        };

        // 获取选中起始位置的精准坐标
        const { x, y } = getCaretPosition(input, input.selectionStart!);

        return {
            x,
            y,
            text,
            type: 'input'
        };
    }

    return null;
};

