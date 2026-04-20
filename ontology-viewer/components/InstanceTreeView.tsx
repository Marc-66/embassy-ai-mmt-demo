'use client';

import { useState } from 'react';
import { OntologyNode } from '@/types/ontology';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedText } from '@/lib/localizedText';

interface InstanceTreeViewProps {
  instances: OntologyNode[];
  onNodeSelect: (node: OntologyNode) => void;
}

interface TreeNode {
  instance: OntologyNode;
  children: TreeNode[];
}

const WORK_NAMESPACE = 'http://juri.be/ontology/work#';
const CORE_NAMESPACE = 'http://juri.be/ontology/core#';

export default function InstanceTreeView({ instances, onNodeSelect }: InstanceTreeViewProps) {
  const { language } = useLanguage();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchy based on actual parent-child relationships
  const buildHierarchy = (): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const childIds = new Set<string>();
    
    // Create tree nodes for all instances
    instances.forEach(instance => {
      nodeMap.set(instance.id, {
        instance,
        children: []
      });
    });
    
    console.log('Building hierarchy for', instances.length, 'instances');
    
    // Build parent-child relationships
    instances.forEach(instance => {
      const treeNode = nodeMap.get(instance.id)!;
      const props = instance.metadata.properties || {};
      
      // Check for hasTaskStep property (Task -> TaskStep)
      // Try multiple possible property keys
      const hasTaskStepKey = Object.keys(props).find(key => 
        key.endsWith('hasTaskStep') || key === WORK_NAMESPACE + 'hasTaskStep'
      );
      
      if (hasTaskStepKey) {
        console.log('Found hasTaskStep in', instance.label, ':', props[hasTaskStepKey]);
      }
      
      const taskSteps = hasTaskStepKey ? props[hasTaskStepKey] : null;
      if (taskSteps) {
        const stepIds = Array.isArray(taskSteps) ? taskSteps : [taskSteps];
        console.log('Processing', stepIds.length, 'steps for', instance.label);
        stepIds.forEach(stepId => {
          const childNode = nodeMap.get(stepId);
          if (childNode) {
            treeNode.children.push(childNode);
            childIds.add(stepId);
            console.log('  Added child:', childNode.instance.label);
          } else {
            console.log('  Child not found:', stepId);
          }
        });
      }
    });
    
    // Group remaining root nodes by type
    const rootsByType = new Map<string, TreeNode[]>();
    nodeMap.forEach((node, id) => {
      if (!childIds.has(id)) {
        const type = node.instance.metadata.instanceOf || 'Unknown';
        if (!rootsByType.has(type)) {
          rootsByType.set(type, []);
        }
        rootsByType.get(type)!.push(node);
      }
    });
    
    // Sort types by construction hierarchy
    const typeOrder = [
      CORE_NAMESPACE + 'ConstructionProject',
      WORK_NAMESPACE + 'WorkPackage',
      WORK_NAMESPACE + 'Task',
      WORK_NAMESPACE + 'WorkItem',
      'http://juri.be/ontology/roles#MainContractor',
      'http://juri.be/ontology/roles#Subcontractor',
      'http://www.w3.org/ns/org#Organization'
    ];
    
    const sortedRoots: TreeNode[] = [];
    typeOrder.forEach(type => {
      if (rootsByType.has(type)) {
        sortedRoots.push(...rootsByType.get(type)!);
        rootsByType.delete(type);
      }
    });
    
    // Add any remaining types
    rootsByType.forEach(nodes => sortedRoots.push(...nodes));
    
    return sortedRoots;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderProperty = (key: string, value: any) => {
    const propName = key.split('#').pop() || key.split('/').pop() || key;
    
    // Temporarily show all properties for debugging
    // if (propName === 'hasTaskStep') return null;
    
    return (
      <div key={key} className="text-xs py-1">
        <span className="text-gray-400">{propName}:</span>{' '}
        {Array.isArray(value) ? (
          <span className="text-gray-300">
            {value.map((v, i) => (
              <span key={i}>
                {typeof v === 'string' && v.startsWith('http') 
                  ? v.split('#').pop() || v.split('/').pop() 
                  : String(v)}
                {i < value.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-gray-300">
            {typeof value === 'string' && value.startsWith('http')
              ? value.split('#').pop() || value.split('/').pop()
              : String(value)}
          </span>
        )}
      </div>
    );
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.instance.id);
    const hasChildren = node.children.length > 0;
    const hasProperties = node.instance.metadata.properties && 
                         Object.keys(node.instance.metadata.properties).length > 0;
    const indent = level * 20;

    const typeName = node.instance.metadata.instanceOf?.split('#').pop() || 
                     node.instance.metadata.instanceOf?.split('/').pop() || 
                     'Instance';

    return (
      <div key={node.instance.id} style={{ marginLeft: `${indent}px` }}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-700 rounded cursor-pointer group"
          onClick={() => {
            if (hasChildren || hasProperties) toggleNode(node.instance.id);
            onNodeSelect(node.instance);
          }}
        >
          {(hasChildren || hasProperties) && (
            <span className="text-gray-400 w-4">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && !hasProperties && <span className="w-4"></span>}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-mono">
                {typeName}
              </span>
              <span className="text-gray-200 font-medium">
                {getLocalizedText(node.instance.label, language)}
              </span>
              {hasChildren && (
                <span className="text-xs text-gray-500">({node.children.length})</span>
              )}
            </div>
            
            {node.instance.metadata.comment && (
              <div className="text-xs text-gray-400 mt-1">
                {getLocalizedText(node.instance.metadata.comment, language)}
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div>
            {hasChildren && (
              <div className="mt-1">
                {node.children.map(child => renderTreeNode(child, level + 1))}
              </div>
            )}
            
            {hasProperties && (
              <div className="ml-8 mt-1 mb-2 p-3 bg-gray-900/50 rounded border border-gray-700">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Properties</div>
                {Object.entries(node.instance.metadata.properties!).map(([key, value]) => 
                  renderProperty(key, value)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy();

  if (instances.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700 text-center">
        <div className="text-gray-400">
          No instances found. Load a file with instance data (like example-project.ttl)
        </div>
      </div>
    );
  }

  // Debug info
  const tasksWithSteps = instances.filter(i => {
    const props = i.metadata.properties || {};
    return Object.keys(props).some(k => k.includes('hasTaskStep'));
  });
  const nodesWithChildren = hierarchy.filter(n => n.children.length > 0);

  return (
    <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 h-full overflow-y-auto">
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-3 z-10">
        <h3 className="text-lg font-semibold text-gray-100">
          Instance Data ({instances.length} instances)
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Roots: {hierarchy.length} | With children: {nodesWithChildren.length} | Tasks with hasTaskStep: {tasksWithSteps.length}
        </p>
      </div>
      
      <div className="p-4 space-y-1">
        {hierarchy.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
}
