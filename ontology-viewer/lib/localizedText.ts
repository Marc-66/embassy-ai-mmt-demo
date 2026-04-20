import { LocalizedText } from '@/types/ontology';
import { Language } from '@/contexts/LanguageContext';

/**
 * Get localized text from a string or LocalizedText object
 */
export function getLocalizedText(
  text: string | LocalizedText | string[] | undefined,
  language: Language
): string {
  if (!text) return '';
  
  // If it's a simple string, return it
  if (typeof text === 'string') {
    return text;
  }
  
  // If it's an array, return the first item (backward compatibility)
  if (Array.isArray(text)) {
    return text[0] || '';
  }
  
  // If it's a LocalizedText object
  if (typeof text === 'object') {
    // Try to get the requested language
    if (text[language]) {
      return Array.isArray(text[language]) ? text[language][0] : text[language];
    }
    
    // Fallback to English
    if (text['en']) {
      return Array.isArray(text['en']) ? text['en'][0] : text['en'];
    }
    
    // Fallback to first available language
    const firstLang = Object.keys(text)[0];
    if (firstLang) {
      return Array.isArray(text[firstLang]) ? text[firstLang][0] : text[firstLang];
    }
  }
  
  return '';
}

/**
 * Get localized array from a string array or LocalizedText object
 */
export function getLocalizedArray(
  text: string[] | LocalizedText | undefined,
  language: Language
): string[] {
  if (!text) return [];
  
  // If it's a simple array, return it
  if (Array.isArray(text)) {
    return text;
  }
  
  // If it's a LocalizedText object
  if (typeof text === 'object') {
    // Try to get the requested language
    if (text[language]) {
      return Array.isArray(text[language]) ? text[language] : [text[language]];
    }
    
    // Fallback to English
    if (text['en']) {
      return Array.isArray(text['en']) ? text['en'] : [text['en']];
    }
    
    // Fallback to first available language
    const firstLang = Object.keys(text)[0];
    if (firstLang) {
      return Array.isArray(text[firstLang]) ? text[firstLang] : [text[firstLang]];
    }
  }
  
  return [];
}
