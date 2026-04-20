'use client';

import { OntologyFile } from '@/types/ontology';
import { useMemo, useState } from 'react';

interface OntologySelectorProps {
  files: OntologyFile[];
  onToggle: (filename: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  loading: boolean;
}

export default function OntologySelector({ 
  files, 
  onToggle, 
  onSelectAll, 
  onDeselectAll,
  loading 
}: OntologySelectorProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['ontologies']));
  
  const selectedCount = files.filter(f => f.selected).length;
  
  // Group files by folder
  const filesByFolder = useMemo(() => {
    const groups = new Map<string, OntologyFile[]>();
    files.forEach(file => {
      const folder = file.folder || 'ontologies';
      if (!groups.has(folder)) {
        groups.set(folder, []);
      }
      groups.get(folder)!.push(file);
    });
    return groups;
  }, [files]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const selectFolder = (folder: string, selected: boolean) => {
    const folderFiles = filesByFolder.get(folder) || [];
    folderFiles.forEach(file => {
      if (file.selected !== selected) {
        onToggle(file.name);
      }
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Ontology Files</h2>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={loading}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            disabled={loading}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-2">
        {selectedCount} of {files.length} selected
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Array.from(filesByFolder.entries()).map(([folder, folderFiles]) => {
          const isExpanded = expandedFolders.has(folder);
          const folderSelectedCount = folderFiles.filter(f => f.selected).length;
          
          return (
            <div key={folder} className="border border-gray-700 rounded">
              <div className="flex items-center gap-2 p-2 bg-gray-750 hover:bg-gray-700 rounded-t">
                <button
                  onClick={() => toggleFolder(folder)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-200">
                      {folder === 'ontologies' ? '📁 Ontologies' : '📚 Reference Models'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({folderSelectedCount}/{folderFiles.length})
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => selectFolder(folder, true)}
                    disabled={loading}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    All
                  </button>
                  <button
                    onClick={() => selectFolder(folder, false)}
                    disabled={loading}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    None
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-2 space-y-1">
                  {folderFiles.map(file => (
                    <label
                      key={file.relativePath}
                      className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={file.selected}
                        onChange={() => onToggle(file.name)}
                        disabled={loading}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-mono text-gray-300 truncate" title={file.relativePath}>
                        {file.relativePath}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-3 text-sm text-blue-400 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          Loading ontologies...
        </div>
      )}
    </div>
  );
}
