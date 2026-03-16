const express = require("express");
const router = express.Router();
const notif = require("./chatnotifications.controller"); // Replace with the actual path to your controller file

// Route for creating a new form
router.post("/notif", notif.createNotification);

// Route for fetching all forms
router.get("/getnotifs", notif.getAllNotifications);

router.get("/notifications/:id", notif.getNotificationById);
// Route for fetching all users
router.get("/users", notif.getAllUsers);

module.exports = router;
