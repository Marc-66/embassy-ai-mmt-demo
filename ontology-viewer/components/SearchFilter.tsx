'use client';

import { useState } from 'react';
import { OntologyNode } from '@/types/ontology';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { getLocalizedText } from '@/lib/localizedText';

interface SearchFilterProps {
  nodes: OntologyNode[];
  onNodeFound: (node: OntologyNode | null) => void;
}

export default function SearchFilter({ nodes, onNodeFound }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<OntologyNode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { language } = useLanguage();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const filtered = nodes.filter(node => {
      // Filter by type
      if (filterType !== 'all' && node.nodeType !== filterType) {
        return false;
      }

      // Search in label, URI, comment (with language support)
      const searchLower = term.toLowerCase();
      const label = getLocalizedText(node.label, language).toLowerCase();
      const comment = getLocalizedText(node.metadata.comment, language).toLowerCase();
      
      return (
        label.includes(searchLower) ||
        node.id.toLowerCase().includes(searchLower) ||
        comment.includes(searchLower)
      );
    });

    setSearchResults(filtered);
    setShowResults(filtered.length > 0);
  };

  const handleSelectNode = (node: OntologyNode) => {
    onNodeFound(node);
    setShowResults(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4 border border-gray-700">
      <h2 className="text-lg font-semibold text-gray-100 mb-3">{t('searchFilter', language)}</h2>
      
      {/* Type Filter */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">
          {t('filterByType', language)}
        </label>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            handleSearch(searchTerm);
          }}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('allTypes', language)}</option>
          <option value="owl:Class">{t('classes', language)}</option>
          <option value="owl:ObjectProperty">{t('objectProperties', language)}</option>
          <option value="owl:DatatypeProperty">{t('dataProperties', language)}</option>
        </select>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('searchPlaceholder', language)}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
              setShowResults(false);
              onNodeFound(null);
            }}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="mt-2 max-h-64 overflow-y-auto border border-gray-600 rounded bg-gray-700">
          <div className="text-xs text-gray-400 px-3 py-2 bg-gray-800 border-b border-gray-600">
            {searchResults.length} {t('results', language)}
          </div>
          {searchResults.map((node) => (
            <div
              key={node.id}
              onClick={() => handleSelectNode(node)}
              className="px-3 py-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
            >
              <div className="font-semibold text-sm text-gray-100">
                {getLocalizedText(node.label, language)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  {node.nodeType.replace('owl:', '')}
                </span>
                <span className="text-xs text-gray-400 font-mono truncate">
                  {node.sourceFile}
                </span>
              </div>
              {node.metadata.comment && (
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {getLocalizedText(node.metadata.comment, language)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 text-xs text-gray-400">
        Total nodes: {nodes.length} | 
        Classes: {nodes.filter(n => n.nodeType === 'owl:Class').length} | 
        Properties: {nodes.filter(n => n.nodeType.includes('Property')).length}
      </div>
    </div>
  );
}
