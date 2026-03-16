const router=require('express').Router();
const wallet=require('./wallet.controller');

router.route('/').post(wallet.createWallet);
router.route('/:userId').patch(wallet.updateWallet).get(wallet.getWallet);

module.exports=router;