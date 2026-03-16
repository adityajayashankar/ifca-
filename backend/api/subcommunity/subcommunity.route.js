const router=require('express').Router();
const subcommunity=require('./subcommunity.controller');
const {authenticateTokenPartner, authenticateToken}=require('../../middleware/authenticateToken')
router.route('/')
.post([authenticateTokenPartner,subcommunity.createSubcommunity]);

router.route('/search')
.get(subcommunity.getSubcommunitiesByTag);

router.route('/:subcommunityId')
.get(subcommunity.getSubCommunityById)
.patch([authenticateTokenPartner,subcommunity.updateSubCommunityById])
.delete([authenticateTokenPartner,subcommunity.deleteSubCommunityById]);

router.route('/:subcommunityId/people')
.get(subcommunity.getPeople)
.post([authenticateToken,subcommunity.addPeopletoSubcommunityBulk])
.patch([authenticateToken,subcommunity.addPeopletoSubcommunity]);


router.route('/community/:communityId')
.get(subcommunity.getSubcommunitiesByCommunityId);


module.exports=router;