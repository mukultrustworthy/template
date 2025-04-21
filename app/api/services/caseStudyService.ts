import dbConnect from '@/lib/mongodb';
import { CaseStudy } from '@/models';
import { Document, Types } from 'mongoose';

export interface CaseStudyRecord {
  id: string;
  tags: string[];
  templateIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface CaseStudyWithTemplates extends Document {
  _id: Types.ObjectId;
  tags: string[];
  templateIds: {
    _id: Types.ObjectId;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createCaseStudy(
  tags: string[] = [],
  templateIds: string[] = []
): Promise<{
  success: boolean;
  caseStudyId: string;
}> {
  await dbConnect();
  
  const templates = templateIds.map(id => new Types.ObjectId(id));
  
  const caseStudy = await CaseStudy.create({
    tags,
    templateIds: templates
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Created case study:', {
      id: caseStudy._id.toString(),
      tags: caseStudy.tags,
      templateIds: caseStudy.templateIds
    });
  }
  
  return {
    success: true,
    caseStudyId: caseStudy._id.toString()
  };
}

export async function getAllCaseStudies(): Promise<CaseStudyRecord[]> {
  await dbConnect();
  
  const caseStudies = await CaseStudy.find()
    .populate('templateIds', '_id type')
    .lean() as unknown as CaseStudyWithTemplates[];
  
  return caseStudies.map(caseStudy => {
    return {
      id: caseStudy._id.toString(),
      tags: caseStudy.tags,
      templateIds: caseStudy.templateIds.map(template => template._id.toString()),
      createdAt: caseStudy.createdAt.toISOString(),
      updatedAt: caseStudy.updatedAt.toISOString()
    };
  });
}

export async function getCaseStudyById(id: string): Promise<CaseStudyRecord | null> {
  await dbConnect();
  
  const caseStudy = await CaseStudy.findById(id)
    .populate('templateIds', '_id type')
    .lean() as unknown as CaseStudyWithTemplates | null;
  
  if (!caseStudy) return null;
  
  return {
    id: caseStudy._id.toString(),
    tags: caseStudy.tags,
    templateIds: caseStudy.templateIds.map(template => template._id.toString()),
    createdAt: caseStudy.createdAt.toISOString(),
    updatedAt: caseStudy.updatedAt.toISOString()
  };
}

export async function addTemplateToCaseStudy(
  caseStudyId: string,
  templateId: string
): Promise<{
  success: boolean;
  caseStudyId: string;
}> {
  await dbConnect();
  
  const caseStudy = await CaseStudy.findById(caseStudyId);
  
  if (!caseStudy) {
    throw new Error('Case study not found');
  }
  
  const templateObjectId = new Types.ObjectId(templateId);
  
  const templateExists = caseStudy.templateIds.some(
    (id) => id.toString() === templateObjectId.toString()
  );
  
  if (!templateExists) {
    await CaseStudy.updateOne(
      { _id: caseStudyId },
      { $addToSet: { templateIds: templateObjectId } }
    );
  }
  
  return {
    success: true,
    caseStudyId: caseStudy._id.toString()
  };
} 