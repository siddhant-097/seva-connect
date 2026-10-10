import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/v1/users/me/profile
 */
export const getProfile = async (req, res) => {
  return sendSuccess(res, {
    profile: req.user.profile || {},
  });
};

/**
 * PUT /api/v1/users/me/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'dateOfBirth', 'gender', 'state', 'district', 'residenceType',
      'annualFamilyIncome', 'occupation', 'category', 'householdSize',
      'isStudent', 'isFarmer', 'educationLevel', 'incomeRange',
      'farmerLandAccess', 'farmerLandSize', 'businessStage', 'businessType',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[`profile.${field}`] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found.');
    }

    return sendSuccess(res, { profile: user.profile });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me
 */
export const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['name'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found.');
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};
