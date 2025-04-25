import mongoose, { Schema } from "mongoose";
import { ICollection } from "../types/models";

const CollectionSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      auto: true,
    },
    name: {
      type: String,
      required: true,
    },
    templateIds: {
      type: [Schema.Types.ObjectId],
      ref: "Template",
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    placeholders: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Collection =
  mongoose.models && "Collection" in mongoose.models
    ? mongoose.models.Collection
    : mongoose.model<ICollection>("Collection", CollectionSchema);

export default Collection;
