const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Community Controllers
// upload links of the respective community
exports.uploadResources = async function (req, res, next) {
  try {
    const comId = parseInt(req.params.comId);
    const resources = await Promise.all(
      req.body.map(async (item) => {
        return prisma.resource.create({
          data: {
            name: item.name,
            link: item.link,
            author: {
              connect: {
                id: parseInt(item.authorId),
              },
            },
            community: {
              connect: [
                {
                  id: comId,
                },
              ],
            },
          },
        });
      })
    );
    return res.status(200).json({ success: true, resources });
  } catch (e) {
    console.log(
      `Error in searching community ${req.params.comId} and uploading resource`
    );
    console.log(e);
    next(e);
    return res.status(404).json({
      success: false,
    });
  }
};

exports.editResources = async function (req, res, next) {
  // let resource = []
  // console.log(req.body);
  const comId = parseInt(req.params.comId);
  try {
    req.body.map(async (item) => {
      const resource = await prisma.resource.update({
        where: { id: item.id },
        data: {
          name: item.name,
          link: item.link,
        },
      });
    });
  } catch (e) {
    console.log(e);
    next(e);
    return res.json({ success: false });
  }
  return res.status(200).json({ success: true });

  // console.log(req.body);
};
// get all links of the respective community
exports.deleteResources = async function (req, res, next) {
  // console.log(req.body.deleteResources);
  if (req.body.deleteResources != 0) {
    try {
      const deleteArr = [];
      req.body.deleteResources.map((item) => {
        deleteArr.push(item);
      });

      deleteArr.map(async (item) => {
        // const resource = await prisma.resource.update({
        //   where: { id: item },
        //   data:{
        //     community:{
        //       disconnect:{id:parseInt(req.params.comId)}
        //     }
        //   }
        // });

        const community = await prisma.community.update({
          where: { id: parseInt(req.params.comId) },
          data: {
            resource: {
              disconnect: { id: item },
            },
          },
        });

        // if (resource.sessionId === null && resource.community.length === 0) {
        //   const delResource = await prisma.resource.delete({
        //     where: { id: resource.id },
        //   });
        // }
      });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
  return res.status(200).json({ success: true });
};
exports.getResources = async function (req, res, next) {
  const id = parseInt(req.params.comId);
  // console.log("HELLO");
  try {
    // console.log(req.params);
    const community = await prisma.community.findUnique({
      where: { id: id },
      include: {
        resource: true,
      },
    });
    return res.status(200).json({
      resources: community.resource,
    });
  } catch (e) {
    console.log(e);
    console.log(`Error in searching community ${id} and getting resource`);
    next(e);
  }
};

//Session Controllers
exports.getResourcesBySession = async function (req, res, next) {
  const id = parseInt(req.params.sessionId);
  try {
    const resources = await prisma.session.findUnique({
      where: {
        id: id,
      },
      include: {
        resource: {
          include: { community: true },
        },
      },
    });

    if (resources)
      return res.status(200).json({
        resources: resources.resource,
      });
  } catch (e) {
    console.log(e);
  }
};

//Create Resources for sessions
exports.createResourceForSession = async function (req, res, next) {
  try {
    req.body.map(async (item) => {
      // const arr = [];
      // item.comArr.map((ele) => {
      //   arr.push({ id: ele.id });
      // });
      try {
        const resource = await prisma.resource.create({
          data: {
            name: item.name,
            link: item.link,
            session: {
              connect: [{ id: parseInt(req.params.sessionId) }],
            },

            author: {
              connect: {
                id: item.authorId,
              },
            },
            // community: {
            //   connect: arr,
            // },
          },
        });
        return res.status(200).json({
          success: true,
        });
      } catch (e) {
        console.log(e);
      }
      // if (resource)
      //   return res.status(200).json({
      //     success: true,
      //   });
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

//Edit Resources in sessions
exports.editResourcesForSession = async function (req, res, next) {
  // console.log(req.body);
  try {
    req.body.map(async (item) => {
      const resource = await prisma.resource.update({
        where: { id: item.id },
        data: {
          name: item.name,
          link: item.link,
        },
      });
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

//Delete Resources in sessions
exports.deleteResourcesForSession = async function (req, res, next) {
  // console.log(req.body);
  try {
    req.body.deleteResources.map(async (item) => {
      const session = await prisma.session.update({
        where: { id: parseInt(req.params.sessionId) },
        data: {
          resource: {
            disconnect: { id: item.id },
          },
        },
      });
    });
    return res.status(200).json({
      success: true,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// get all resources of a user
exports.getAllResources = async function (req, res, next) {
  const userId = parseInt(req.params.userId);
  try {
    const resources = await prisma.resource.findMany({
      where: { authorId: userId },
      include: {
        community: true,
        session: {
          include: {
            SessionSlot: true,
            CouponCode: true,
          },
        },
      },
    });
    if (resources)
      return res.status(200).json({
        success: true,
        resources: resources,
      });
    return res.status(404).json({
      success: false,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
// create a resource
exports.createResource = async function (req, res, next) {
  try {
    const { name, link, authorId, communityArr, sessionArr, isPreSession,  isPostSession } = req.body;
    // Defensive: always arrays
    const commArr = Array.isArray(communityArr) ? communityArr.map(item => ({ id: item.id })) : [];
    const sessArr = Array.isArray(sessionArr) ? sessionArr.map(item => ({ id: item.id })) : [];
    const resource = await prisma.resource.create({
      data: {
        name: name,
        link: link,
        isPreSession:isPreSession,
        isPostSession:isPostSession,
        author: { connect: { id: authorId } },
        community: { connect: commArr },
        session: { connect: sessArr },
      },
    });
    if (resource)
      return res.status(200).json({
        success: true,
      });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
// edit resource
exports.editIdvlResource = async function (req, res, next) {
  const id = parseInt(req.params.resourceId);
  
  const {
    name,
    link,
    sessionArr,
    communityArr,
    isPreSession,
    isPostSession,
  } = req.body.data;

  try {
    // Get current resource to compare with new data
    const currentResource = await prisma.resource.findUnique({
      where: { id: id },
      include: {
        community: true,
        session: true,
      },
    });

    if (!currentResource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Prepare arrays for Prisma operations
    const newCommunityIds = communityArr ? communityArr.map(item => ({ id: item.id })) : [];
    const newSessionIds = sessionArr ? sessionArr.map(item => ({ id: item.id })) : [];
    
    const currentCommunityIds = currentResource.community.map(item => ({ id: item.id }));
    const currentSessionIds = currentResource.session.map(item => ({ id: item.id }));

    // Find communities and sessions to add/remove
    const addCommunityIds = newCommunityIds.filter(newComm => 
      !currentCommunityIds.some(currentComm => currentComm.id === newComm.id)
    );
    const removeCommunityIds = currentCommunityIds.filter(currentComm => 
      !newCommunityIds.some(newComm => newComm.id === currentComm.id)
    );

    const addSessionIds = newSessionIds.filter(newSess => 
      !currentSessionIds.some(currentSess => currentSess.id === newSess.id)
    );
    const removeSessionIds = currentSessionIds.filter(currentSess => 
      !newSessionIds.some(newSess => newSess.id === currentSess.id)
    );

    const resource = await prisma.resource.update({
      where: { id: id },
      data: {
        name: name,
        link: link,
        isPreSession: isPreSession || false,
        isPostSession: isPostSession || false,
        community: {
          connect: addCommunityIds,
          disconnect: removeCommunityIds,
        },
        session: {
          connect: addSessionIds,
          disconnect: removeSessionIds,
        },
      },
    });

    console.log("resource updated:", resource);

    if (resource)
      res.status(200).json({
        success: true,
        message: "Resource updated successfully",
      });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// delete resource
exports.deleteIdvlResource = async function (req, res, next) {
  const id = parseInt(req.params.resourceId);
  // console.log(req.params);
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: id },
      include: {
        community: true,
        session: true,
      },
    });

    const commArr = [],
      sessArr = [];
    resource.community.map((item) => {
      commArr.push({ id: item.id });
    });

    resource.session.map((item) => {
      sessArr.push({ id: item.id });
    });

    const updateResource = await prisma.resource.update({
      where: { id: id },
      data: {
        community: {
          disconnect: commArr,
        },
        session: {
          disconnect: sessArr,
        },
      },
    });
    const delResource = await prisma.resource.delete({
      where: { id: id },
    });

    if (delResource)
      return res.status(200).json({
        success: true,
      });
  } catch (e) {
    console.log(e);
  }
};

// get individual resource
exports.getIdvlResource = async function (req, res, next) {
  // console.log("SARANG");
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.resourceId) },
      include: {
        author: true,
        community: true,
        session: {
          include: { SessionSlot: true, CouponCode: true },
        },
      },
    });
    if (resource)
      return res.status(200).json({
        success: true,
        resource: resource,
      });
  } catch (e) {
    console.log(e);
  }
};

// get all resources available
exports.getAllResourcesGlobal = async function (req, res, next) {
  console.log("HELLO");
  try {
    const resources = await prisma.resource.findMany({
      include: {
        community: true,
        session: {
          include: { SessionSlot: true, CouponCode: true },
        },
      },
    });
    if (resources)
      res.status(200).json({
        success: true,
        resources: resources,
      });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// get all sessions of which the expert is part of
exports.getSessionsExpert = async function (req, res, next) {
  const id = parseInt(req.params.userId);
  try {
    const user = await prisma.unifiedUser.findUnique({
      where: { id: id },
    });
    console.log(user);
  } catch (e) {
    console.log(e);
  }
};
