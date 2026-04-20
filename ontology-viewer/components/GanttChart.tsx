'use client';

import { useEffect, useRef } from 'react';
import { OntologyNode } from '@/types/ontology';
import { useLanguage } from '@/contexts/LanguageContext';
import * as d3 from 'd3';

interface GanttChartProps {
  instances: OntologyNode[];
}

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'project' | 'workpackage' | 'task' | 'taskstep';
  status: string;
  dependencies: string[];
}

const WORK_NAMESPACE = 'http://juri.be/ontology/work#';

export default function GanttChart({ instances }: GanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (!svgRef.current || instances.length === 0) return;

    const tasks = extractTasks(instances);
    if (tasks.length === 0) return;

    renderGantt(svgRef.current, tasks);
  }, [instances]);

  const extractTasks = (instances: OntologyNode[]): GanttTask[] => {
    const tasks: GanttTask[] = [];

    instances.forEach(instance => {
      const props = instance.metadata.properties || {};
      const type = instance.metadata.instanceOf || '';

      // Only process tasks and work packages
      if (!type.includes('Task') && !type.includes('WorkPackage') && !type.includes('ConstructionProject')) {
        return;
      }

      // Extract dates
      const startDateStr = props[WORK_NAMESPACE + 'plannedStartDate'] || 
                          props[WORK_NAMESPACE + 'actualStartDate'];
      const endDateStr = props[WORK_NAMESPACE + 'plannedEndDate'] || 
                        props[WORK_NAMESPACE + 'actualEndDate'];

      if (!startDateStr || !endDateStr) return;

      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      // Determine status and progress
      const statusUri = props[WORK_NAMESPACE + 'hasStatus'];
      let status = 'NotStarted';
      let progress = 0;

      if (statusUri) {
        const statusName = statusUri.split('#').pop() || statusUri;
        status = statusName;
        if (statusName === 'Completed') progress = 100;
        else if (statusName === 'InProgress') progress = 50;
      }

      // Extract dependencies
      const predecessorTask = props[WORK_NAMESPACE + 'predecessorTask'];
      const dependencies = predecessorTask ? 
        (Array.isArray(predecessorTask) ? predecessorTask : [predecessorTask]) : [];

      // Determine task type
      let taskType: 'project' | 'workpackage' | 'task' | 'taskstep' = 'task';
      if (type.includes('ConstructionProject')) taskType = 'project';
      else if (type.includes('WorkPackage')) taskType = 'workpackage';
      else if (type.includes('TaskStep')) taskType = 'taskstep';

      // Get name
      let name = instance.id.split('#').pop() || instance.id;
      if (typeof instance.label === 'string') {
        name = instance.label;
      } else if (instance.label && typeof instance.label === 'object') {
        const labelVal = instance.label.en || instance.label.nl || name;
        name = Array.isArray(labelVal) ? labelVal[0] : labelVal;
      }

      tasks.push({
        id: instance.id,
        name,
        start,
        end,
        progress,
        type: taskType,
        status,
        dependencies
      });
    });

    // Sort by start date
    return tasks.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const renderGantt = (svg: SVGSVGElement, tasks: GanttTask[]) => {
    // Clear previous content
    d3.select(svg).selectAll('*').remove();

    const margin = { top: 60, right: 40, bottom: 30, left: 200 };
    const width = svg.clientWidth - margin.left - margin.right;
    const height = Math.max(tasks.length * 40, 300);

    // Set up SVG
    const svgSelection = d3.select(svg)
      .attr('width', svg.clientWidth)
      .attr('height', height + margin.top + margin.bottom);

    const g = svgSelection.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate date range
    const minDate = d3.min(tasks, d => d.start) || new Date();
    const maxDate = d3.max(tasks, d => d.end) || new Date();
    
    // Add padding to date range
    const padding = (maxDate.getTime() - minDate.getTime()) * 0.1;
    const xMin = new Date(minDate.getTime() - padding);
    const xMax = new Date(maxDate.getTime() + padding);

    // Scales
    const xScale = d3.scaleTime()
      .domain([xMin, xMax])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(tasks.map(t => t.id))
      .range([0, height])
      .padding(0.2);

    // Color scale for task types
    const colorScale = (type: string, status: string) => {
      if (status === 'Completed') return '#10b981';
      if (status === 'InProgress') return '#3b82f6';
      if (status === 'OnHold') return '#f59e0b';
      return '#6b7280';
    };

    // Add grid lines
    const xAxis = d3.axisTop(xScale)
      .ticks(10)
      .tickSize(-height);

    g.append('g')
      .attr('class', 'grid')
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', '#374151')
      .attr('stroke-dasharray', '2,2');

    g.select('.grid')
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px');

    g.select('.grid')
      .select('.domain')
      .attr('stroke', '#4b5563');

    // Add today line
    const today = new Date();
    if (today >= xMin && today <= xMax) {
      g.append('line')
        .attr('x1', xScale(today))
        .attr('x2', xScale(today))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .attr('x', xScale(today))
        .attr('y', -10)
        .attr('fill', '#ef4444')
        .attr('font-size', '11px')
        .attr('text-anchor', 'middle')
        .text('Today');
    }

    // Draw task bars
    const taskGroups = g.selectAll('.task')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task');

    // Background bars
    taskGroups.append('rect')
      .attr('x', d => xScale(d.start))
      .attr('y', d => yScale(d.id)!)
      .attr('width', d => xScale(d.end) - xScale(d.start))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.type, d.status))
      .attr('opacity', 0.3)
      .attr('rx', 4);

    // Progress bars
    taskGroups.append('rect')
      .attr('x', d => xScale(d.start))
      .attr('y', d => yScale(d.id)!)
      .attr('width', d => (xScale(d.end) - xScale(d.start)) * (d.progress / 100))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.type, d.status))
      .attr('rx', 4);

    // Task labels (on the left)
    g.selectAll('.task-label')
      .data(tasks)
      .enter()
      .append('text')
      .attr('class', 'task-label')
      .attr('x', -10)
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '12px')
      .text(d => {
        const maxLen = 25;
        return d.name.length > maxLen ? d.name.substring(0, maxLen) + '...' : d.name;
      })
      .append('title')
      .text(d => d.name);

    // Duration labels (inside bars)
    taskGroups.append('text')
      .attr('x', d => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
      .attr('y', d => yScale(d.id)! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => {
        const days = Math.ceil((d.end.getTime() - d.start.getTime()) / (1000 * 60 * 60 * 24));
        return `${days}d`;
      });

    // Draw dependencies
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          const x1 = xScale(depTask.end);
          const y1 = yScale(depTask.id)! + yScale.bandwidth() / 2;
          const x2 = xScale(task.start);
          const y2 = yScale(task.id)! + yScale.bandwidth() / 2;

          g.append('path')
            .attr('d', `M ${x1},${y1} L ${x1 + 10},${y1} L ${x1 + 10},${y2} L ${x2},${y2}`)
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1.5)
            .attr('fill', 'none')
            .attr('marker-end', 'url(#arrowhead)');
        }
      });
    });

    // Define arrowhead marker
    const defs = svgSelection.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 8)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#6b7280');
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">
        {language === 'en' ? 'Project Timeline' : 'Project Tijdlijn'}
      </h3>
      <div className="overflow-x-auto">
        <svg ref={svgRef} className="w-full" style={{ minHeight: '260px' }} />
      </div>
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-300">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-300">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-gray-300">Not Started</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-gray-300">Today</span>
        </div>
      </div>
    </div>
  );
}
