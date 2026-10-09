import mongoose from 'mongoose';
import Scheme from '../models/Scheme.js';
import { isDBConnected } from '../config/db.js';
import { sendError, sendSuccess } from '../utils/response.js';

const unavailable = (res) => sendError(res, 503, 'DATABASE_UNAVAILABLE', 'Scheme management requires a live database connection.');

export const listManageableSchemes = async (req, res, next) => {
  if (!isDBConnected) return unavailable(res);
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filter = { displayOrder: { $gt: 0 } };
    const q = String(req.query.q || '').trim();
    if (q) {
      const matcher = new RegExp(escapeRegex(q), 'i');
      filter.$or = [
        { name: matcher }, { displayName: matcher }, { department: matcher }, { state: matcher },
      ];
    }
    const [schemes, total] = await Promise.all([
      Scheme.find(filter)
        .select('name displayName category cardCategory state sourceType isActive displayOrder')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Scheme.countDocuments(filter),
    ]);
    return sendSuccess(res, {
      schemes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
