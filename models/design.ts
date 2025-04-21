import mongoose, { Schema } from 'mongoose';
import { IDesign } from '../types/models';

const DesignSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true
  },
  name: {
    type: String,
    required: true
  },
  htmlRef: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  placeholders: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

const Design = (mongoose.models.Design as mongoose.Model<IDesign>) || 
  mongoose.model<IDesign>('Design', DesignSchema);

export default Design; 