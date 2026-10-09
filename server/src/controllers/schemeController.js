import * as schemeService from '../services/schemes/schemeService.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/v1/schemes
 */
export const getSchemes = async (req, res, next) => {
  try {
    const { q, category, state, page, limit } = req.query;
    const result = await schemeService.getAllSchemes({
      q,
      category,
      state,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/schemes/:schemeId
 */
export const getSchemeById = async (req, res, next) => {
  try {
    const scheme = await schemeService.getSchemeById(req.params.schemeId);
    if (!scheme) {
      return sendError(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
    }
    return sendSuccess(res, { scheme });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/schemes/:schemeId/documents
 */
export const getSchemeDocuments = async (req, res, next) => {
  try {
    const scheme = await schemeService.getSchemeById(req.params.schemeId);
    if (!scheme) {
      return sendError(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
    }
    return sendSuccess(res, { documents: scheme.requiredDocuments || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/schemes/:schemeId/save
 */
export const saveScheme = async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const scheme = await schemeService.getSchemeById(schemeId);
    if (!scheme) {
      return sendError(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
    }

    const user = await User.findById(req.user._id);
    if (!user.savedSchemes.includes(schemeId)) {
      user.savedSchemes.push(schemeId);
      await user.save();
    }

    return sendSuccess(res, { message: 'Scheme saved.' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/schemes/:schemeId/save
 */
export const unsaveScheme = async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedSchemes: schemeId },
    });
    return sendSuccess(res, { message: 'Scheme removed from saved.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/me/saved-schemes
 */
export const getSavedSchemes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('savedSchemes');
    return sendSuccess(res, { schemes: user.savedSchemes || [] });
  } catch (error) {
    next(error);
  }
};
