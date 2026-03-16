const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
const {
  findBlogByIdHelperLite,
  findUnifiedUserByIdHelperLite,
} = require("../services/getById");

// CREATE blog. private or public. with/without tags
// req.body={title,content,draft:BOOL,glance,isPrivate:BOOL,unifiedUserId:INT, communityId?, tagsData:[{id?,name}] }
exports.createBlog = async function (req, res, next) {
  let { tagsData, ...blogData } = req.body;
  try {
    let createdBlog, communityId;
    if (req.body.isPrivate) {
      // create a community connection
      createdBlog = await prisma.blog.create({
        data: {
          ...blogData,
          // community: {
          //   connect: {
          //     id: req.body.communityId,
          //   },
          // },
        },
      });

      await prisma.communityBlog.create({
        data: {
          blog: {
            connect: {
              id: createdBlog.id,
            },
          },
          community: {
            connect: {
              id: createdBlog.communityId,
            },
          },
        },
      });
    } else {
      createdBlog = await prisma.blog.create({
        data: blogData,
      });
    }
    // create tags if absent
    const promises = [];
    tagsData?.forEach((item) => {
      if (item.id) {
        promises.push(
          prisma.blogTags.create({
            data: {
              tag: {
                connect: {
                  id: item.id,
                },
              },
              blog: {
                connect: {
                  id: createdBlog.id,
                },
              },
            },
          })
        );
      } else {
        promises.push(
          prisma.blogTags.create({
            data: {
              tag: {
                create: {
                  name: item.name,
                },
              },
              blog: {
                connect: {
                  id: createdBlog.id,
                },
              },
            },
          })
        );
      }
    });
    await prisma.$transaction([...promises]);

    return res.status(201).json({ blog: createdBlog });
  } catch (error) {
    console.log(`Error occured while creating blog @ ${__filename}`);
    console.log(error);
    next(error);
  }
};
// GET ALL BLOGS
exports.getAllBlogs = async function (req, res, next) {
  try {
    const blogs = await prisma.blog.findMany({
      where: {
        AND: [
          {
            draft: false,
          },
          {
            isPrivate: false,
          },
          {
            isArchived: false,
          },
        ],
      },
      include: {
        author: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        BlogTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            BlogLikes: true,
            Post: true,
          },
        },
      },
    });
    return res.status(200).json({ blogs });
  } catch (error) {
    console.log(`Error occured while getting all blogs @ ${__filename}`);
    console.log(error);
    next(error);
  }
};
// GET COMMUNITY BLOGS
exports.getCommunityBlogs = async function (req, res, next) {
  let { communityId } = req.params;
  communityId = parseInt(communityId);
  try {
    const blogs = await prisma.communityBlog.findMany({
      where: {
        AND: [
          {
            communityId: communityId,
          },
          {
            blog: {
              isArchived: false,
            },
          },
        ],
      },
      include: {
        blog: {
          include: {
            author: {
              include: {
                user: true,
                partner: true,
                expert: true,
                admin: true,
              },
            },
            BlogTags: {
              include: {
                tag: true,
              },
            },
            _count: {
              select: {
                BlogLikes: true,
                Post: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json({ blogs: blogs?.map((item) => item.blog) });
  } catch (error) {
    console.log(
      `Error occured while getting community blogs for ${communityId} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};
// GET BLOG BY ID
exports.getBlogById = async function (req, res, next) {
  const { blogId } = req.params;
  try {
    await findBlogByIdHelperLite(blogId);

    const blog = await prisma.blog.findUnique({
      where: {
        id: blogId,
      },
      include: {
        author: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        BlogTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            BlogLikes: true,
            Post: true,
          },
        },
        BlogLikes: true,
        Post: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
            creator: {
              include: {
                user: true,
                partner: true,
                expert: true,
                admin: true,
              },
            },
            assets: true,
            likes: true,
            _count: {
              select: { childrenPosts: true },
            },
          },
        },
      },
    });
    let likes = false;
    if (req.user) {
      likes = blog.BlogLikes.find(
        (item) => item.userId === req.user.unifiedUserId.id
      );
    }

    return res.status(200).json({ blog, liked: !!likes });
  } catch (error) {
    console.log(`Error occured while getting blog ${blogId} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};
// UPDATE BLOG BY ID:req.body={ draft, isPrivate, community, content, title, isArchived}
exports.updateBlogById = async function (req, res, next) {
  const { blogId } = req.params;
  try {
    await findBlogByIdHelperLite(blogId);
    let createdBlog;
    const blogData = req.body;
    if (req.body.isPrivate) {
      createdBlog = await prisma.blog.update({
        where: {
          id: blogId,
        },
        data: {
          ...blogData,
          community: {
            connect: {
              id: blogData.communityId,
            },
          },
        },
      });
    } else {
      createdBlog = await prisma.blog.update({
        where: {
          id: blogId,
        },
        data: {
          ...blogData,
        },
      });
    }

    return res.status(200).json({ blog: createdBlog });
  } catch (error) {
    console.log(`Error occured while updating blog ${blogId} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};
// UPDATE BLOG TAGS
exports.updateBlogTags = async function (req, res, next) {
  let { blogId } = req.params;
  const { newTags } = req.body;
  try {
    if (!newTags) {
      throw createCustomError({
        status: 400,
        message: "Invalid data! Missing newTags",
      });
    }
    /*
            1. Create tags which exist
            2. Remove tags which dont exist    
        */

    const existingTags = await prisma.blogTags.findMany({
      where: {
        blogId,
      },
      include: {
        tag: true,
      },
    });
    let promises = [];
    let delete_promises = [];
    let map_tags = {};
    existingTags.forEach((item) => {
      map_tags[item.tag.name] = 1;
    });

    newTags.forEach((item) => {
      if (!map_tags[item.name]) {
        // create or connect
        if (item.id) {
          promises.push(
            prisma.blogTags.create({
              data: {
                tag: {
                  connect: {
                    id: item.id,
                  },
                },
                blog: {
                  connect: {
                    id: blogId,
                  },
                },
              },
            })
          );
        } else {
          promises.push(
            prisma.blogTags.create({
              data: {
                tag: {
                  create: {
                    name: item.name,
                  },
                },
                blog: {
                  connect: {
                    id: blogId,
                  },
                },
              },
            })
          );
        }
      } else {
        map_tags[item.name] = -1;
      }
    });

    existingTags.forEach((item) => {
      if (map_tags[item.tag.name] !== -1) {
        // delete existing tags
        delete_promises.push(
          prisma.blogTags.delete({
            where: {
              id: item.id,
            },
          })
        );
      }
    });

    const returnedResult = await prisma.$transaction([
      ...promises,
      ...delete_promises,
    ]);
    return res.status(200).json({ tags: returnedResult });
  } catch (error) {
    console.log(`Error occured while updating blog tags @ ${__filename}`);
    console.log(error);
    next(error);
  }
};
// DELETE BLOG BY ID
exports.deleteBlogById = async function (req, res, next) {
  const { blogId } = req.params;
  try {
    await findBlogByIdHelperLite(blogId);
    const blog = await prisma.blog.delete({
      where: {
        id: blogId,
      },
    });
    return res.status(200).json({ blog });
  } catch (error) {
    console.log(`Error occured while deleting blog ${blogId} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// GET BLOGS BY USER
exports.getBlogsByUser = async function (req, res, next) {
  let { userId } = req.params;
  const unifiedUserId = parseInt(userId);
  try {
    await findUnifiedUserByIdHelperLite(unifiedUserId);
    const blogs = await prisma.blog.findMany({
      where: {
        unifiedUserId: unifiedUserId,
      },
      include: {
        author: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        BlogTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            BlogLikes: true,
            Post: true,
          },
        },
      },
    });
    return res.status(200).json({ blogs });
  } catch (error) {
    console.log(`Error occured while getting all blogs @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// SUBSCRIBE COMMUNITY TO BLOG
// used to remove-and-subscribe community to blog
exports.subscribeToBlogByCommunity = async function (req, res, next) {
  let { communityId } = req.params;
  const { blogId } = req.params;
  communityId = parseInt(communityId);
  const { unsub } = req.query;
  try {
    await findBlogByIdHelperLite(blogId);
    const pre_sub = await prisma.communityBlog.findUnique({
      where: {
        blogId_communityId: {
          blogId,
          communityId,
        },
      },
    });
    if (!pre_sub) {
      if (unsub) {
        throw createCustomError({
          status: 400,
          message: "Community Has Not subscribed",
        });
      }
      const subscribe = await prisma.communityBlog.create({
        data: {
          blog: {
            connect: {
              id: blogId,
            },
          },
          community: {
            connect: {
              id: communityId,
            },
          },
        },
      });
      return res.status(200).json({ blog: subscribe });
    } else {
      if (unsub) {
        const rm = await prisma.communityBlog.delete({
          where: {
            id: pre_sub.id,
          },
        });
        return res.status(200).json({ blog: rm });
      } else {
        throw createCustomError({
          status: 400,
          message: "Community Has already subscribed to blog",
        });
      }
    }
  } catch (error) {
    console.log(
      `Error occured while subscribing community ${communityId} to blog ${blogId} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// LIKE A BLOG BY USER
exports.likeBlog = async function (req, res, next) {
  let { userId } = req.params;
  userId = parseInt(userId);
  const { blogId } = req.params;
  try {
    await findBlogByIdHelperLite(blogId);
    const pre_like = await prisma.blogLikes.findUnique({
      where: {
        userId_blogId: {
          userId: userId,
          blogId,
        },
      },
      include: {
        blog: {
          select: {
            _count: {
              select: {
                BlogLikes: true,
              },
            },
          },
        },
      },
    });
    if (!pre_like) {
      const like = await prisma.blogLikes.create({
        data: {
          blogId,
          userId,
        },

        include: {
          blog: {
            select: {
              _count: {
                select: {
                  BlogLikes: true,
                },
              },
            },
          },
        },
      });
      return res.status(200).json({ like });
    } else {
      await prisma.blogLikes.delete({
        where: {
          id: pre_like.id,
        },
      });
      return res.status(200).json({ like: 0 });
    }
  } catch (error) {
    console.log(
      `Error occured while user ${userId} liking blog ${blogId} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};
