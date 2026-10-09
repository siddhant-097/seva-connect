import mongoose from 'mongoose';
import Scheme from '../models/Scheme.js';
import { isDBConnected } from '../config/db.js';
import { sendError, sendSuccess } from '../utils/response.js';

const unavailable = (res) => sendError(res, 503, 'DATABASE_UNAVAILABLE', 'Scheme management requires a live database connection.');

export const listManageableSchemes = async (_req, res, next) => {
  if (!isDBConnected) return unavailable(res);
  try {
    const schemes = await Scheme.find({ displayOrder: { $gt: 0 } }).sort({ displayOrder: 1, createdAt: -1 });
    return sendSuccess(res, { schemes });
  } catch (error) {
    next(error);
  }
};

export const createManagedScheme = async (req, res, next) => {
  if (!isDBConnected) return unavailable(res);
  try {
    const slug = (req.body.displayName || req.body.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug) return sendError(res, 400, 'INVALID_SCHEME_NAME', 'Use an English name so the scheme can have a URL-safe identifier.');
    if (await Scheme.exists({ slug })) return sendError(res, 409, 'SCHEME_EXISTS', 'A scheme with this name already exists.');

    const lastScheme = await Scheme.findOne({ displayOrder: { $gt: 0 } }).sort({ displayOrder: -1 }).select('displayOrder');
    const scheme = await Scheme.create({ ...req.body, slug, displayOrder: (lastScheme?.displayOrder || 0) + 1 });
    return sendSuccess(res, { scheme }, 201);
  } catch (error) {
    if (error.code === 11000) return sendError(res, 409, 'SCHEME_EXISTS', 'A scheme with this name already exists.');
    next(error);
  }
};

export const updateManagedScheme = async (req, res, next) => {
  if (!isDBConnected) return unavailable(res);
  if (!mongoose.isValidObjectId(req.params.schemeId)) {
    return sendError(res, 400, 'INVALID_SCHEME_ID', 'The scheme identifier is invalid.');
  }
  try {
    const scheme = await Scheme.findOne({ _id: req.params.schemeId, displayOrder: { $gt: 0 } });
    if (!scheme) return sendError(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
    scheme.set(req.body);
    await scheme.save();
    return sendSuccess(res, { scheme });
  } catch (error) {
    next(error);
  }
};

