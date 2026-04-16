import { storage } from '@wxt-dev/storage';
import { STORAGE_KEYS } from '@/utils/storageKeys';
// 引入自定义的防抖函数
import { debounce } from '@/entrypoints/content/utils/throttle';

export default function watchCopy() {
    // 存储当前选中的文本（用于快捷键触发时）
    let currentSelection = '';

    // 监听选中文本变化：实时更新选中的文本
    const handleSelectionChange = () => {
        console.log('监听--l选中文本变化:', currentSelection);
        if (window.getSelection) {
            const selection = window.getSelection();
            currentSelection = selection ? selection.toString().trim() : '';
        }
    };

    // 核心复制处理逻辑
    const handleCopyAction = async () => {
        try {

            // 多种方式获取复制文本，确保兼容性
            let text = '';

            // 方式1：从当前选中的文本获取（优先）
            if (currentSelection) {
                text = currentSelection;
                console.log("方式1(选中文本)获取的文本:", text);
            }

            // 方式2：从Selection API获取
            if (!text && window.getSelection) {
                const selection = window.getSelection();
                text = selection ? selection.toString().trim() : '';
                console.log("方式2(Selection)获取的文本:", text);
            }

            // 方式3：延迟从剪贴板获取（解决快捷键触发时数据未写入的问题）
            if (!text) {
                // 小延迟确保剪贴板数据已写入
                await new Promise(resolve => setTimeout(resolve, 50));
                try {
                    const clipboardText = await navigator.clipboard.readText();
                    text = clipboardText.trim();
                    console.log("方式3(剪贴板)获取的文本:", text);
                } catch (err) {
                    console.warn("读取剪贴板失败:", err);
                }
            }

            // 如果没有获取到文本，直接返回
            if (!text) {
                console.log("未获取到可复制的文本");
              
                return;
            }

            const settings = await storage.getMeta(STORAGE_KEYS.USER_SETTINGS);

            // 如果关闭了复制功能，直接返回
            if (settings?.copyAnswer === false) {
               
                return;
            }
            console.log("最终复制的文本:", text);

            // 发送AI回答
            // await fetchAiResponse(text);
           
        } catch (error) {
           
            console.error("复制处理失败:", error);
        }
    };

    // 直接使用 lodash 的防抖函数（300ms 防抖延迟）
    const debouncedHandleCopy = debounce(handleCopyAction, 100);

    // 处理原生copy事件
    const handleCopy = (e: ClipboardEvent) => {
        // e.preventDefault(); // 阻止默认行为，避免冲突
        debouncedHandleCopy();
    };

    // 处理快捷键触发
    const handleKeyDown = (e: KeyboardEvent) => {
        // 判断是否是复制快捷键：Ctrl+C 或 Cmd+C
        const isCopyShortcut = (e.ctrlKey || e.metaKey) && e.key === 'c';
        if (isCopyShortcut) {
            debouncedHandleCopy();
        }
    };

    // ========== 注册事件监听 ==========
    // 监听选中文本变化
    document.addEventListener('selectionchange', handleSelectionChange);
    // 监听原生copy事件
    document.addEventListener('copy', handleCopy);
    // 监听键盘快捷键
    document.addEventListener('keydown', handleKeyDown);

    // 初始化获取一次选中的文本
    handleSelectionChange();

    // ========== 返回解绑函数 ==========
    return () => {
        // 取消防抖函数的延迟执行（lodash 防抖函数的专属方法）
        debouncedHandleCopy.cancel();
        // 移除所有事件监听
        document.removeEventListener('selectionchange', handleSelectionChange);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('keydown', handleKeyDown);
        console.log("复制监听已移除");
    };
}