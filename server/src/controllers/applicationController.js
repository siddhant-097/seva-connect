import Application from '../models/Application.js';
import Scheme from '../models/Scheme.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Allowed status transitions
const VALID_TRANSITIONS = {
  DISCOVERED: ['ELIGIBILITY_CHECKED'],
  ELIGIBILITY_CHECKED: ['DOCUMENTS_READY'],
  DOCUMENTS_READY: ['APPLICATION_SUBMITTED'],
  APPLICATION_SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'ACTION_REQUIRED'],
  ACTION_REQUIRED: ['UNDER_REVIEW', 'APPLICATION_SUBMITTED'],
};

/**
 * GET /api/v1/users/me/applications
 */
export const getApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('scheme', 'name category department')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, { applications });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/applications
 */
export const createApplication = async (req, res, next) => {
  try {
    const { schemeId } = req.body;

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return sendError(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
    }

    // Check for duplicate
    const existing = await Application.findOne({ user: req.user._id, scheme: schemeId });
    if (existing) {
      return sendError(res, 409, 'APPLICATION_EXISTS', 'You already have an application for this scheme.');
    }

    const application = await Application.create({
      user: req.user._id,
      scheme: schemeId,
      status: 'DISCOVERED',
      events: [{ status: 'DISCOVERED', note: 'Application initiated.' }],
    });

    return sendSuccess(res, { application }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/me/applications/:applicationId
 */
export const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.applicationId,
      user: req.user._id, // ownership check
    }).populate('scheme');

    if (!application) {
      return sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    }

    return sendSuccess(res, { application });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me/applications/:applicationId
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const application = await Application.findOne({
      _id: req.params.applicationId,
      user: req.user._id,
    });

    if (!application) {
      return sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found.');
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[application.status] || [];
    if (!allowed.includes(status)) {
      return sendError(
        res, 422, 'INVALID_TRANSITION',
        `Cannot transition from ${application.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}.`
      );
    }

    application.status = status;
    application.events.push({ status, note: note || `Status changed to ${status}.` });
    await application.save();

    return sendSuccess(res, { application });
  } catch (error) {
    next(error);
  }
};
