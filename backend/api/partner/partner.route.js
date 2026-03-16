const router = require('express').Router();
const { authenticateToken, authenticateTokenAdmin, authenticateTokenPartner } = require('../../middleware/authenticateToken');
const partner = require('./partner.controller');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
});

// create partner:::: signup only
// router.get('/',)
router.get('/', [partner.getAllPartners]);

// Create single partner (admin only)
router.post('/', [authenticateTokenAdmin, partner.createPartner]);

// Bulk upload partners (admin only)
router.post('/bulk-upload', [authenticateTokenAdmin, upload.single('file'), partner.bulkUploadPartners]);

// Partner session routes (require partner authentication)
router.get('/sessions', [authenticateTokenPartner, partner.getAllPartnerSessions]);
router.get('/sessions/:sessionId', [authenticateTokenPartner, partner.getPartnerSessionById]);

router.route('/:id')
    .get([partner.getPartnerById])
    .patch([partner.updatePartnerById])
    .delete([partner.deletePartnerById]);

router.get('/:id/communities', [ partner.getPartnerCommunities]);
router.get('/:id/communitiesRequests', [ partner.getPartnerCommunityRequests]);

router.get('/:id/sessions', partner.getPartnerSessions); // unused
router.route("/:id/enable").patch(partner.enablePartnerById);

module.exports = router;