import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const hubPath = path.join(process.cwd(), '..', 'ontology-hub');
    
    // Decode the filename which may contain path separators
    const decodedFilename = decodeURIComponent(filename);
    
    // Try ontologies folder first
    const ontologiesPath = path.join(hubPath, 'ontologies');
    let filePath = path.join(ontologiesPath, decodedFilename);
    
    // If not found, try reference-models folder
    if (!fs.existsSync(filePath)) {
      const referenceModelsPath = path.join(hubPath, 'reference-models', 'ontologies');
      filePath = path.join(referenceModelsPath, decodedFilename);
      
      // Security check - ensure file is within allowed directories
      if (!filePath.startsWith(referenceModelsPath)) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
      }
    } else {
      // Security check - ensure file is within ontologies directory
      if (!filePath.startsWith(ontologiesPath)) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
      }
    }

    // Check if file exists and is a .ttl file
    if (!fs.existsSync(filePath) || !decodedFilename.endsWith('.ttl')) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/turtle',
      },
    });
  } catch (error) {
    console.error('Error reading ontology file:', error);
    return NextResponse.json({ 
      error: 'Failed to read ontology file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
