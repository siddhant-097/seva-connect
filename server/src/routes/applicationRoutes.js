import { Router } from 'express';
import {
  getApplications,
  createApplication,
  getApplication,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const createApplicationSchema = z.object({
  schemeId: z.string().min(1, 'Scheme ID is required'),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  note: z.string().optional(),
});

router.get('/', authenticate, getApplications);
router.post('/', authenticate, validate(createApplicationSchema), createApplication);
router.get('/:applicationId', authenticate, getApplication);
router.patch('/:applicationId', authenticate, validate(updateStatusSchema), updateApplicationStatus);

export default router;
