
// 发送AI回答函数
export const fetchAiResponse = (async (newText?: any, prompt?: string) => {
    try {
        if (!newText) {
            return;
        }
        //获取newText的类型
        const newTextType = typeof newText;
        // 若newText不是字符串类型，直接透传；否则按标准格式封装
        const requestBody = newTextType !== 'string'
            ? newText
            : {
                prompt: prompt || '',
                attachments: [],
                inputContents: [{ text: newText, type: 'text' }],
                references: [],
                setup: { model: '千问plus' }
            };
        console.log('requestBody', requestBody);
        const browser = (window as any).browser || (window as any).chrome;
        // 发送AI请求开始消息，通知Markdown组件开始加载
        document.dispatchEvent(new CustomEvent('ai-request-start', { detail: { action: 'AI_REQUEST_START' } }));
        console.log('发送CopyEvent消息', requestBody);
        // 发送CopyEvent消息到Background脚本
        await browser.runtime.sendMessage({ action: "CopyEvent", text: requestBody });
    } catch (err) {
        console.error('获取AI回答失败:', err);
        document.dispatchEvent(new CustomEvent('ai-request-end', { detail: { action: 'AI_REQUEST_END' } }));
    }
});