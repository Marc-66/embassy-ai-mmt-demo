'use client';

import { useState } from 'react';
import { OntologyNode } from '@/types/ontology';

interface SearchFilterProps {
  nodes: OntologyNode[];
  onNodeFound: (node: OntologyNode | null) => void;
}

export default function SearchFilter({ nodes, onNodeFound }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<OntologyNode[]>([]);
  const [showResults, setShowResults] = useState(false);

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

      // Search in label, URI, comment
      const searchLower = term.toLowerCase();
      return (
        node.label.toLowerCase().includes(searchLower) ||
        node.id.toLowerCase().includes(searchLower) ||
        node.metadata.comment?.toLowerCase().includes(searchLower) ||
        node.metadata.altLabels?.some(alt => alt.toLowerCase().includes(searchLower))
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
      <h2 className="text-lg font-semibold text-gray-100 mb-3">Search & Filter</h2>
      
      {/* Type Filter */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">
          Filter by Type
        </label>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            handleSearch(searchTerm);
          }}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="owl:Class">Classes</option>
          <option value="owl:ObjectProperty">Object Properties</option>
          <option value="owl:DatatypeProperty">Data Properties</option>
        </select>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, URI, or description..."
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
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </div>
          {searchResults.map((node) => (
            <div
              key={node.id}
              onClick={() => handleSelectNode(node)}
              className="px-3 py-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
            >
              <div className="font-semibold text-sm text-gray-100">{node.label}</div>
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
                  {node.metadata.comment}
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
