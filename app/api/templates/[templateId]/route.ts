import { NextResponse } from 'next/server';
import { getTemplateById } from '../../services/templateService';

interface RouteParams {
  params: {
    templateId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { templateId } = params;
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
    
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
} 