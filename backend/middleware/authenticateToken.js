const jwt = require("jsonwebtoken");

exports.authenticateTokenUser = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      return res.status(403).json({ message: "Invalid/Expired token" });
    }

    if (user) {
      // only allow access if user is an admin or partner
      if (user.userType !== "user" && user.userType!== "admin") {
        return res.status(403).json({ message: "Not Authorized" });
      }
      req.user = user;
      next();
    }
  });
};

exports.authenticateToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      return res.status(403).json({ message: "Invalid/Expired token" });
    }
    console.log("🔐 Decoded JWT user:", user); 
    if (user) {
      // allow access for all kinds of users
      req.user = user;
      next();
    }
  });
};

exports.authenticateTokenWithoutReject = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      // return res.status(403).json({ message: "Invalid/Expired token" });
      next();
    }

    if (user) {
      // allow access for all kinds of users
      req.user = user;
      next();
    }
  });
};
exports.authenticateTokenAdmin = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      return res.status(403).json({ message: "Invalid/Expired token" });
    }

    if (user) {
      // only allow access if user is an admin or partner
      if (!["admin", "superadmin"].find((item) => item === user.userType)) {
        return res.status(403).json({ message: "Not Authorizedxx" });
      }
      req.user = user;
      next();
    }
  });
};

exports.authenticateTokenPartner = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      return res.status(403).json({ message: "Invalid/Expired token" });
    }

    if (user) {
      // only allow access if user is an admin or partner  user.userType !== "partner"
      if (
        !["partner", "admin", "superAdmin"].find(
          (item) => item === user.userType
        )
      ) {
        return res.status(403).json({ message: "Not Authorized" });
      }
      req.user = user;
      next();
    }
  });
};

exports.authenticateTokenExpert = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      return res.status(403).json({ message: "Invalid/Expired token" });
    }

    if (user) {
      // only allow access if user is an admin or partner
      if (
        !["admin", "superadmin", "expert"].find(
          (item) => item === user.userType
        )
      ) {
        return res.status(403).json({ message: "Not Authorized" });
      }
      req.user = user;
      next();
    }
  });
};

exports.authenticateTokenSuperAdmin = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Not Authorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Refresh token required");
      }
      //if token malformed, unAuthorized
      return res.status(403).json({ message: "Invalid/Expired token" });
    }

    if (user) {
      // only allow access if user is an admin or partner
      if (user.userType !== "superadmin") {
        return res.status(403).json({ message: "Not Authorized" });
      }
      req.user = user;
      next();
    }
  });
};
