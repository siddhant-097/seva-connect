import mongoose from 'mongoose';

const applicationEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
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
      enum: [
        'DISCOVERED',
        'ELIGIBILITY_CHECKED',
        'DOCUMENTS_READY',
        'APPLICATION_SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'ACTION_REQUIRED',
      ],
      default: 'DISCOVERED',
    },
    events: [applicationEventSchema],
    notes: { type: String, default: '' },
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

const Application = mongoose.model('Application', applicationSchema);

export default Application;
