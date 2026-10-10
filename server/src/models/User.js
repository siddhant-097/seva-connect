import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ['CITIZEN', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT_AGENT'],
      default: 'CITIZEN',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profile: {
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER', ''],
        default: '',
      },
      state: { type: String, default: '' },
      district: { type: String, default: '' },
      residenceType: {
        type: String,
        enum: ['URBAN', 'RURAL', ''],
        default: '',
      },
      annualFamilyIncome: { type: Number, default: 0 },
      occupation: { type: String, default: '' },
      category: {
        type: String,
        enum: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', ''],
        default: '',
      },
      householdSize: { type: Number, default: 1 },
      isStudent: { type: Boolean, default: false },
      isFarmer: { type: Boolean, default: false },
      educationLevel: { type: String, default: '' },
      incomeRange: { type: String, default: '' },
      farmerLandAccess: { type: String, default: '' },
      farmerLandSize: { type: String, default: '' },
      businessStage: { type: String, default: '' },
      businessType: { type: String, default: '' },
    },
    savedSchemes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
      },
    ],
    refreshToken: {
      type: String,
      select: false, // never returned
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain text password with hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
