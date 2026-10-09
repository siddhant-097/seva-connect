import mongoose from 'mongoose';

const eligibilityRuleSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },       // e.g. 'age', 'income', 'state'
    operator: {
      type: String,
      enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'exists'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'AGRICULTURE',
        'EDUCATION',
        'HEALTHCARE',
        'HOUSING',
        'EMPLOYMENT',
        'ENERGY',
        'SOCIAL_WELFARE',
        'WOMEN_EMPOWERMENT',
        'FINANCIAL_INCLUSION',
        'PENSION',
        'INSURANCE',
        'SKILL_DEVELOPMENT',
        'OTHER',
      ],
      required: true,
    },
    displayName: { type: String, default: '' },
    cardCategory: { type: String, default: '' },
    audience: { type: String, default: '' },
    cardDescription: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    department: { type: String, default: '' },
    state: {
      type: String,
      default: 'ALL', // 'ALL' means central/national
    },
    benefits: { type: String, default: '' },
    eligibilityRules: [eligibilityRuleSchema],
    requiredDocuments: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        mandatory: { type: Boolean, default: true },
      },
    ],
    applicationProcess: { type: String, default: '' },
    officialUrl: { type: String, default: '' },
    sourceType: {
      type: String,
      enum: ['OFFICIAL', 'VERIFIED', 'UNVERIFIED'],
      default: 'OFFICIAL',
    },
    isActive: { type: Boolean, default: true },
    lastVerified: { type: Date, default: Date.now },
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

// Generate slug from name before saving
schemeSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Text index for search
schemeSchema.index({ name: 'text', description: 'text', benefits: 'text' });

const Scheme = mongoose.model('Scheme', schemeSchema);

export default Scheme;
