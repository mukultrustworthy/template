import { Document, Types } from "mongoose";

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  type: string;
  htmlRef: string;
  version: number;
  isLatest: boolean;
  publishedAt: Date | null;
  createdBy: string;
  placeholders: unknown[];
  jsonData: Record<string, unknown>;
  tags: string[];
  collectionId: Types.ObjectId | null;
  parentId: Types.ObjectId | null;
  childIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDesign extends Document {
  _id: Types.ObjectId;
  name: string;
  htmlRef: string;
  version: number;
  isLatest: boolean;
  publishedAt: Date | null;
  createdBy: string;
  updatedAt: Date;
  placeholders: Record<string, unknown>;
  createdAt: Date;
}

export interface ICaseStudy extends Document {
  _id: Types.ObjectId;
  tags: string[];
  templateIds: Types.ObjectId[] | ITemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISlide extends Document {
  _id: Types.ObjectId;
  type: string;
  tags: string[];
  designId: Types.ObjectId | IDesign;
}

export interface ICollection extends Document {
  _id: Types.ObjectId;
  name: string;
  tags: string[];
  placeholders: Record<string, unknown>;
  templateIds: Types.ObjectId[] | ITemplate[];
  createdAt: Date;
  updatedAt: Date;
}
