import dbConnect from '@/lib/mongodb';
import { Template } from '@/models';
import { IDesign } from '@/types/models';
import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface TemplateRequest {
  html: string;
  type?: string;
  tags?: string[];
}

export interface TemplateRecord {
  id: string;
  templateId: string;
  type: string;
  version: string;
  isLatest: boolean;
  publishedAt: string;
  createdBy: string;
  updatedAt: string;
  tags: string[];
  placeholders: Record<string, unknown>;
  htmlUrl: string;
}

interface TemplateWithDesign extends Document {
  _id: Types.ObjectId;
  type: string;
  tags: string[];
  designId: IDesign;
  createdAt: Date;
  updatedAt: Date;
}

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNTID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToR2(html: string, filename: string): Promise<string> {
  try {
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || '';
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `html/${filename}`,
      Body: html,
      ContentType: 'text/html',
    });

    await R2.send(command);
    const fileUrl = `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${filename}`;
    
    console.log(`Uploaded to CloudFlare R2: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to CloudFlare R2:', error);
    throw error;
  }
}

export async function createTemplate(
  designData: Partial<IDesign>,
  template: TemplateRequest,
  tags: string[] = []
): Promise<{
  success: boolean;
  templateId: string;
  designId: string;
  version: string;
  htmlUrl: string;
}> {
  const version = '1.0.0';
  
  await dbConnect();
  
  // Use direct MongoDB operations to bypass Mongoose validation
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to connect to database');
  }
  const designCollection = db.collection('designs');
  const templateCollection = db.collection('templates');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Create design document without Mongoose validation
    const designDoc = {
      _id: new mongoose.Types.ObjectId(),
      name: designData.name || `Template ${new Date().toLocaleDateString()}`,
      version: designData.version || 1,
      isLatest: designData.isLatest || true,
      publishedAt: designData.publishedAt || new Date(),
      createdBy: designData.createdBy || 'current-user@example.com',
      htmlRef: 'placeholder', // We'll update this later
      placeholders: designData.placeholders || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await designCollection.insertOne(designDoc, { session });
    
    const designId = designDoc._id.toString();
    
    const filename = `${designId}_v${version}.html`;
    
    // Update htmlRef with direct MongoDB operation
    await designCollection.updateOne(
      { _id: designDoc._id },
      { $set: { htmlRef: filename } },
      { session }
    );
    
    // Create template document without Mongoose validation
    const templateDoc = {
      _id: new mongoose.Types.ObjectId(),
      type: template.type || 'text',
      tags: template.tags || tags,
      designId: designDoc._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await templateCollection.insertOne(templateDoc, { session });
    
    const htmlUrl = await uploadToR2(template.html, filename);
    
    await session.commitTransaction();
    session.endSession();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Stored template:', {
        id: templateDoc._id.toString(),
        designId: designId,
        type: templateDoc.type,
        tags: templateDoc.tags
      });
    }
    
    return {
      success: true,
      templateId: templateDoc._id.toString(),
      designId: designId,
      version,
      htmlUrl
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Transaction aborted:', error);
    throw error;
  }
}

export async function getAllTemplates(): Promise<TemplateRecord[]> {
  await dbConnect();
  
  const templates = await Template.find().populate('designId').lean() as unknown as TemplateWithDesign[];
  
  return templates.map(template => {
    const design = template.designId;
    
    const placeholders = design?.placeholders || {};
    
    return {
      id: template._id.toString(),
      templateId: template._id.toString(),
      type: template.type,
      version: design?.version?.toString() || '1.0.0',
      isLatest: design?.isLatest || true,
      publishedAt: design?.publishedAt 
        ? (design.publishedAt instanceof Date 
           ? design.publishedAt.toISOString() 
           : new Date(design.publishedAt).toISOString())
        : new Date().toISOString(),
      createdBy: design?.createdBy || 'unknown',
      updatedAt: template.updatedAt.toISOString(),
      tags: template.tags,
      placeholders,
      htmlUrl: design?.htmlRef ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}` : ''
    } as TemplateRecord;
  });
}

export async function getTemplatesByType(type: string): Promise<TemplateRecord[]> {
  await dbConnect();
  
  const templates = await Template.find({ type }).populate('designId').lean() as unknown as TemplateWithDesign[];
  
  return templates.map(template => {
    const design = template.designId;
    
    const placeholders = design?.placeholders || {};
    
    return {
      id: template._id.toString(),
      templateId: template._id.toString(),
      type: template.type,
      version: design?.version?.toString() || '1.0.0',
      isLatest: design?.isLatest || true,
      publishedAt: design?.publishedAt 
        ? (design.publishedAt instanceof Date 
           ? design.publishedAt.toISOString() 
           : new Date(design.publishedAt).toISOString())
        : new Date().toISOString(),
      createdBy: design?.createdBy || 'unknown',
      updatedAt: template.updatedAt.toISOString(),
      tags: template.tags,
      placeholders,
      htmlUrl: design?.htmlRef ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}` : ''
    } as TemplateRecord;
  });
}

export async function getTemplateById(id: string): Promise<TemplateRecord | null> {
  await dbConnect();
  
  const template = await Template.findById(id).populate('designId').lean() as unknown as TemplateWithDesign | null;
  
  if (!template) return null;
  
  const design = template.designId;
  
  const placeholders = design?.placeholders || {};
  
  return {
    id: template._id.toString(),
    templateId: template._id.toString(),
    type: template.type,
    version: design?.version?.toString() || '1.0.0',
    isLatest: design?.isLatest || true,
    publishedAt: design?.publishedAt 
      ? (design.publishedAt instanceof Date 
         ? design.publishedAt.toISOString() 
         : new Date(design.publishedAt).toISOString())
      : new Date().toISOString(),
    createdBy: design?.createdBy || 'unknown',
    updatedAt: template.updatedAt.toISOString(),
    tags: template.tags,
    placeholders,
    htmlUrl: design?.htmlRef ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}` : ''
  } as TemplateRecord;
} 