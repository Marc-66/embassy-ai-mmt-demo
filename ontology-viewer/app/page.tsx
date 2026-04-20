'use client';

import { useState, useRef, useMemo } from 'react';
import OntologySelector from '@/components/OntologySelector';
import OntologyGraph from '@/components/OntologyGraph';
import InstanceTreeView from '@/components/InstanceTreeView';
import GanttChart from '@/components/GanttChart';
import NodeDetails from '@/components/NodeDetails';
import SearchFilter from '@/components/SearchFilter';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useOntologyLoader } from '@/hooks/useOntologyLoader';
import { useInstanceLoader } from '@/hooks/useInstanceLoader';
import { OntologyNode, OntologyGraph as OntologyGraphType, OntologyEdge } from '@/types/ontology';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

type ViewMode = 'schema' | 'instances';

export default function Home() {
  const { files, graph, loading: schemaLoading, error, toggleFile, selectAll, deselectAll } = useOntologyLoader();
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('schema');
  const graphRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const t = translations[language];
  
  // Load instances from selected ontology files using relative paths
  const selectedFilePaths = files.filter(f => f.selected).map(f => f.relativePath);
  const { instances, loading: instanceLoading } = useInstanceLoader(selectedFilePaths);
  const instanceGraph = useMemo(() => buildInstanceGraph(instances), [instances]);
  
  const loading = viewMode === 'schema' ? schemaLoading : instanceLoading;

  const handleNodeFound = (node: OntologyNode | null) => {
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{t.appTitle}</h1>
              <p className="text-sm text-gray-400 mt-1">{t.appSubtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('schema')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    viewMode === 'schema'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {language === 'en' ? 'Schema' : 'Schema'}
                </button>
                <button
                  onClick={() => setViewMode('instances')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    viewMode === 'instances'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {language === 'en' ? 'Instances' : 'Instanties'}
                </button>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
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
          <div className="col-span-2 space-y-4 overflow-y-auto">
            <OntologySelector
              files={files}
              onToggle={toggleFile}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              loading={loading}
            />
            {viewMode === 'schema' && (
              <SearchFilter 
                nodes={graph.nodes}
                onNodeFound={handleNodeFound}
              />
            )}
          </div>

          {/* Center Panel - Graph or Tree */}
          <div className="col-span-7" ref={graphRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">{t.loading}</div>
              </div>
            ) : viewMode === 'schema' ? (
              <OntologyGraph 
                data={graph} 
                onNodeSelect={setSelectedNode}
              />
            ) : (
              <div className="h-full space-y-4">
                <div className="h-[75%] rounded-lg overflow-hidden border border-gray-700">
                  <OntologyGraph
                    data={instanceGraph}
                    onNodeSelect={setSelectedNode}
                  />
                </div>
                <div className="h-[25%] overflow-y-auto space-y-4">
                  <InstanceTreeView
                    instances={instances}
                    onNodeSelect={setSelectedNode}
                  />
                  <GanttChart instances={instances} />
                </div>
              </div>
            )}
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

function buildInstanceGraph(instances: OntologyNode[]): OntologyGraphType {
  const nodes: OntologyNode[] = instances.map(instance => ({
    ...instance,
    nodeType: instance.metadata.instanceOf || 'instance'
  }));

  const nodeMap = new Map<string, OntologyNode>(nodes.map(node => [node.id, node]));
  const edges: OntologyEdge[] = [];

  for (const instance of instances) {
    const typeUris = instance.metadata.instanceOf ? [instance.metadata.instanceOf] : [];
    for (const typeUri of typeUris) {
      if (!nodeMap.has(typeUri)) {
        const labelText = typeUri.split('#').pop() || typeUri.split('/').pop() || typeUri;
        const classNode: OntologyNode = {
          id: typeUri,
          label: labelText,
          type: 'class',
          nodeType: 'owl:Class',
          sourceFile: instance.sourceFile,
          metadata: {
            comment: undefined,
            instanceOf: undefined,
            properties: {}
          }
        };
        nodes.push(classNode);
        nodeMap.set(typeUri, classNode);
      }

      edges.push({
        source: instance.id,
        target: typeUri,
        type: 'instanceOf',
        label: 'instanceOf',
        sourceFile: instance.sourceFile
      });
    }

    const props = instance.metadata.properties || {};
    for (const [predicate, value] of Object.entries(props)) {
      const values = Array.isArray(value) ? value : [value];
      const label = predicate.split('#').pop() || predicate.split('/').pop() || predicate;

      for (const rawValue of values) {
        if (typeof rawValue === 'string' && rawValue.startsWith('http')) {
          const targetId = rawValue;
          if (!nodeMap.has(targetId)) {
            const labelText = targetId.split('#').pop() || targetId.split('/').pop() || targetId;
            const stubNode: OntologyNode = {
              id: targetId,
              label: labelText,
              type: 'instance',
              nodeType: 'instance',
              sourceFile: instance.sourceFile,
              metadata: {
                instanceOf: 'unknown',
                properties: {}
              }
            };
            nodes.push(stubNode);
            nodeMap.set(targetId, stubNode);
          }

          edges.push({
            source: instance.id,
            target: targetId,
            type: 'objectProperty',
            label,
            sourceFile: instance.sourceFile
          });
        } else {
          const literalId = `literal:${predicate}:${String(rawValue)}`;
          if (!nodeMap.has(literalId)) {
            const literalNode: OntologyNode = {
              id: literalId,
              label: String(rawValue),
              type: 'literal',
              nodeType: 'literal',
              sourceFile: instance.sourceFile,
              metadata: {
                comment: undefined,
                instanceOf: undefined,
                properties: {}
              }
            };
            nodes.push(literalNode);
            nodeMap.set(literalId, literalNode);
          }

          edges.push({
            source: instance.id,
            target: literalId,
            type: 'dataProperty',
            label,
            sourceFile: instance.sourceFile
          });
        }
      }
    }
  }

  return {
    nodes,
    edges,
    files: Array.from(new Set(instances.map(instance => instance.sourceFile)))
  };
}
