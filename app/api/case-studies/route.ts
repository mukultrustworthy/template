import { NextResponse } from 'next/server';
import { createCaseStudy, getAllCaseStudies } from '../services/caseStudyService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tags, slides } = body;
    
    const result = await createCaseStudy(tags || [], slides || []);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error creating case study:', error);
    return NextResponse.json(
      { error: 'Failed to create case study' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all case studies
export async function GET() {
  try {
    const caseStudies = await getAllCaseStudies();
    return NextResponse.json({ caseStudies });
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case studies' },
      { status: 500 }
    );
  }
} 