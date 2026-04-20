'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { OntologyGraph as GraphData, OntologyNode, OntologyEdge } from '@/types/ontology';

interface OntologyGraphProps {
  data: GraphData;
  onNodeSelect?: (node: OntologyNode | null) => void;
}

export default function OntologyGraph({ data, onNodeSelect }: OntologyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [highlightNeighbors, setHighlightNeighbors] = useState(true);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    const g = svg.append('g');

    svg.append('defs').selectAll('marker')
      .data(['subClassOf', 'objectProperty'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d === 'subClassOf' ? '#94a3b8' : '#3b82f6');

    const nodeColors = {
      'owl:Class': '#10b981',
      'owl:ObjectProperty': '#3b82f6',
      'owl:DatatypeProperty': '#f59e0b'
    };
    
    const getNodeColor = (node: OntologyNode) => {
      if (node.sourceFile === 'external') return '#94a3b8';
      return nodeColors[node.nodeType] || '#6b7280';
    };

    const getConnectedNodes = (nodeId: string): Set<string> => {
      const connected = new Set<string>([nodeId]);
      data.edges.forEach(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        
        if (sourceId === nodeId) connected.add(targetId);
        if (targetId === nodeId) connected.add(sourceId);
      });
      return connected;
    };

    const isEdgeConnected = (edge: OntologyEdge, nodeId: string): boolean => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return sourceId === nodeId || targetId === nodeId;
    };

    const simulation = d3.forceSimulation<OntologyNode>(data.nodes)
      .force('link', d3.forceLink<OntologyNode, OntologyEdge>(data.edges)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const link = g.append('g')
      .selectAll('line')
      .data(data.edges)
      .enter().append('line')
      .attr('stroke', d => d.type === 'subClassOf' ? '#94a3b8' : '#3b82f6')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    const linkLabel = g.append('g')
      .selectAll('text')
      .data(data.edges)
      .enter().append('text')
      .attr('font-size', 10)
      .attr('fill', '#9ca3af')
      .attr('text-anchor', 'middle')
      .text(d => d.label);

    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, OntologyNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    const circles = node.append('circle')
      .attr('r', 20)
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .attr('opacity', d => d.sourceFile === 'external' ? 0.5 : 1)
      .on('click', (event, d) => {
        setSelectedNode(d);
        onNodeSelect?.(d);
        
        if (highlightNeighbors) {
          const connectedNodes = getConnectedNodes(d.id);
          
          circles
            .attr('stroke', n => n.id === d.id ? '#000' : '#fff')
            .attr('stroke-width', n => n.id === d.id ? 3 : 2)
            .style('opacity', n => {
              if (n.sourceFile === 'external') {
                return connectedNodes.has(n.id) ? 0.5 : 0.2;
              }
              return connectedNodes.has(n.id) ? 1 : 0.3;
            });
          
          link
            .style('opacity', e => isEdgeConnected(e, d.id) ? 1 : 0.1)
            .attr('stroke-width', e => isEdgeConnected(e, d.id) ? 3 : 2);
          
          linkLabel
            .style('opacity', e => isEdgeConnected(e, d.id) ? 1 : 0.1);
          
          nodeLabels
            .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
          
          typeBadges
            .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
        } else {
          circles
            .attr('stroke', n => n.id === d.id ? '#000' : '#fff')
            .attr('stroke-width', n => n.id === d.id ? 3 : 2);
        }
      })
      .on('dblclick', (event, d) => {
        circles
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('opacity', n => n.sourceFile === 'external' ? 0.5 : 1);
        
        link
          .style('opacity', 0.6)
          .attr('stroke-width', 2);
        
        linkLabel.style('opacity', 1);
        nodeLabels.style('opacity', 1);
        typeBadges.style('opacity', 1);
        
        setSelectedNode(null);
        onNodeSelect?.(null);
      });

    const nodeLabels = node.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('fill', '#e5e7eb')
      .text(d => d.label)
      .style('pointer-events', 'none');

    const typeBadges = node.append('text')
      .attr('dy', 48)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#9ca3af')
      .text(d => d.nodeType.replace('owl:', ''))
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as OntologyNode).x!)
        .attr('y1', d => (d.source as OntologyNode).y!)
        .attr('x2', d => (d.target as OntologyNode).x!)
        .attr('y2', d => (d.target as OntologyNode).y!);

      linkLabel
        .attr('x', d => ((d.source as OntologyNode).x! + (d.target as OntologyNode).x!) / 2)
        .attr('y', d => ((d.source as OntologyNode).y! + (d.target as OntologyNode).y!) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: OntologyNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: OntologyNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: OntologyNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, onNodeSelect, highlightNeighbors]);

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <svg ref={svgRef} className="w-full h-full" />
      
      <div className="absolute top-4 left-4 bg-gray-800 border border-gray-600 p-3 rounded shadow-md text-sm">
        <div className="font-semibold mb-2 text-gray-100">Controls</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={highlightNeighbors}
            onChange={(e) => setHighlightNeighbors(e.target.checked)}
            className="w-4 h-4 text-blue-500 rounded"
          />
          <span className="text-xs text-gray-300">Highlight neighbors</span>
        </label>
        <div className="text-xs text-gray-400 mt-2">
          <div>Click: Select & highlight</div>
          <div>Double-click: Reset</div>
          <div>Drag: Move node</div>
          <div>Scroll: Zoom</div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 p-3 rounded shadow-md text-sm">
        <div className="font-semibold mb-2 text-gray-100">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#10b981]"></div>
            <span className="text-gray-300">Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#3b82f6]"></div>
            <span className="text-gray-300">Object Property</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#f59e0b]"></div>
            <span className="text-gray-300">Data Property</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#94a3b8] opacity-50"></div>
            <span className="text-gray-300">External Reference</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-600 p-3 rounded shadow-md text-sm">
        <div className="font-semibold mb-1 text-gray-100">Graph Stats</div>
        <div className="text-gray-400">
          {data.nodes.length} nodes, {data.edges.length} edges
        </div>
      </div>
    </div>
  );
}
