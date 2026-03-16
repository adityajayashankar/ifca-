const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = require("express").Router();

// GET ALL TAGS - /
router.route("/").get(async (req, res, next) => {
  const tags = await prisma.tag.findMany({});
  return res.status(200).json({ tags });
});

module.exports = router;
// GET POSTS BY TAGS - ?post=true
// GET BLOGS BY TAGS - ?blog=true
// GET SESSIONS BY TAGS - ?session=true
// GET COMMUNITIES BY TAGS - ?community=true
