import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    intent: { type: String, default: '' },
    sources: [
      {
        title: { type: String, default: '' },
        schemeId: { type: String, default: '' },
        sourceType: { type: String, default: 'OFFICIAL' },
      },
    ],
  },
  { timestamps: true, _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
      default: '',
    },
    title: {
      type: String,
      default: 'New Conversation',
    },
    messages: [messageSchema],
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish'],
      default: 'en',
    },
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

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
