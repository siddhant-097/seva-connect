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
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { managedSchemeSchema } from '../validation/managedSchemeSchema.js';
import { listManageableSchemes, createManagedScheme, updateManagedScheme } from '../controllers/adminSchemeController.js';

const router = Router();

// Scheme management is restricted to authenticated staff roles.
router.get('/manage', authenticate, authorize('ADMIN', 'CONTENT_MANAGER'), listManageableSchemes);
router.post('/', authenticate, authorize('ADMIN', 'CONTENT_MANAGER'), validate(managedSchemeSchema), createManagedScheme);
router.put('/:schemeId', authenticate, authorize('ADMIN', 'CONTENT_MANAGER'), validate(managedSchemeSchema), updateManagedScheme);

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
