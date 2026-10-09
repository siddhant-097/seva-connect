import mongoose from 'mongoose';

const eligibilityResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: true,
    },
    status: {
      type: String,
      enum: ['POTENTIALLY_RELEVANT', 'NEEDS_VERIFICATION', 'NOT_CURRENTLY_MATCHED'],
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    matchedCriteria: [{ type: String }],
    failedCriteria: [{ type: String }],
    needsVerification: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index to prevent duplicate checks
eligibilityResultSchema.index({ user: 1, scheme: 1 }, { unique: true });

const EligibilityResult = mongoose.model('EligibilityResult', eligibilityResultSchema);

export default EligibilityResult;
