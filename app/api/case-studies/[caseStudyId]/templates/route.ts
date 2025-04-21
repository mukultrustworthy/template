import { NextResponse } from 'next/server';
import { addTemplateToCaseStudy } from '../../../services/caseStudyService';

interface RouteParams {
  params: {
    caseStudyId: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { caseStudyId } = params;
    
    if (!caseStudyId) {
      return NextResponse.json(
        { error: 'Case Study ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { templateId } = body;
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const result = await addTemplateToCaseStudy(caseStudyId, templateId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error adding template to case study:', error);
    
    if ((error as Error).message === 'Case study not found') {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add template to case study' },
      { status: 500 }
    );
  }
} 