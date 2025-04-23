import mongoose, { Schema } from "mongoose";
import { ITemplate } from "../types/models";

const TemplateSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      auto: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    htmlRef: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    isLatest: {
      type: Boolean,
      default: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },
    childIds: {
      type: [Schema.Types.ObjectId],
      ref: "Template",
      default: [],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    jsonData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      default: "current-user@example.com",
    },
    htmlUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Template =
  (mongoose.models.Template as mongoose.Model<ITemplate>) ||
  mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;
