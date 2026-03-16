const adminController = require('express').Router();
const sanitize = require('sanitize-html');

adminController.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('name email');
    const sanitizedUsers = users.map(user => ({
      name: sanitize(user.name),
      email: sanitize(user.email)
    }));
    res.send(sanitizedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});