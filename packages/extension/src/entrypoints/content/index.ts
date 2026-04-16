import App from '@/entrypoints/content/App';
import ReactDOM from 'react-dom/client';
import { ContentScriptContext, createShadowRootUi, injectScript } from "#imports";
import React from 'react';
import appStyles from './App.module.css?inline';
import ModalStyles from './page/modal/index.module.css?inline';
import watchCopy from '@/entrypoints/content/watchCopy';
import { initPageController } from '@/agent/RemotePageController.content';
// 之前的 initReactPage 函数
export async function initReactPage(ctx: ContentScriptContext) {
  console.log('initReactPage');
  const combinedStyles = `${appStyles}${ModalStyles}`;
  const ui = await createShadowRootUi(ctx, {
    name: "wxt-react-page",
    position: "overlay",
    anchor: "body",
    append: "first",
    onMount: (container) => {
      const style = document.createElement('style');
      style.textContent = combinedStyles;
      container.append(style);
      const wrapper = document.createElement("div");
      // 为了方便调试，给 wrapper 元素添加一个 id
      wrapper.id = 'wxt-react-page-wrapper';
      // 为了方便调试，给 wrapper 元素添加一个 class
      wrapper.classList.add('wxt-react-page-wrapper');
      container.append(wrapper);
      const root = ReactDOM.createRoot(wrapper);
      root.render(React.createElement(App));
      return { root, wrapper, style };
    },
    onRemove: (elements) => {
      elements?.root.unmount();
      elements?.wrapper.remove();
      elements?.style.remove();
    },
  });
  ui.mount();
  // 监听复制事件
  watchCopy();
}

const DEBUG_PREFIX = '[Content]';

// 现在的内容：从 content.ts 融合过来
export default defineContentScript({
	matches: ['<all_urls>'],
	runAt: 'document_end',

	main(ctx) {
		console.debug(`${DEBUG_PREFIX} Loaded on ${window.location.href}`);
		//导入页面
		initReactPage(ctx);
		initPageController();

		// if auth token matches, expose agent to page
		chrome.storage.local.get('PageAgentExtUserAuthToken').then((result) => {
			// extension side token.
			// @note this is isolated world. it is safe to assume user script cannot access it
			const extToken = result.PageAgentExtUserAuthToken;
			if (!extToken) return;

			// page side token
			const pageToken = localStorage.getItem('PageAgentExtUserAuthToken');
			if (!pageToken) return;

			if (pageToken !== extToken) return;

			console.log('[PageAgentExt]: Auth tokens match. Exposing agent to page.');

			// add isolated world script
			exposeAgentToPage().then(
				// add main-world script
				() => injectScript('/main-world.js')
			);
		});
	},
});

async function exposeAgentToPage() {
	const { MultiPageAgent } = await import('@/agent/MultiPageAgent');
	console.log('[PageAgentExt]: MultiPageAgent loaded');

	/**
	 * singleton MultiPageAgent to handle requests from the page
	 */
	let multiPageAgent: InstanceType<typeof MultiPageAgent> | null = null;

	window.addEventListener('message', async (e) => {
		if (e.source !== window) return;

		const data = e.data;
		if (typeof data !== 'object' || data === null) return;
		if (data.channel !== 'PAGE_AGENT_EXT_REQUEST') return;

		const { action, payload, id } = data;

		switch (action) {
			case 'execute': {
				// singleton check
				if (multiPageAgent && multiPageAgent.status === 'running') {
					window.postMessage(
						{
							channel: 'PAGE_AGENT_EXT_RESPONSE',
							id,
							action: 'execute_result',
							error: 'Agent is already running a task. Please wait until it finishes.',
						},
						'*'
					);
					return;
				}

				try {
					const { task, config } = payload;
					const { systemInstruction, ...agentConfig } = config;

					// Dispose old instance before creating new one
					multiPageAgent?.dispose();

					multiPageAgent = new MultiPageAgent({
						...agentConfig,
						instructions: systemInstruction ? { system: systemInstruction } : undefined,
					});

					// events

					multiPageAgent.addEventListener('statuschange', (event) => {
						if (!multiPageAgent) return;
						window.postMessage(
							{
								channel: 'PAGE_AGENT_EXT_RESPONSE',
								id,
								action: 'status_change_event',
								payload: multiPageAgent.status,
							},
							'*'
						);
					});

					multiPageAgent.addEventListener('activity', (event) => {
						if (!multiPageAgent) return;
						window.postMessage(
							{
								channel: 'PAGE_AGENT_EXT_RESPONSE',
								id,
								action: 'activity_event',
								payload: (event as CustomEvent).detail,
							},
							'*'
						);
					});

					multiPageAgent.addEventListener('historychange', (event) => {
						if (!multiPageAgent) return;
						window.postMessage(
							{
								channel: 'PAGE_AGENT_EXT_RESPONSE',
								id,
								action: 'history_change_event',
								payload: multiPageAgent.history,
							},
							'*'
						);
					});

					// result

					const result = await multiPageAgent.execute(task);

					window.postMessage(
						{
							channel: 'PAGE_AGENT_EXT_RESPONSE',
							id,
							action: 'execute_result',
							payload: result,
						},
						'*'
					);
				} catch (error) {
					window.postMessage(
						{
							channel: 'PAGE_AGENT_EXT_RESPONSE',
							id,
							action: 'execute_result',
							error: (error as Error).message,
						},
						'*'
					);
				}

				break;
			}

			case 'stop': {
				multiPageAgent?.stop();
				break;
			}

			default:
				console.warn(`${DEBUG_PREFIX} Unknown action from page:`, action);
				break;
		}
	});
}