/**
 * 存储键管理文件
 * 重点：区分「全局共享键」和「标签页隔离键」，标签页隔离键自动拼接域名前缀
 * 优化：支持传入 runtime.onMessage 的 sender 参数，优先从 sender 获取标签页域名（最可靠）
 */

// 新增：添加 chrome 类型声明，解决找不到名称的问题
declare global {
  interface Window {
    chrome?: {
      tabs?: {
        query: (
          queryInfo: { active: boolean; currentWindow: boolean },
          callback: (tabs: chrome.tabs.Tab[]) => void
        ) => void;
      };
      storage?: {
        [key in StorageScope]: {
          get: (keys?: string | string[] | null, callback?: (items: { [key: string]: any }) => void) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
          clear: (callback?: () => void) => void;
        };
      };
      runtime?: {
        MessageSender: {
          tab?: chrome.tabs.Tab;
          url?: string;
        };
      };
    };
  }

  // 补充 chrome.tabs.Tab 和 runtime.MessageSender 类型定义
  namespace chrome.tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
    }
  }

  namespace chrome.runtime {
    interface MessageSender {
      tab?: chrome.tabs.Tab;
      url?: string;
      frameId?: number;
      id?: string;
    }
  }
}

// 基础类型定义
type StorageScope = 'local' | 'session' | 'sync' | 'managed';
type StorageKey = `${StorageScope}:${string}`;
// 新增：定义 sender 类型
type MessageSender = chrome.runtime.MessageSender | undefined;

/**
 * 从 sender 中获取可靠的标签页域名（核心优化：优先用这个）
 * @param sender - runtime.onMessage 的 sender 参数
 * @returns 处理后的域名（无 www 前缀，小数点替换为冒号）
 */
function getDomainFromSender(sender: MessageSender): string {
  try {
    // 校验 sender 和 tab 合法性
    if (!sender || !sender.tab || !sender.tab.url) {
      return '';
    }

    // 过滤无效协议的 URL（chrome://、about: 等）
    const invalidProtocols = ['chrome:', 'about:', 'edge:', 'moz-extension:'];
    if (invalidProtocols.some(p => sender?.tab?.url?.startsWith(p))) {
      return '';
    }

    // 解析并处理域名
    let hostname = new URL(sender.tab.url).hostname;
    hostname = hostname.replace(/^www\./i, ''); // 移除 www 前缀
    hostname = hostname.replace(/\./g, ':'); // 小数点替换为冒号
    return hostname;
  } catch (e) {
    console.error('从 sender 获取域名失败:', e);
    return '';
  }
}

/**
 * 安全获取当前上下文的域名（异步）
 * @param sender - 可选，runtime.onMessage 的 sender 参数（优先使用）
 * - 优先级1：sender → 优先级2：页面/内容脚本 → 优先级3：Background/Popup 主动查询 → 兜底：空字符串
 */
export async function getContextHost(sender?: MessageSender, hostname?: string): Promise<string> {
  // 1. 最高优先级：从 sender 获取（Background 接收消息时）
  const senderDomain = getDomainFromSender(sender);
  if (senderDomain) {
    console.log('从 sender 获取 hostname:', senderDomain);
    return senderDomain;
  }
  if (hostname) {
    console.log('从参数获取 hostname:', hostname);
    return hostname;
  }
  // 2. 页面/内容脚本上下文（同步）
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      let hostname = window.location.hostname;
      hostname = hostname.replace(/^www\./i, '');
      hostname = hostname.replace(/\./g, ':');
      return hostname;
    }
  } catch (e) {
    console.debug('获取window域名失败:', e);
  }

  // 3. 降级：Background/Popup 上下文（异步获取活跃标签页）
  try {
    if (typeof window !== 'undefined' && window.chrome && window.chrome.tabs) {
      const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        window.chrome?.tabs?.query({ active: true, currentWindow: true }, resolve);
      });
      if (tabs[0]?.url) {
        let hostname = new URL(tabs[0].url).hostname;
        hostname = hostname.replace(/^www\./i, '');
        hostname = hostname.replace(/\./g, ':');
        return hostname;
      }
    }
  } catch (e) {
    console.debug('获取活跃标签页域名失败:', e);
  }

  // 4. 最终兜底（空字符串）
  return '';
}

/**
 * 生成带域名前缀的标签页隔离存储键
 * @param baseKey 基础键名（如 fullResultList）
 * @param scope 存储作用域（默认 local）
 * @param sender 可选，runtime.onMessage 的 sender 参数（优先从这里获取域名）
 * @returns 带域名前缀的存储键
 */
async function generateTabIsolatedKey(
  baseKey: string,
  scope: StorageScope = 'local',
  sender?: MessageSender, // 新增：支持传入 sender
  hostname?: string // 新增：支持传入 hostname
): Promise<StorageKey> {
  // 优先从 sender 获取域名，无则走原有逻辑
  const host = await getContextHost(sender, hostname);
  if (!host) {
    console.warn('无法获取当前标签页域名，使用默认键（可能跨标签页共享）');
    return `${scope}:${baseKey}` as StorageKey;
  }
  //console.log(`生成标签页隔离键: ${scope}:${baseKey}:${host}`);

  return `${scope}:${baseKey}:${host}` as StorageKey;
}

// =============================
// 1. 全局共享存储键（跨标签页共享，无域名前缀）
// =============================
export const GLOBAL_STORAGE_KEYS = {
  /** 用户设置（全局） */
  USER_SETTINGS: 'local:userSettings' as StorageKey,

  /** 当前会话 ID（全局） */
  SESSION_ID: 'local:sessionId' as StorageKey,

  /** 用户数据（全局） */
  USER_DATA: 'local:userData' as StorageKey,

  /** AI 模型列表（全局） */
  MODELS: 'local:models' as StorageKey,
  /** 知识库列表（全局） */
  KNOWLEDGE_BASSES: 'local:knowledgeBases' as StorageKey,

  /** 用户信息（全局） */
  USER_INFO: 'local:userInfo' as StorageKey,

  /** 用户数据令牌（全局） */
  USER_DATA_TOKEN: 'local:userData:token' as StorageKey,

  /** AI API 密钥（全局） */
  AI_API_KEY: 'local:aiApiKey' as StorageKey,

  /** 用户自定义模型配置（全局） */
  USER_MODELS: 'local:userModels' as StorageKey,

  // 动态键生成器（全局）
  getSessionKey: (sessionId: string): StorageKey => {
    return `session:${sessionId}` as StorageKey;
  }
};

// =============================
// 2. 标签页隔离存储键（支持传入 sender，按域名区分）
// =============================
export const TAB_ISOLATED_STORAGE_KEYS = {
  /** 上次发送消息的时间戳（标签页隔离） */
  LAST_SEND_TIME: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('lastSendTime', 'local', sender, hostname),

  /** AI 回答结果列表（核心：标签页隔离） */
  FULL_RESULT_LIST: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('fullResultList', 'local', sender, hostname),

  /** AI 回答结果列表计数（标签页隔离） */
  FULL_RESULT_LIST_COUNTER: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('fullResultList:counter', 'local', sender, hostname),

  /** 拖拽模态框是否固定（标签页隔离） */
  DRAG_MODAL_FIXED: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('dragModalFixed', 'local', sender, hostname),

  /** 当前显示的结果索引（标签页隔离） */
  FULL_RESULT_LIST_INDEX: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('fullResultList:Index', 'local', sender, hostname),

  /** 当前显示结果的详细数据（标签页隔离） */
  FULL_RESULT_LIST_INDEX_DATA: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('fullResultList:IndexData', 'local', sender, hostname),

  /** 用户当前选中的文本（标签页隔离） */
  SELECTED_TEXT: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('selectedText', 'local', sender, hostname),

  /** 当前选中的知识库（标签页隔离） */
  SELECTED_KB: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('selectedKb', 'local', sender, hostname),

  /** 当前选中的 AI 模型（标签页隔离） */
  SELECTED_MODEL: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('selectedModel', 'local', sender, hostname),

  // 新增：是否加载中状态（标签页隔离）
  IS_LOADING: async (sender?: MessageSender, hostname?: string) => await generateTabIsolatedKey('isLoading', 'local', sender, hostname),

};

// 统一导出（方便外部使用）
export const STORAGE_KEYS = {
  // 全局键
  ...GLOBAL_STORAGE_KEYS,
  // 标签页隔离键（支持传入 sender 参数）
  tabIsolated: TAB_ISOLATED_STORAGE_KEYS
};

// 类型导出
export type { StorageKey, StorageScope, MessageSender };