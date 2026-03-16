const { createCustomError } = require("./errorHandling");

exports.authenticateUnifiedUser = function (req, res, next) {
  let userId = req.user.unifiedUserId;
  if (!userId) {
    next(
      createCustomError({
        status: 400,
        message: "Could not find user credentials",
      })
    );
  } else {
    next();
  }
};
