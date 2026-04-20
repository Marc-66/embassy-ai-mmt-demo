'use client';

import { useState, useRef } from 'react';
import OntologySelector from '@/components/OntologySelector';
import OntologyGraph from '@/components/OntologyGraph';
import NodeDetails from '@/components/NodeDetails';
import SearchFilter from '@/components/SearchFilter';
import { useOntologyLoader } from '@/hooks/useOntologyLoader';
import { OntologyNode } from '@/types/ontology';

export default function Home() {
  const { files, graph, loading, error, toggleFile, selectAll, deselectAll } = useOntologyLoader();
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const handleNodeFound = (node: OntologyNode | null) => {
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-full mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-100">Ontology Viewer</h1>
          <p className="text-sm text-gray-400 mt-1">Visualize and explore ontology relationships</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-6 py-6">
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - File Selector & Search */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            <OntologySelector
              files={files}
              onToggle={toggleFile}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              loading={loading}
            />
            <SearchFilter 
              nodes={graph.nodes}
              onNodeFound={handleNodeFound}
            />
          </div>

          {/* Center Panel - Graph */}
          <div className="col-span-6" ref={graphRef}>
            <OntologyGraph 
              data={graph} 
              onNodeSelect={setSelectedNode}
            />
          </div>

          {/* Right Panel - Node Details */}
          <div className="col-span-3">
            <NodeDetails node={selectedNode} />
          </div>
        </div>
      </main>
    </div>
  );
}
