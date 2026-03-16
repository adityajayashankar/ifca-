const { Prisma } = require("@prisma/client");
class customError extends Error {
  status;
  constructor({ status, message }) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

const createCustomError = ({ status, message }) => {
  return new customError({ status, message });
};

const reportError = (err, req, res, next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      if (req.path && req.path.includes('/connections')) {
        return next(err);
      }
      
      return res
        .status(400)
        .json({ status: 400, message: `Record Already Exists` });
    }

    if (err.code === "P2003" || err.code === "P2007") {
      return res.status(400).json({ status: 400, message: `Faulty Data sent` });
    }
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res
      .status(400)
      .json({ status: 500, message: "Some Error Occured at the server" });
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res
      .status(400)
      .json({ status: 400, message: `Couldnt validate faulty data` });
  }
  console.log(err.message);
  if (err instanceof customError) {
    return res
      .status(err.status)
      .json({ status: err.status, message: err.message });
  }
  return res
    .status(500)
    .json({ status: 500, message: `An unexpected error occured` });
};

module.exports = { reportError, createCustomError };
