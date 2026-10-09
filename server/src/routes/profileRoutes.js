import { Router } from 'express';
import { getProfile, updateProfile, updateUser } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const profileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  residenceType: z.enum(['URBAN', 'RURAL', '']).optional(),
  annualFamilyIncome: z.number().min(0).optional(),
  occupation: z.string().optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS', '']).optional(),
  householdSize: z.number().min(1).optional(),
  isStudent: z.boolean().optional(),
  isFarmer: z.boolean().optional(),
}).strict();

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
}).strict();

router.get('/me/profile', authenticate, getProfile);
router.put('/me/profile', authenticate, validate(profileSchema), updateProfile);
router.patch('/me', authenticate, validate(userUpdateSchema), updateUser);

export default router;
