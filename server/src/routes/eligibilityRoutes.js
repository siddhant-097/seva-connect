import { Router } from 'express';
import { runRecommendations } from '../controllers/eligibilityController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/run', authenticate, runRecommendations);

export default router;
