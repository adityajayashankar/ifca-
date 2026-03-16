const router=require('express').Router();

const sessTier=require('./sessTier.controller');
const {authenticateTokenPartner, authenticateToken}=require('../../middleware/authenticateToken')

router.route('/')
.post([authenticateTokenPartner,sessTier.createSessionTier])
.get([authenticateToken,sessTier.getAllSessionTiers]);
router.route('/change-tier')
.get([authenticateToken,sessTier.getSessionTierByCommunityId])
.patch([authenticateTokenPartner,sessTier.updateSessionTierByCommunityId])
.delete([authenticateTokenPartner,sessTier.deleteSessionTierByCommunityId]);

module.exports=router;