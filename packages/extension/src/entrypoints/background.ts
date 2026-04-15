import { handlePageControlMessage } from '@/agent/RemotePageController.background'
import { handleTabControlMessage, setupTabEventsPort } from '@/agent/TabsController.background'

export default defineBackground(() => {
	console.log('[Background] Service Worker started')

	// tab change events

	setupTabEventsPort()

	// generate user auth token

	chrome.storage.local.get('PageAgentExtUserAuthToken').then((result) => {
		if (result.PageAgentExtUserAuthToken) return

		const userAuthToken = crypto.randomUUID()
		chrome.storage.local.set({ PageAgentExtUserAuthToken: userAuthToken })
	})

	// message proxy

	chrome.runtime.onMessage.addListener((message, sender, sendResponse): true | undefined => {
		if (message.type === 'TAB_CONTROL') {
			return handleTabControlMessage(message, sender, sendResponse)
		} else if (message.type === 'PAGE_CONTROL') {
			return handlePageControlMessage(message, sender, sendResponse)
		} else if (message.type === 'OPEN_SIDEPANEL') {
			let tabId = sender.tab?.id
			let windowId = sender.tab?.windowId
			
			if (!tabId) {
				// If no tab ID (e.g., from popup), get the active tab
				chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
					if (tabs.length > 0) {
						tabId = tabs[0].id!
						windowId = tabs[0].windowId
						
						chrome.sidePanel.open({ tabId, windowId }).then(() => {
							sendResponse({ ok: true })
						}).catch((error) => {
							sendResponse({ error: error.message })
						})
					} else {
						sendResponse({ error: 'No active tab found' })
					}
				}).catch((error) => {
					sendResponse({ error: error.message })
				})
			} else {
				// If tab ID is available, use it
				chrome.sidePanel.open({ tabId, windowId }).then(() => {
					sendResponse({ ok: true })
				}).catch((error) => {
					sendResponse({ error: error.message })
				})
			}
			return true
		} else {
			sendResponse({ error: 'Unknown message type' })
			return
		}
	})

	// external messages (from localhost launcher page via externally_connectable)

	chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
		if (message.type === 'OPEN_HUB') {
			openOrFocusHubTab(message.wsPort).then(() => {
				if (sender.tab?.id) chrome.tabs.remove(sender.tab.id)
				sendResponse({ ok: true })
			})
			return true
		}
	})

	// setup

	// Ensure sidepanel doesn't open on action click
	chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {})  
})

async function openOrFocusHubTab(wsPort: number) {
	const hubUrl = chrome.runtime.getURL('hub.html')
	const existing = await chrome.tabs.query({ url: `${hubUrl}*` })

	if (existing.length > 0 && existing[0].id) {
		await chrome.tabs.update(existing[0].id, {
			active: true,
			url: `${hubUrl}?ws=${wsPort}`,
		})
		return
	}

	await chrome.tabs.create({ url: `${hubUrl}?ws=${wsPort}`, pinned: true })
}
