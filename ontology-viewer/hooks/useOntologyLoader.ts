'use client';

import { useState, useEffect, useCallback } from 'react';
import { OntologyGraph, OntologyFile } from '@/types/ontology';
import { parseOntologyFile, mergeGraphs } from '@/lib/rdfParser';

export function useOntologyLoader() {
  const [files, setFiles] = useState<OntologyFile[]>([]);
  const [graph, setGraph] = useState<OntologyGraph>({ nodes: [], edges: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available ontology files
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/api/ontologies');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }

        setFiles(data.files.map((f: any) => ({
          name: f.name,
          path: f.path,
          relativePath: f.relativePath,
          folder: f.folder,
          selected: f.folder === 'ontologies' // Auto-select only ontologies by default
        })));
      } catch (err) {
        setError('Failed to fetch ontology files');
        console.error(err);
      }
    }

    fetchFiles();
  }, []);

  // Load selected ontologies
  const loadOntologies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const selectedFiles = files.filter(f => f.selected);
      
      if (selectedFiles.length === 0) {
        setGraph({ nodes: [], edges: [], files: [] });
        setLoading(false);
        return;
      }

      const graphs = await Promise.all(
        selectedFiles.map(async (file) => {
          const encodedPath = encodeURIComponent(file.relativePath);
          const response = await fetch(`/api/ontologies/${encodedPath}`);
          const content = await response.text();
          return parseOntologyFile(content, file.name);
        })
      );

      const mergedGraph = mergeGraphs(graphs);
      setGraph(mergedGraph);
    } catch (err) {
      setError('Failed to parse ontology files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [files]);

  // Load ontologies when selection changes
  useEffect(() => {
    if (files.length > 0) {
      loadOntologies();
    }
  }, [files, loadOntologies]);

  const toggleFile = useCallback((filename: string) => {
    setFiles(prev => prev.map(f => 
      f.name === filename ? { ...f, selected: !f.selected } : f
    ));
  }, []);

  const selectAll = useCallback(() => {
    setFiles(prev => prev.map(f => ({ ...f, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setFiles(prev => prev.map(f => ({ ...f, selected: false })));
  }, []);

  return {
    files,
    graph,
    loading,
    error,
    toggleFile,
    selectAll,
    deselectAll,
    reload: loadOntologies
  };
}
