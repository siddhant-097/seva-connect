import { Router } from 'express';
import {
  getSchemes,
  getSchemeById,
  getSchemeDocuments,
  saveScheme,
  unsaveScheme,
  getSavedSchemes,
} from '../controllers/schemeController.js';
import { checkSchemeEligibility } from '../controllers/eligibilityController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public-ish scheme browsing (optionalAuth for personalization)
router.get('/', optionalAuth, getSchemes);
router.get('/:schemeId', optionalAuth, getSchemeById);
router.get('/:schemeId/documents', getSchemeDocuments);

// Authenticated
router.get('/:schemeId/eligibility', authenticate, checkSchemeEligibility);
router.post('/:schemeId/save', authenticate, saveScheme);
router.delete('/:schemeId/save', authenticate, unsaveScheme);

export default router;

// Separate export for saved schemes (mounted on /users)
export { getSavedSchemes };
