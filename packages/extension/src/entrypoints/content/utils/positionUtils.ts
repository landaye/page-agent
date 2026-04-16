
// 定义支持的方位类型
type PopoverPosition =
    | 'top' | 'topLeft' | 'topRight'
    | 'left' | 'leftTop' | 'leftBottom'
    | 'right' | 'rightTop' | 'rightBottom'
    | 'bottom' | 'bottomLeft' | 'bottomRight';

/**
 * 根据鼠标坐标计算Popover最优显示方位
 * @param x 鼠标点击的x坐标
 * @param y 鼠标点击的y坐标
 * @param safeMargin 安全边距（避免popover贴边）
 * @returns 最优方位
 */
export const calculateBestPopoverPosition = (
    x: number,
    y: number,
    safeMargin: number = 200
): PopoverPosition => {
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 计算鼠标在视口中的位置比例
    const isNearLeft = x < safeMargin;          // 靠近左边缘
    const isNearRight = x > viewportWidth - safeMargin; // 靠近右边缘
    const isNearTop = y < safeMargin;           // 靠近上边缘
    const isNearBottom = y > viewportHeight - safeMargin; // 靠近下边缘

    // 核心逻辑：优先保证Popover在视口内显示
    if (isNearLeft) {
        // 鼠标在左侧，优先向右显示
        if (isNearTop) {
            return 'rightBottom'; // 左上 → 右下显示
        } else if (isNearBottom) {
            return 'rightTop';    // 左下 → 右上显示
        } else {
            return 'right';       // 中间左侧 → 正右显示
        }
    } else if (isNearRight) {
        // 鼠标在右侧，优先向左显示
        if (isNearTop) {
            return 'leftBottom';  // 右上 → 左下显示
        } else if (isNearBottom) {
            return 'leftTop';     // 右下 → 左上显示
        } else {
            return 'left';        // 中间右侧 → 正左显示
        }
    } else if (isNearTop) {
        // 鼠标在上侧（左右居中），优先向下显示
        return 'bottom';        // 上中 → 正下显示
    } else if (isNearBottom) {
        // 鼠标在下侧（左右居中），优先向上显示
        return 'top';           // 下中 → 正上显示
    } else {
        // 鼠标在视口中间，默认向下左显示（你可以自定义默认值）
        return 'bottomLeft';
    }
};