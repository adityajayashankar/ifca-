const router = require("express").Router();
const expert = require("./expert.controller");
const { authenticateToken } = require("../../middleware/authenticateToken");
const multer = require("multer");

// Configure multer for Excel file uploads only (for bulk upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed for bulk upload'), false);
    }
  }
});

// Middleware to check if user is admin or partner
const checkAdminOrPartner = (req, res, next) => {
  const userType = req.user?.userType;
  if (userType === 'admin' || userType === 'partner') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Only admins and partners can create experts.' });
  }
};

router
  .route("/")
  .post([authenticateToken, checkAdminOrPartner, expert.createExpert])
  .get(expert.getAllExperts);

// Bulk upload route - only for Excel files
router
  .route("/bulk-upload")
  .post([authenticateToken, checkAdminOrPartner, upload.single('file'), expert.bulkUploadExperts]);

router.route("/search").get(expert.getExpertByTag);

router
  .route("/:id")
  .get(expert.getExpertById)
  .patch([authenticateToken, expert.updateExpertById])
  .delete([authenticateToken, expert.deleteExpertById]);

router.route("/:id/sessions").get(expert.getExpertSessions);
router.route("/:id/stats").get(expert.getExpertStats);

router
  .route("/:id/community")
  .get([expert.getExpertCommunities]);

router.route("/:id/subscription").post(expert.createPaymentExpert);
router.route("/:id/enable").patch([authenticateToken, expert.enableExpertById]);

// router.route("/search/:search").get(expert.getExpertByName)

module.exports = router;
