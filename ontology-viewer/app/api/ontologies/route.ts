import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function scanTtlFiles(dirPath: string, basePath: string, folder: string): any[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files: any[] = [];
  
  function scan(currentPath: string, relativePath: string = '') {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        scan(fullPath, relPath);
      } else if (entry.name.endsWith('.ttl')) {
        files.push({
          name: entry.name,
          path: `/${basePath}/${relPath}`,
          relativePath: relPath,
          folder: folder,
          size: fs.statSync(fullPath).size
        });
      }
    }
  }
  
  scan(dirPath);
  return files;
}

export async function GET() {
  try {
    const hubPath = path.join(process.cwd(), '..', 'ontology-hub');
    
    // Scan ontologies folder
    const ontologiesPath = path.join(hubPath, 'ontologies');
    const ontologyFiles = scanTtlFiles(ontologiesPath, 'ontologies', 'ontologies');
    
    // Scan reference-models folder
    const referenceModelsPath = path.join(hubPath, 'reference-models', 'ontologies');
    const referenceFiles = scanTtlFiles(referenceModelsPath, 'reference-models', 'reference-models');
    
    const allFiles = [...ontologyFiles, ...referenceFiles];
    
    if (allFiles.length === 0) {
      return NextResponse.json({ 
        error: 'No ontology files found',
        paths: { ontologiesPath, referenceModelsPath }
      }, { status: 404 });
    }

    return NextResponse.json({ files: allFiles });
  } catch (error) {
    console.error('Error reading ontologies:', error);
    return NextResponse.json({ 
      error: 'Failed to read ontologies directory',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
