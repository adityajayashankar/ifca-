const router=require('express').Router();
const ticket=require('./ticket.controller');

router.route('/').post(ticket.createTicket).get(ticket.getAllTickets);
router.route('/:id').patch(ticket.updateTicket).get(ticket.getTicket);
router.route('/user/:userId').get(ticket.getUserTickets);

module.exports=router;