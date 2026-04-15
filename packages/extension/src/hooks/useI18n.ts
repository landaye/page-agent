import { I18n, SupportedLanguage } from '@page-agent/ui'
import { useMemo } from 'react'

/**
 * Custom hook to get the i18n instance based on the current language
 */
export function useI18n(language: SupportedLanguage = 'en-US') {
	return useMemo(() => new I18n(language), [language])
}
