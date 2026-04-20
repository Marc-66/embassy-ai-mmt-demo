'use client';

import { OntologyNode } from '@/types/ontology';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { getLocalizedText, getLocalizedArray } from '@/lib/localizedText';

interface NodeDetailsProps {
  node: OntologyNode | null;
}

export default function NodeDetails({ node }: NodeDetailsProps) {
  const { language } = useLanguage();
  
  if (!node) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
        <div className="text-gray-400 text-center">
          {t('selectNode', language)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto max-h-full border border-gray-700">
      <h2 className="text-xl font-bold text-gray-100 mb-3">
        {getLocalizedText(node.label, language)}
      </h2>
      
      <div className="space-y-3">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">{t('type', language)}</span>
          <div className="mt-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded inline-block text-sm">
            {t(node.nodeType as keyof typeof import('@/lib/translations').translations.en, language)}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">{t('uri', language)}</span>
          <div className="mt-1 text-sm text-gray-300 font-mono break-all">{node.id}</div>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">{t('sourceFile', language)}</span>
          <div className="mt-1 text-sm text-gray-300 font-mono">{node.sourceFile}</div>
        </div>

        {node.metadata.comment && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('comment', language)}</span>
            <div className="mt-1 text-sm text-gray-300">
              {getLocalizedText(node.metadata.comment, language)}
            </div>
          </div>
        )}

        {node.metadata.definition && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('definition', language)}</span>
            <div className="mt-1 text-sm text-gray-300">
              {getLocalizedText(node.metadata.definition, language)}
            </div>
          </div>
        )}

        {node.metadata.subClassOf && node.metadata.subClassOf.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('subclassOf', language)}</span>
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
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('domain', language)}</span>
            <div className="mt-1 text-sm text-blue-400 font-mono break-all">{node.metadata.domain}</div>
          </div>
        )}

        {node.metadata.range && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('range', language)}</span>
            <div className="mt-1 text-sm text-blue-400 font-mono break-all">{node.metadata.range}</div>
          </div>
        )}

        {node.metadata.altLabels && getLocalizedArray(node.metadata.altLabels, language).length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('alternativeLabels', language)}</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {getLocalizedArray(node.metadata.altLabels, language).map((label, i) => (
                <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {node.metadata.examples && getLocalizedArray(node.metadata.examples, language).length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">{t('examples', language)}</span>
            <ul className="mt-1 space-y-1">
              {getLocalizedArray(node.metadata.examples, language).map((example, i) => (
                <li key={i} className="text-sm text-gray-300 font-mono">
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Display instance properties */}
        {node.type === 'instance' && node.metadata.instanceOf && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Instance Of</span>
            <div className="mt-1 text-sm text-orange-400 font-mono break-all">
              {node.metadata.instanceOf.split('#').pop() || node.metadata.instanceOf}
            </div>
          </div>
        )}

        {node.type === 'instance' && node.metadata.properties && Object.keys(node.metadata.properties).length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase mb-2 block">
              Properties
            </span>
            <div className="space-y-2">
              {Object.entries(node.metadata.properties).map(([key, value], i) => (
                <div key={i} className="bg-gray-700 rounded p-2">
                  <div className="text-xs text-gray-400 mb-1">
                    {key.split('#').pop() || key.split('/').pop() || key}
                  </div>
                  <div className="text-sm text-gray-200">
                    {Array.isArray(value) ? (
                      <ul className="space-y-1">
                        {value.map((v, j) => (
                          <li key={j} className="font-mono text-xs">
                            {typeof v === 'string' && v.startsWith('http') ? (
                              <span className="text-blue-400">{v.split('#').pop() || v.split('/').pop() || v}</span>
                            ) : (
                              String(v)
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-mono text-xs">
                        {typeof value === 'string' && value.startsWith('http') ? (
                          <span className="text-blue-400">{value.split('#').pop() || value.split('/').pop() || value}</span>
                        ) : (
                          String(value)
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.metadata.dataProperties && node.metadata.dataProperties.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase mb-2 block">
              {t('dataPropertiesTitle', language)} ({node.metadata.dataProperties.length})
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
                        {getLocalizedText(prop.label, language)}
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
                        {prop.comment ? (
                          getLocalizedText(prop.comment, language)
                        ) : (
                          prop.examples && getLocalizedArray(prop.examples, language).length > 0 ? (
                            <span className="text-gray-500 italic">e.g., {getLocalizedArray(prop.examples, language)[0]}</span>
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
