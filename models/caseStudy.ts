import mongoose, { Schema } from 'mongoose';
import { ICaseStudy } from '../types/models';

const CaseStudySchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true
  },
  tags: {
    type: [String],
    default: []
  },
  templateIds: {
    type: [Schema.Types.ObjectId],
    ref: 'Template',
    default: []
  }
}, {
  timestamps: true
});

const CaseStudy = (mongoose.models.CaseStudy as mongoose.Model<ICaseStudy>) || 
  mongoose.model<ICaseStudy>('CaseStudy', CaseStudySchema);

export default CaseStudy; 