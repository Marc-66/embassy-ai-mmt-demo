import { Language } from '@/contexts/LanguageContext';

export const translations = {
  en: {
    // Header
    appTitle: 'Ontology Viewer',
    appSubtitle: 'Visualize and explore ontology relationships',
    
    // Ontology Selector
    ontologyFiles: 'Ontology Files',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    selected: 'selected',
    of: 'of',
    
    // General
    loading: 'Loading...',
    
    // Search & Filter
    searchFilter: 'Search & Filter',
    filterByType: 'Filter by Type',
    allTypes: 'All Types',
    classes: 'Classes',
    objectProperties: 'Object Properties',
    dataProperties: 'Data Properties',
    searchPlaceholder: 'Search by name, URI, or description...',
    results: 'results',
    
    // Node Details
    selectNode: 'Select a node to view details',
    type: 'Type',
    uri: 'URI',
    sourceFile: 'Source File',
    comment: 'Comment',
    definition: 'Definition',
    subclassOf: 'Subclass Of',
    domain: 'Domain',
    range: 'Range',
    alternativeLabels: 'Alternative Labels',
    examples: 'Examples',
    dataPropertiesTitle: 'Data Properties',
    
    // Node Types
    'owl:Class': 'Class',
    'owl:ObjectProperty': 'Object Property',
    'owl:DatatypeProperty': 'Data Property',
  },
  nl: {
    // Header
    appTitle: 'Ontologie Viewer',
    appSubtitle: 'Visualiseer en verken ontologie relaties',
    
    // Ontology Selector
    ontologyFiles: 'Ontologie Bestanden',
    selectAll: 'Alles Selecteren',
    clearAll: 'Alles Wissen',
    selected: 'geselecteerd',
    of: 'van',
    
    // General
    loading: 'Laden...',
    
    // Search & Filter
    searchFilter: 'Zoeken & Filteren',
    filterByType: 'Filter op Type',
    allTypes: 'Alle Types',
    classes: 'Klassen',
    objectProperties: 'Object Eigenschappen',
    dataProperties: 'Data Eigenschappen',
    searchPlaceholder: 'Zoeken op naam, URI of beschrijving...',
    results: 'resultaten',
    
    // Node Details
    selectNode: 'Selecteer een node om details te bekijken',
    type: 'Type',
    uri: 'URI',
    sourceFile: 'Bronbestand',
    comment: 'Opmerking',
    definition: 'Definitie',
    subclassOf: 'Subklasse Van',
    domain: 'Domein',
    range: 'Bereik',
    alternativeLabels: 'Alternatieve Labels',
    examples: 'Voorbeelden',
    dataPropertiesTitle: 'Data Eigenschappen',
    
    // Node Types
    'owl:Class': 'Klasse',
    'owl:ObjectProperty': 'Object Eigenschap',
    'owl:DatatypeProperty': 'Data Eigenschap',
  }
};

export function t(key: keyof typeof translations.en, language: Language): string {
  return translations[language][key] || translations.en[key] || key;
}
