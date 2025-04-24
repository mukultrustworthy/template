import dbConnect from "@/lib/mongodb";
import { Template } from "@/models";
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
  htmlUrl?: string;
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
  templateId?: string;
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
) {
  await dbConnect();

  const templates = (await Template.find({ type })
    .lean());

  return templates;
}

export async function getTemplateById(
  id: string
): Promise<TemplateRecord | null> {
  await dbConnect();

  const template = await Template.findById(id).lean();

  if (!template) return null;

  return {
    _id: template._id.toString(),
    htmlRef: template.htmlRef || "",
    type: template.type,
    version: template.version || 1,
    isLatest: template.isLatest || true,
    publishedAt: template.publishedAt || null,
    createdBy: template.createdBy || "unknown",
    tags: template.tags || [],
    placeholders: template.placeholders || [],
    jsonData: template.jsonData || {},
    htmlUrl: template.htmlRef
      ? `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${template.htmlRef}`
      : "",
    name: template.name,
    parentId: template.parentId ? template.parentId.toString() : null,
    childIds: (template.childIds || []).map(id => id.toString()),
    collectionId: template.collectionId ? template.collectionId.toString() : null,
    templateId: template._id.toString(),
  };
}

export async function updateTemplate(
  id: string,
  templateData: Partial<TemplateRequest>
): Promise<TemplateRecord | null> {
  await dbConnect();
  console.log("updateTemplate called with ID:", id);
  console.log("templateData:", JSON.stringify({
    ...templateData,
    htmlRef: templateData.htmlRef ? `${templateData.htmlRef.substring(0, 50)}...` : undefined
  }));

  try {
    // Get the current template first
    const currentTemplate = await Template.findById(id);
    
    if (!currentTemplate) {
      console.error("Template not found with ID:", id);
      return null;
    }

    console.log("Found existing template:", {
      _id: currentTemplate._id.toString(),
      name: currentTemplate.name,
      type: currentTemplate.type
    });

    // Create update data object
    const updateData: Record<string, unknown> = { ...templateData };
    
    // Check if HTML content is being updated
    if (templateData.htmlRef && (
      !currentTemplate.htmlRef || 
      templateData.htmlRef.length > 100 || // If htmlRef is long, it's probably HTML content
      templateData.htmlRef.includes('<') // If it contains HTML tags
    )) {
      console.log("HTML content is being updated");
      // Upload the new HTML to R2
      const version = currentTemplate.version || 1;
      const filename = `${id}_v${version}.html`;
      console.log("Uploading HTML content to R2 with filename:", filename);
      
      try {
        const htmlUrl = await uploadToR2(templateData.htmlRef, filename);
        console.log("HTML uploaded successfully, URL:", htmlUrl);
        
        // Update the htmlRef to be the filename, not the content
        updateData.htmlRef = filename;
        // We could also store the URL directly if the schema supports it
        updateData.htmlUrl = htmlUrl;
      } catch (uploadError) {
        console.error("Error uploading HTML to R2:", uploadError);
        // Let the error propagate
        throw uploadError;
      }
    } else {
      console.log("HTML content not changed or is just a reference");
    }

    console.log("Final update data:", updateData);

    // Update the template in the database
    const updatedTemplate = await Template.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updatedTemplate) {
      console.error("Update operation returned null");
      return null;
    }

    console.log("Template updated successfully:", {
      _id: updatedTemplate._id.toString(),
      name: updatedTemplate.name
    });

    // Convert to TemplateRecord format
    return {
      _id: updatedTemplate._id.toString(),
      htmlRef: updatedTemplate.htmlRef || "",
      type: updatedTemplate.type,
      version: updatedTemplate.version || 1,
      isLatest: updatedTemplate.isLatest || true,
      publishedAt: updatedTemplate.publishedAt || null,
      createdBy: updatedTemplate.createdBy || "unknown",
      tags: updatedTemplate.tags || [],
      placeholders: updatedTemplate.placeholders || [],
      jsonData: updatedTemplate.jsonData || {},
      htmlUrl: `${process.env.CLOUDFLARE_R2_ASSETS_URL}/html/${updatedTemplate.htmlRef || ""}`,
      name: updatedTemplate.name,
      parentId: updatedTemplate.parentId ? updatedTemplate.parentId.toString() : null,
      childIds: (updatedTemplate.childIds || []).map(id => id.toString()),
      collectionId: updatedTemplate.collectionId ? updatedTemplate.collectionId.toString() : null,
      templateId: updatedTemplate._id.toString(),
    };
  } catch (error) {
    console.error("Error updating template:", error);
    throw error;
  }
}

export async function deleteTemplate(id: string): Promise<boolean> {
  await dbConnect();
  console.log("Deleting template with ID:", id);

  try {
    // Delete the template from the database
    const result = await Template.findByIdAndDelete(id);
    
    if (!result) {
      console.error("Template not found for deletion:", id);
      return false;
    }
    
    console.log("Template deleted successfully:", id);
    return true;
  } catch (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
}
