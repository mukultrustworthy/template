import dbConnect from "@/lib/mongodb";
import { Template } from "@/models";
import { IDesign } from "@/types/models";
import { Document, Types } from "mongoose";
import mongoose from "mongoose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface TemplateRequest {
  htmlRef: string;
  type?: string;
  tags?: string[];
  name?: string;
  version?: number;
  isLatest?: boolean;
  publishedAt?: Date | null;
  createdBy?: string;
  jsonData?: Record<string, unknown>;
  placeholders?: unknown[];
  collectionId?: string | null;
  parentId?: string | null;
  childIds?: string[];
}

export interface TemplateRecord {
  htmlRef: string;
  type?: string;
  tags?: string[];
  name?: string;
  version?: number;
  isLatest?: boolean;
  publishedAt?: Date | null;
  createdBy?: string;
  jsonData?: Record<string, unknown>;
  placeholders?: unknown[];
  collectionId?: string | null;
  parentId?: string | null;
  childIds?: string[];
  _id: string;
  htmlUrl: string;
}

interface TemplateWithDesign extends Document {
  _id: Types.ObjectId;
  type: string;
  tags: string[];
  designId: IDesign;
  placeholders: unknown[];
  jsonData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNTID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadToR2(
  html: string,
  filename: string
): Promise<string> {
  try {
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || "";
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `html/${filename}`,
      Body: html,
      ContentType: "text/html",
    });

    await R2.send(command);
    const fileUrl = `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${filename}`;

    console.log(`Uploaded to CloudFlare R2: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading to CloudFlare R2:", error);
    throw error;
  }
}

export async function createTemplate(
  template: TemplateRequest,
  tags: string[] = []
): Promise<{
  success: boolean;
  templateId: string;
  version: string;
  htmlUrl: string;
}> {
  const version = "1.0.0";

  await dbConnect();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Failed to connect to database");
  }

  const templateCollection = db.collection("templates");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const templateDoc = {
      _id: new mongoose.Types.ObjectId(),
      name: template.name || `Template ${new Date().toLocaleDateString()}`,
      type: template.type || "text",
      tags: template.tags || tags,
      collectionId: template.collectionId || null,
      parentId: template.parentId || null,
      childIds: template.childIds || [],
      publishedAt: template.publishedAt || null,
      placeholders: template.placeholders || [],
      jsonData: template.jsonData || {},
      version: template.version || 1,
      isLatest: template.isLatest || true,
      createdBy: template.createdBy || "current-user@example.com",
      htmlRef: "placeholder", // We'll update this later
      htmlUrl: "",
    };

    await templateCollection.insertOne(templateDoc, { session });

    const templateId = templateDoc._id.toString();
    const filename = `${templateId}_v${version}.html`;

    const htmlUrl = await uploadToR2(template.htmlRef, filename);

    // Update htmlRef with direct MongoDB operation
    await templateCollection.updateOne(
      { _id: templateDoc._id },
      { $set: { htmlRef: filename, htmlUrl: htmlUrl } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    if (process.env.NODE_ENV === "development") {
      console.log("Stored template:", {
        id: templateDoc._id.toString(),
        templateId: templateId,
        type: templateDoc.type,
        tags: templateDoc.tags,
      });
    }

    return {
      success: true,
      templateId: templateDoc._id.toString(),
      version,
      htmlUrl,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction aborted:", error);
    throw error;
  }
}

export async function getAllTemplates() {
  await dbConnect();
  const templates = await Template.find().lean();
  return templates;
}

export async function getTemplatesByType(
  type: string
): Promise<TemplateRecord[]> {
  await dbConnect();

  const templates = (await Template.find({ type })
    .populate("designId")
    .lean()) as unknown as TemplateWithDesign[];

  return templates.map((template) => {
    const design = template.designId;

    return {
      _id: template._id.toString(),
      htmlRef: design?.htmlRef || "",
      templateId: template._id.toString(),
      type: template.type,
      version: design?.version || 1,
      isLatest: design?.isLatest || true,
      publishedAt: design?.publishedAt
        ? design.publishedAt instanceof Date
          ? design.publishedAt
          : new Date(design.publishedAt)
        : new Date(),
      createdBy: design?.createdBy || "unknown",
      updatedAt: template.updatedAt.toISOString(),
      tags: template.tags,
      placeholders: template.placeholders || [],
      jsonData: template.jsonData || {},
      htmlUrl: design?.htmlRef
        ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}`
        : "",
    } as TemplateRecord;
  });
}

export async function getTemplateById(
  id: string
): Promise<TemplateRecord | null> {
  await dbConnect();

  const template = (await Template.findById(id)
    .populate("designId")
    .lean()) as unknown as TemplateWithDesign | null;

  if (!template) return null;

  const design = template.designId;

  return {
    _id: template._id.toString(),
    htmlRef: design?.htmlRef || "",
    templateId: template._id.toString(),
    type: template.type,
    version: design?.version || 1,
    isLatest: design?.isLatest || true,
    publishedAt: design?.publishedAt
      ? design.publishedAt instanceof Date
        ? design.publishedAt
        : new Date(design.publishedAt)
      : new Date(),
    createdBy: design?.createdBy || "unknown",
    updatedAt: template.updatedAt.toISOString(),
    tags: template.tags,
    placeholders: template.placeholders || [],
    jsonData: template.jsonData || {},
    htmlUrl: design?.htmlRef
      ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}`
      : "",
  } as TemplateRecord;
}
