const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
exports.findUserByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.user
      .findUnique({
        where: {
          id: parseInt(id)
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          pincode: true,
          photoURL: true,
          availability: true,
          awards: true,
          careerHistory: true,
          certifications: true,
          collaborations: true,
          culinaryPhilosophy: true,
          currentPosition: true,
          employer: true,
          eventsParticipation: true,
          expertise: true,
          ifcaInvolvement: true,
          industryContributions: true,
          interests: true,
          languageProficiency: true,
          location: true,
          mentorship: true,
          mentorshipAvailability: true,
          nationality: true,
          onlinePortfolios: true,
          preferredContact: true,
          preferredName: true,
          professionalNetworks: true,
          publications: true,
          recipes: true,
          roleDescription: true,
          socialMediaLinks: true,
          specializations: true,
          state: true,
          sustainability: true,
          technologySkills: true,
          tutorials: true,
          vision: true,
          website: true,
          unifiedUserId:true
        },
        // include:{
        //   unifiedUserId:true
        // },
      })
      .then((user) => resolve(user))
      .catch((error) => reject(error));
  });
};

exports.findCommunityByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.community
      .findUnique({
        where: { id: parseInt(id) },
        include: {
          creator: true,
        },
      })
      .then((community) => {
        if (!community) {
          reject(
            createCustomError({ status: 404, message: "community not found" })
          );
        }
        resolve(community);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findAdminByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.admin
      .findUnique({ where: { id: parseInt(id) } })
      .then((user) => {
        if (!user) {
          reject(
            createCustomError({ status: 404, message: "Admin not found" })
          );
        }
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findPartnerByIdHelper = function (partnerId) {
  return new Promise(async (resolve, reject) => {
    try {
      const unifiedUser = await prisma.unifiedUser.findFirst({
        where: { partnerId: parseInt(partnerId) },
        include: {
          partner: true,
          Community: {
            include: {
              parentCommunities: {
                include: {
                  childCommunity: true,
                },
              },
              childCommunities: {
                include: {
                  parentCommunity: true,
                },
              },
              subscriptions: {
                include: {
                  unifiedUser: true,
                },
              },
            },
          },
        },
      });

      if (!unifiedUser) {
        return reject(
          createCustomError({ status: 404, message: "Partner or Unified User not found" })
        );
      }
      resolve({
        partner: unifiedUser.partner,
        unifiedUser: {
          ...unifiedUser,
          partner: undefined,
        },
        communities: unifiedUser.Community,
      });

    } catch (err) {
      reject(err);
    }
  });
};


exports.findExpertByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.expert
      .findUnique({ where: { id: parseInt(id) } })
      .then((user) => {
        if (!user) {
          reject(
            createCustomError({ status: 404, message: "Expert not found" })
          );
        }
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findSessionByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.session
      .findUnique({
        where: { id: parseInt(id) },
        include: {
          CouponCode: true,
          resource: true,
          SessionSlot: {
            include: {
              speakers: {
                include: {
                  user: { select: { name: true, photoURL: true, email: true, id: true } },
                  admin: { select: { name: true, photoURL: true, email: true, id: true } },
                  expert: { select: { name: true, photoURL: true, email: true, id: true } },
                  partner: { select: { name: true, photoURL: true, email: true, id: true } }
                }
              }
            },
            orderBy: {
              startTime: "asc",
            },
          },
          tags: true,
        },
      })
      .then((session) => {
        if (!session) {
          reject();
          // createCustomError({ status: 404, message: "Session not found" })
        }
        resolve(session);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findTransactionByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.transaction
      .findUnique({ where: { id: parseInt(id) }, include: { user: true } })
      .then((transaction) => {
        if (!transaction) {
          reject(
            createCustomError({ status: 404, message: "Transaction not found" })
          );
        }
        resolve(transaction);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findSessionSlotByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.sessionSlot
      .findUnique({ where: { id: parseInt(id) } })
      .then((slot) => {
        if (!slot) {
          reject(
            createCustomError({
              status: 404,
              message: "Session-Slot not found",
            })
          );
        }
        resolve(slot);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findSubCommunityByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.subCommunity
      .findUnique({ where: { id: parseInt(id) } })
      .then((subcommunity) => {
        if (!subcommunity) {
          reject(
            createCustomError({
              status: 404,
              message: "subcommunity not found",
            })
          );
        }
        resolve(subcommunity);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findChannelByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.channels
      .findUnique({ where: { id: parseInt(id) } })
      .then((subcommunity) => {
        if (!subcommunity) {
          reject(
            createCustomError({ status: 404, message: "channel not found" })
          );
        }
        resolve(subcommunity);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findEventByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.event
      .findUnique({
        where: { id: parseInt(id) },
        include: {
          eventAttendance: {
            include: {
              unifiedUser: true,
            },
          },
        },
      })
      .then((event) => {
        if (!event) {
          reject(
            createCustomError({ status: 404, message: "Event not found" })
          );
        }
        resolve(event);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findPostByIdHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.post
      .findUnique({
        where: { id: parseInt(id) },
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
          childrenPosts: {
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
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      })
      .then((transaction) => {
        if (!transaction) {
          reject(createCustomError({ status: 404, message: "Post not found" }));
        }
        resolve(transaction);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findPostByIdHelperLite = function (id) {
  return new Promise((resolve, reject) => {
    prisma.post
      .findUnique({ where: { id: parseInt(id) } })
      .then((transaction) => {
        if (!transaction) {
          reject(createCustomError({ status: 404, message: "Post not found" }));
        }
        resolve(transaction);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findBlogByIdHelperLite = function (id) {
  return new Promise((resolve, reject) => {
    prisma.blog
      .findUnique({ where: { id } })
      .then((transaction) => {
        if (!transaction) {
          reject(createCustomError({ status: 404, message: "Blog not found" }));
        }
        resolve(transaction);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findUnifiedUserByIdHelperLite = function (id) {
  return new Promise((resolve, reject) => {
    prisma.unifiedUser
      .findUnique({ where: { id: parseInt(id) } })
      .then((transaction) => {
        if (!transaction) {
          reject(createCustomError({ status: 404, message: "User not found" }));
        }
        resolve(transaction);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.findCouponCodeById = function (code) {
  return new Promise((resolve, reject) => {
    prisma.couponCode
      .findUnique({ where: { code } })
      .then((transaction) => {
        if (!transaction) {
          reject(
            createCustomError({ status: 404, message: "Coupon not found" })
          );
        }
        resolve(transaction);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
