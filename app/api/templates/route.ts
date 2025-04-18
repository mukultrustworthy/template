import { NextResponse } from 'next/server';
import { ElementDataMapping } from '@/utils/htmlInspector';
// Add nanoid for ID generation instead of uuid which requires installation
import { nanoid } from 'nanoid';

// Define a type for our template records
interface TemplateRecord {
  id: string;
  assetId: string;
  type: string;
  version: string;
  isLatest: boolean;
  publishedAt: string;
  createdBy: string;
  updatedAt: string;
  tags: string[];
  mappings: ElementDataMapping[];
  htmlUrl: string;
}

// Mock database for now - would be replaced with actual MongoDB connection
const mockTemplatesDb: TemplateRecord[] = [];

// Mock S3 storage function - would be replaced with actual S3 upload
async function uploadToS3(html: string, filename: string): Promise<string> {
  console.log(`[Mock S3] Uploading ${filename}`);
  // This would be replaced with actual S3 upload logic
  // Return mock S3 URL
  return `https://assets.example.com/html/${filename}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetData, template } = body;
    
    if (!assetData || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: assetData and template' },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const assetId = `${assetData.type || 'template'}_${nanoid(8)}`;
    const templateId = `template_${nanoid()}`;
    const version = '1.0.0'; // Initial version
    
    // Create filename for S3
    const filename = `${assetId}_v${version}.html`;
    
    // Upload HTML to S3 (mocked)
    const htmlUrl = await uploadToS3(template.html, filename);
    
    // Create metadata for MongoDB
    const templateMetadata: TemplateRecord = {
      id: templateId,
      assetId,
      type: assetData.type || 'text',
      version,
      isLatest: true,
      publishedAt: new Date().toISOString(),
      createdBy: 'current-user@example.com', // Would come from auth
      updatedAt: new Date().toISOString(),
      tags: body.tags || [],
      mappings: template.mappings,
      htmlUrl
    };
    
    // Store in mock database (would be MongoDB)
    mockTemplatesDb.push(templateMetadata);
    
    // In development, log what we're storing
    if (process.env.NODE_ENV === 'development') {
      console.log('Stored template:', templateMetadata);
    }
    
    return NextResponse.json({ 
      success: true, 
      templateId: templateId,
      assetId: assetId,
      version,
      htmlUrl 
    });
    
  } catch (error) {
    console.error('Error publishing template:', error);
    return NextResponse.json(
      { error: 'Failed to publish template' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all templates
export async function GET() {
  // This would fetch from MongoDB in production
  return NextResponse.json({ templates: mockTemplatesDb });
} 