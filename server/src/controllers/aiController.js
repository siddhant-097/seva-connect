import * as aiService from '../services/ai/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * POST /api/v1/ai/chat
 */
export const chat = async (req, res, next) => {
  try {
    const { conversationId, selectedSchemeId, message, language, profile } = req.body;

    if (!message || message.trim().length === 0) {
      return sendError(res, 400, 'EMPTY_MESSAGE', 'Message cannot be empty.');
    }

    const result = await aiService.processChat({
      user: req.user || null,
      profile: profile || null,
      conversationId,
      selectedSchemeId,
      message: message.trim(),
      language: language || 'en',
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/status
 * Returns active model, provider, open source status, and setup instructions
 */
export const getAIStatus = async (_req, res, next) => {
  try {
    const info = aiService.getAIStatusInfo();
    return sendSuccess(res, info);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/recommendations
 * Return profile-based scheme suggestions without requiring a chat message.
 */
export const getSchemeRecommendationsHandler = async (req, res, next) => {
  try {
    const result = await aiService.getSchemeRecommendations(req.body.profile || {});
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/explain-scheme
 */
export const explainSchemeHandler = async (req, res, next) => {
  try {
    const { schemeId, language } = req.body;
    if (!schemeId) {
      return sendError(res, 400, 'SCHEME_ID_REQUIRED', 'schemeId is required.');
    }
    const result = await aiService.explainScheme({
      schemeId,
      language,
      user: req.user,
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/explain-eligibility
 */
export const explainEligibilityHandler = async (req, res, next) => {
  try {
    const { schemeId } = req.body;
    if (!schemeId) {
      return sendError(res, 400, 'SCHEME_ID_REQUIRED', 'schemeId is required.');
    }
    const result = await aiService.explainEligibility({
      schemeId,
      user: req.user,
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/explain-document
 */
export const explainDocumentHandler = async (req, res, next) => {
  try {
    const { documentName, language } = req.body;
    if (!documentName) {
      return sendError(res, 400, 'DOCUMENT_NAME_REQUIRED', 'documentName is required.');
    }
    const result = await aiService.explainDocument({
      documentName,
      language,
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await aiService.getConversations(req.user._id);
    return sendSuccess(res, { conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/conversations/:conversationId
 */
export const getConversation = async (req, res, next) => {
  try {
    const conversation = await aiService.getConversation(req.user._id, req.params.conversationId);
    if (!conversation) {
      return sendError(res, 404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
    }
    return sendSuccess(res, { conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/ai/conversations/:conversationId
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const result = await aiService.deleteConversation(req.user._id, req.params.conversationId);
    if (!result) {
      return sendError(res, 404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
    }
    return sendSuccess(res, { message: 'Conversation deleted.' });
  } catch (error) {
    next(error);
  }
};
