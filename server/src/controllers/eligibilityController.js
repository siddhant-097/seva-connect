import Scheme from '../models/Scheme.js';
import EligibilityResult from '../models/EligibilityResult.js';
import { evaluateEligibility, evaluateMultipleSchemes } from '../services/eligibility/eligibilityEngine.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/v1/schemes/:schemeId/eligibility
 * Returns deterministic eligibility evaluation for the authenticated user.
 */
export const checkSchemeEligibility = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.schemeId);
    if (!scheme) {
      return sendError(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
    }

    const profile = req.user.profile ? (req.user.profile.toObject ? req.user.profile.toObject() : req.user.profile) : {};
    const result = evaluateEligibility(profile, scheme);

    // Upsert eligibility result
    await EligibilityResult.findOneAndUpdate(
      { user: req.user._id, scheme: scheme._id },
      {
        user: req.user._id,
        scheme: scheme._id,
        ...result,
      },
      { upsert: true, new: true }
    );

    return sendSuccess(res, { eligibility: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/recommendations/run
 * Runs the eligibility engine against all active schemes for the user.
 */
export const runRecommendations = async (req, res, next) => {
  try {
    const profile = req.user.profile ? (req.user.profile.toObject ? req.user.profile.toObject() : req.user.profile) : {};
    const schemes = await Scheme.find({ isActive: true });

    const recommendations = evaluateMultipleSchemes(profile, schemes);

    // Persist results
    const ops = recommendations.map((r) => ({
      updateOne: {
        filter: { user: req.user._id, scheme: r.schemeId },
        update: {
          user: req.user._id,
          scheme: r.schemeId,
          status: r.status,
          score: r.score,
          matchedCriteria: r.matchedCriteria,
          failedCriteria: r.failedCriteria,
          needsVerification: r.needsVerification,
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await EligibilityResult.bulkWrite(ops);
    }

    return sendSuccess(res, { recommendations });
  } catch (error) {
    next(error);
  }
};
