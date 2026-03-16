const router=require('express').Router();
const payment=require('./payment.controller');

router.route('/transaction')
.post(payment.createTransaction)
.get(payment.viewAllTransactions);

router.route('/transaction/:id')
.get(payment.viewTransactionById)
.delete(payment.deleteTransactionById);

router.route('/subscription')
.post(payment.createSubscription)
.get(payment.viewAllSubscriptions);

router.route('/subscription/bulk')
.post(payment.createSubscriptionBulk);

router.route('/subscription/:id')
    .get(payment.viewSubscriptionById)
    .delete(payment.deleteSubscriptionById);

router.post('/',payment.createPayment);
// router.post('/safe',payment.createPaymentSafe);

module.exports=router;