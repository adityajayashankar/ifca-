const { cleanupUserReferences } = require('../api/connections/connection.controller');

// Middleware to clean up user references before deletion
exports.cleanupBeforeUserDeletion = async (req, res, next) => {
  try {
    const userId = req.params.id || req.body.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required -- ' + userId });
    }

    // Clean up references in other users' arrays
    await cleanupUserReferences(userId);
    
    // Continue with the deletion process
    next();
  } catch (error) {
    console.error('Error in user deletion middleware:', error);
    res.status(500).json({ 
      message: 'Failed to clean up user references',
      error: error.message 
    });
  }
}; 