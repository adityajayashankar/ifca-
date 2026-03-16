const router = require("express").Router();
const blogctrl = require("./blog.controller");
const {
  authenticateTokenWithoutReject,
} = require("../../middleware/authenticateToken");
router.route("/").get(blogctrl.getAllBlogs).post(blogctrl.createBlog);

router
  .route("/:blogId")
  .get([authenticateTokenWithoutReject, blogctrl.getBlogById])
  .patch(blogctrl.updateBlogById)
  .delete(blogctrl.deleteBlogById);

router.route("/:blogId/tags").patch(blogctrl.updateBlogTags);
router
  .route("/:blogId/community/:communityId")
  .patch(blogctrl.subscribeToBlogByCommunity);

router.route("/:blogId/user/:userId").patch(blogctrl.likeBlog);

router.route("/community/:communityId").get(blogctrl.getCommunityBlogs);
router.route("/user/:userId").get(blogctrl.getBlogsByUser);
module.exports = router;
