import { Router } from 'express';
import {
  chat,
  getAIStatus,
  getSchemeRecommendationsHandler,
  explainSchemeHandler,
  explainEligibilityHandler,
  explainDocumentHandler,
  getConversations,
  getConversation,
  deleteConversation,
} from '../controllers/aiController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const chatSchema = z.object({
  conversationId: z.string().optional(),
  selectedSchemeId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(3000),
  language: z.enum(['en', 'hi', 'hinglish']).optional().default('en'),
  profile: z.record(z.any()).optional(),
});

const recommendationProfileSchema = z.object({
  state: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  residenceType: z.string().optional(),
  annualFamilyIncome: z.number().optional(),
  occupation: z.string().optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS', '']).optional(),
  educationLevel: z.string().optional(),
  incomeRange: z.string().optional(),
  farmerLandAccess: z.string().optional(),
  farmerLandSize: z.string().optional(),
  businessStage: z.string().optional(),
  businessType: z.string().optional(),
  isFarmer: z.boolean().optional(),
  isStudent: z.boolean().optional(),
}).strict();

const recommendationSchema = z.object({
  profile: recommendationProfileSchema.optional(),
}).strict();

// AI Status (reports active provider, open-source status, and free key instructions)
router.get('/status', getAIStatus);
router.post('/recommendations', validate(recommendationSchema), getSchemeRecommendationsHandler);

// Chat: allows optionalAuth so both registered users and guest citizens can chat
router.post('/chat', optionalAuth, validate(chatSchema), chat);

// AI Explainers
router.post('/explain-scheme', optionalAuth, explainSchemeHandler);
router.post('/explain-eligibility', optionalAuth, explainEligibilityHandler);
router.post('/explain-document', optionalAuth, explainDocumentHandler);

// Authenticated conversation management
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:conversationId', authenticate, getConversation);
router.delete('/conversations/:conversationId', authenticate, deleteConversation);

export default router;
