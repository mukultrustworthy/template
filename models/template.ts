import mongoose, { Schema } from 'mongoose';
import { ITemplate } from '../types/models';

const TemplateSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true
  },
  type: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  designId: {
    type: Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  }
}, {
  timestamps: true
});

const Template = (mongoose.models.Template as mongoose.Model<ITemplate>) || 
  mongoose.model<ITemplate>('Template', TemplateSchema);

export default Template; 