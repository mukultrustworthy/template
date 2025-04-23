import dbConnect from "@/lib/mongodb";
import Slide from "@/models/slides";
import { IDesign } from "@/types/models";
import { Document, Types } from "mongoose";
import mongoose from "mongoose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface SlideRequest {
  html: string;
  type?: string;
  tags?: string[];
}

export interface SlideRecord {
  id: string;
  slideId: string;
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

interface SlideWithDesign extends Document {
  _id: Types.ObjectId;
  type: string;
  tags: string[];
  designId: IDesign;
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
  designData: Partial<IDesign>,
  slide: SlideRequest,
  tags: string[] = []
): Promise<{
  success: boolean;
  slideId: string;
  designId: string;
  version: string;
  htmlUrl: string;
}> {
  const version = "1.0.0";

  await dbConnect();

  // Use direct MongoDB operations to bypass Mongoose validation
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Failed to connect to database");
  }
  const designCollection = db.collection("designs");
  const slideCollection = db.collection("slides");

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
      createdBy: designData.createdBy || "current-user@example.com",
      htmlRef: "placeholder", // We'll update this later
      placeholders: designData.placeholders || {},
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const slideDoc = {
      _id: new mongoose.Types.ObjectId(),
      type: slide.type || "text",
      tags: slide.tags || tags,
      designId: designDoc._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await slideCollection.insertOne(slideDoc, { session });

    const htmlUrl = await uploadToR2(slide.html, filename);

    await session.commitTransaction();
    session.endSession();

    if (process.env.NODE_ENV === "development") {
      console.log("Stored template:", {
        id: slideDoc._id.toString(),
        designId: designId,
        type: slideDoc.type,
        tags: slideDoc.tags,
      });
    }

    return {
      success: true,
      slideId: slideDoc._id.toString(),
      designId: designId,
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

export async function getAllSlides(): Promise<SlideRecord[]> {
  await dbConnect();

  const slides = (await Slide.find()
    .populate("designId")
    .lean()) as unknown as SlideWithDesign[];

  return slides.map((slide) => {
    const design = slide.designId;

    const placeholders = design?.placeholders || {};

    return {
      id: slide._id.toString(),
      slideId: slide._id.toString(),
      type: slide.type,
      version: design?.version?.toString() || "1.0.0",
      isLatest: design?.isLatest || true,
      publishedAt: design?.publishedAt
        ? design.publishedAt instanceof Date
          ? design.publishedAt.toISOString()
          : new Date(design.publishedAt).toISOString()
        : new Date().toISOString(),
      createdBy: design?.createdBy || "unknown",
      updatedAt: slide.updatedAt.toISOString(),
      tags: slide.tags,
      placeholders,
      htmlUrl: design?.htmlRef
        ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}`
        : "",
    } as SlideRecord;
  });
}

export async function getTemplatesByType(type: string): Promise<SlideRecord[]> {
  await dbConnect();

  const slides = (await Slide.find({ type })
    .populate("designId")
    .lean()) as unknown as SlideWithDesign[];

  return slides.map((slide) => {
    const design = slide.designId;

    const placeholders = design?.placeholders || {};

    return {
      id: slide._id.toString(),
      slideId: slide._id.toString(),
      type: slide.type,
      version: design?.version?.toString() || "1.0.0",
      isLatest: design?.isLatest || true,
      publishedAt: design?.publishedAt
        ? design.publishedAt instanceof Date
          ? design.publishedAt.toISOString()
          : new Date(design.publishedAt).toISOString()
        : new Date().toISOString(),
      createdBy: design?.createdBy || "unknown",
      updatedAt: slide.updatedAt.toISOString(),
      tags: slide.tags,
      placeholders,
      htmlUrl: design?.htmlRef
        ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}`
        : "",
    } as SlideRecord;
  });
}

export async function getTemplateById(id: string): Promise<SlideRecord | null> {
  await dbConnect();

  const slide = (await Slide.findById(id)
    .populate("designId")
    .lean()) as unknown as SlideWithDesign | null;

  if (!slide) return null;

  const design = slide.designId;

  const placeholders = design?.placeholders || {};

  return {
    id: slide._id.toString(),
    slideId: slide._id.toString(),
    type: slide.type,
    version: design?.version?.toString() || "1.0.0",
    isLatest: design?.isLatest || true,
    publishedAt: design?.publishedAt
      ? design.publishedAt instanceof Date
        ? design.publishedAt.toISOString()
        : new Date(design.publishedAt).toISOString()
      : new Date().toISOString(),
    createdBy: design?.createdBy || "unknown",
    updatedAt: slide.updatedAt.toISOString(),
    tags: slide.tags,
    placeholders,
    htmlUrl: design?.htmlRef
      ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${design.htmlRef}`
      : "",
  } as SlideRecord;
}
