const express = require("express");
const router = express.Router();
const formController = require("./forms.controller");
const { authenticateToken, authenticateTokenAdmin } = require("../../middleware/authenticateToken");

// ========================================
// FORM MANAGEMENT ROUTES (Admin Only)
// ========================================

// Create a new form
router.post("/", authenticateToken, formController.createForm);

// Edit a form
router.put("/:formId", authenticateTokenAdmin, formController.editForm);

// Delete a form
router.delete("/:formId", authenticateTokenAdmin, formController.deleteForm);

// Update form by creator
router.put('/:formId/update', authenticateTokenAdmin, formController.updateFormByCreator);

// ========================================
// FORM RESPONSE ROUTES (Authenticated) - MUST BE BEFORE /:formId
// ========================================

// Get user's form response status (requires authentication)
router.get('/user-response-status', authenticateToken, formController.getUserFormResponseStatus);

// Get form responses for specific user
router.get('/form/form-responses', formController.getFormResponsesForUser);

// Get form responses by creator ID (with pagination)
router.get('/responses/:creatorId', authenticateToken, formController.getFormResponsesByCreatorId);

// Get questions by creator ID (with pagination)
router.get('/questions/:creatorId', authenticateToken, formController.getQuestionsByCreatorId);

// Get form responses by form ID (with pagination)
router.get('/responseByFormId/:formId', authenticateToken, formController.getFormResponsesById);

// Submit form response (requires authentication)
router.post('/:formId/submit', authenticateToken, formController.submitFormResponse);

// ========================================
// FORM RETRIEVAL ROUTES (Optimized with Pagination)
// ========================================

// Get all forms (with pagination, search, filtering)
router.get("/", formController.getAllForms);

// Get forms by user ID (with pagination)
router.get("/user/:id", formController.getAllFormsByUserId);

// Get forms by community ID (with pagination)
router.get('/community/:communityId', formController.getFormsByCommunityId);

// Get all users (with pagination and search)
router.get("/users", authenticateToken, formController.getAllUsers);

// Get form by ID - MUST BE LAST to avoid catching other routes
router.get("/:formId", formController.getFormById);

// ========================================
// GOOGLE INTEGRATION ROUTES (Commented out)
// ========================================

// Route for fetching Google Form responses
// router.get("/form-responses", formController.fetchFormResponses);

// Route for fetching Google Sheets data
// router.get("/sheet-data", formController.fetchSheetData);

// Route for Google OAuth authorization
// router.get("/authorize", formController.authorizeApp);

// Route for Google OAuth callback
// router.get("/oauth2callback", formController.oauth2Callback);

module.exports = router;
