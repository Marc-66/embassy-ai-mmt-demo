'use client';

import { OntologyNode } from '@/types/ontology';

interface NodeDetailsProps {
  node: OntologyNode | null;
}

export default function NodeDetails({ node }: NodeDetailsProps) {
  if (!node) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
        <div className="text-gray-400 text-center">
          Select a node to view details
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto max-h-full border border-gray-700">
      <h2 className="text-xl font-bold text-gray-100 mb-3">{node.label}</h2>
      
      <div className="space-y-3">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Type</span>
          <div className="mt-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded inline-block text-sm">
            {node.nodeType}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">URI</span>
          <div className="mt-1 text-sm text-gray-300 font-mono break-all">{node.id}</div>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Source File</span>
          <div className="mt-1 text-sm text-gray-300 font-mono">{node.sourceFile}</div>
        </div>

        {node.metadata.comment && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Comment</span>
            <div className="mt-1 text-sm text-gray-300">{node.metadata.comment}</div>
          </div>
        )}

        {node.metadata.definition && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Definition</span>
            <div className="mt-1 text-sm text-gray-300">{node.metadata.definition}</div>
          </div>
        )}

        {node.metadata.subClassOf && node.metadata.subClassOf.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Subclass Of</span>
            <ul className="mt-1 space-y-1">
              {node.metadata.subClassOf.map((parent, i) => (
                <li key={i} className="text-sm text-blue-400 font-mono break-all">
                  {parent}
                </li>
              ))}
            </ul>
          </div>
        )}

        {node.metadata.domain && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Domain</span>
            <div className="mt-1 text-sm text-blue-400 font-mono break-all">{node.metadata.domain}</div>
          </div>
        )}

        {node.metadata.range && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Range</span>
            <div className="mt-1 text-sm text-blue-400 font-mono break-all">{node.metadata.range}</div>
          </div>
        )}

        {node.metadata.altLabels && node.metadata.altLabels.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Alternative Labels</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {node.metadata.altLabels.map((label, i) => (
                <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {node.metadata.examples && node.metadata.examples.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Examples</span>
            <ul className="mt-1 space-y-1">
              {node.metadata.examples.map((example, i) => (
                <li key={i} className="text-sm text-gray-300 font-mono">
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {node.metadata.dataProperties && node.metadata.dataProperties.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase mb-2 block">
              Data Properties ({node.metadata.dataProperties.length})
            </span>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-600 rounded">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 border-b border-gray-600">Property</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 border-b border-gray-600">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 border-b border-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600">
                  {node.metadata.dataProperties.map((prop, i) => (
                    <tr key={i} className="hover:bg-gray-700">
                      <td className="px-3 py-2 font-mono text-blue-400 text-xs">
                        {prop.label}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {prop.range ? (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded font-mono">
                            {prop.range.split('#').pop()?.split('/').pop() || prop.range}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {prop.comment || (
                          prop.examples && prop.examples.length > 0 ? (
                            <span className="text-gray-500 italic">e.g., {prop.examples[0]}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
