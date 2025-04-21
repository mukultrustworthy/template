import { NextResponse } from 'next/server';
import { getCaseStudyById } from '../../services/caseStudyService';

interface RouteParams {
  params: {
    caseStudyId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { caseStudyId } = params;
    
    if (!caseStudyId) {
      return NextResponse.json(
        { error: 'Case Study ID is required' },
        { status: 400 }
      );
    }
    
    const caseStudy = await getCaseStudyById(caseStudyId);
    
    if (!caseStudy) {
      return NextResponse.json(
        { error: 'Case Study not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ caseStudy });
    
  } catch (error) {
    console.error('Error fetching case study:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case study' },
      { status: 500 }
    );
  }
} 