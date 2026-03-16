const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
const {
  findTransactionByIdHelper,
  findUserByIdHelper,
  findCommunityByIdHelper,
  findCouponCodeById,
  findExpertByIdHelper,
  findPartnerByIdHelper,
} = require("../services/getById");
const { getActiveSubscription } = require("./payment.service");

exports.createTransaction = async function (req, res, next) {
  let { userId, amount, transactionId, paymentId, couponCode } = req.body;
  try {
    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.couponCode.findUnique({
        where: { code: couponCode },
      });
      discount = coupon.discountRate;
    }
    amount = amount - (discount * amount) / 100;
    const transaction = await prisma.transaction.create({
      data: { userId, amount, transactionId, paymentId },
    });
    return res.status(201).json({ transaction });
  } catch (err) {
    console.log(`Error while creating Transaction @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

//view transaction
exports.viewTransactionById = async function (req, res, next) {
  const { id } = req.params;
  try {
    const transaction = await findTransactionByIdHelper(id);
    return res.status(200).json({ transaction });
  } catch (err) {
    console.log(`Error while fetching Transaction: ${id} @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

// delete transaction
exports.deleteTransactionById = async function (req, res, next) {
  const { id } = req.params;
  try {
    await findTransactionByIdHelper(id);
    const transaction = await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ transaction });
  } catch (err) {
    console.log(`Error while Deleting Transaction: ${id} @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

// view all transactions
exports.viewAllTransactions = async function (req, res, next) {
  try {
    const transactions = await prisma.transaction.findMany({});
    return res.status(200).json({ transactions });
  } catch (err) {
    console.log(`Error while fetching Transactions @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

// CATEGORY: for senior-central
exports.createSubscription = async function (req, res, next) {
  let { communityId, userId, } = req.body;
  let amount = 0; // Placeholder for amount logic

  try {
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userId },
    });
    const community = await findCommunityByIdHelper(communityId);

    if (!user || !community) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or community.",
      });
    }

    let now = new Date();
    const subObject = {
      startsAt: new Date(),
      expiresAt: new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      ),
    };

    // Create Subscription
    await prisma.subscription.create({
      data: {
        ...subObject,
        community: { connect: { id: communityId } },
        unifiedUser: { connect: { id: userId } },
        transaction: {
          create: {
            amount,
            transactionId: `trans-${Date.now()}`,
            paymentId: `paym-${Date.now()}`,
          },
        },
      },
    });

    return res.status(200).json({ success: true, message: "Subscription created successfully." });
  } catch (err) {
    console.log(`Error while creating Subscription @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

exports.viewAllSubscriptions = async function (req, res, next) {
  try {
    const allsubscriptions = await prisma.subscription.findMany({
      include: { community: true, user: true },
    });
    return res.status(200).json({ subscription: allsubscriptions });
  } catch (err) {
    console.log(`Error while fetching all subscriptions @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

exports.viewSubscriptionById = async function (req, res, next) {
  const { id } = req.params;
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ subscription });
  } catch (err) {
    console.log(`Error while fetching Subscription: ${id} @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

// delete a subscription
exports.deleteSubscriptionById = async function (req, res, next) {
  const { id } = req.params;
  try {
    const subscription = await prisma.subscription.delete({
      where: { id: parseInt(id) },
    });
    return res.status(202).json({ subscription });
  } catch (err) {
    console.log(`Error while deleting Subscription: ${id} @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

exports.createPayment = async function (req, res, next) {
  const {
    userId,
    expertId,
    communityId,
    expiresAt,
    amount,
    transactionId,
    paymentId,
    category,
    startsAt,
  } = req.body;

  try {
    let transactionObject = { amount, transactionId, paymentId };
    const user = userId
      ? await findUserByIdHelper(userId)
      : await findExpertByIdHelper(expertId);
    const community = await findCommunityByIdHelper(communityId);
    console.log(user);
    if (amount !== community.price) {
      throw createCustomError({ status: 400, message: "Invalid amount" });
    }
    const activeSubscription = await getActiveSubscription(
      userId,
      expertId,
      community.id
    );
    // let aax = await prisma.subscription.findUnique({
    //   where: {
    //     userId_expertId_communityId: {
    //       userId: user.id,
    //       communityId: community.id,

    //     },
    //   },
    // });
    // contains subscription info if it is valid
    // return error if valid
    let subObject = { expiresAt, category, startsAt };

    if (!activeSubscription.status) {
      const subscription = await prisma.subscription.update({
        where: {
          id: activeSubscription.id,
        },
        data: {
          ...subObject,
          transaction: {
            create: {
              ...transactionObject,
              user: { connect: { id: user.id } },
            },
          },
        },
      });
      return res.status(200).json({ subscription });
    } else {
      const subscription = userId
        ? await prisma.subscription.create({
          data: {
            ...subObject,
            community: {
              connect: {
                id: communityId,
              },
            },
            user: {
              connect: {
                id: userId,
              },
            },
            transaction: {
              create: transactionObject,
            },
          },
        })
        : await prisma.subscription.create({
          data: {
            ...subObject,
            community: {
              connect: {
                id: communityId,
              },
            },
            expert: {
              connect: {
                id: expertId,
              },
            },
            transaction: {
              create: transactionObject,
            },
          },
        });
      return res.status(200).json({ subscription });
    }
  } catch (err) {
    console.log(
      `Error while processing payment for: ${userId} @ ${__filename}`
    );
    console.log(err);
    next(err);
  }
};

// req.body={transactionId,paymentId,communityId,startsAt,expiresAt, amount, category, users:[{email,name,phoneNumber,type=["expert","user"]}]}
exports.createSubscriptionBulk = async function (req, res, next) {
  // map: for each user create Payment
  const {
    users,
    communityId,
    expiresAt,
    amount,
    transactionId,
    paymentId,
    category,
    startsAt,
  } = req.body;
  try {
    let transactionObject = { amount, transactionId, paymentId };
    let subObject = { expiresAt, category, startsAt };
    let promises = [];
    if (!users) {
      throw createCustomError({ status: 400, message: "Users not mentioned" });
    }
    let existingSubscriptions = await prisma.subscription.findMany({
      where: {
        communityId: parseInt(communityId),
      },
      include: {
        user: true,
        expert: true,
      },
    });
    let existing_sub_map = {};
    let today = new Date();
    existingSubscriptions.map((item) => {
      if (item.userId) {
        existing_sub_map[item.user.email] = {
          expiresAt: item.expiresAt,
          type: "user",
          id: item.userId,
        };
      } else {
        existing_sub_map[item.expert.email] = {
          expiresAt: item.expiresAt,
          type: "expert",
          id: item.expertId,
        };
      }
    });

    // problem: if the user already has subscription
    users
      .filter((item) => item.role === "user")
      .forEach((usert) => {
        if (!existing_sub_map[usert.email]) {
          promises.push(
            prisma.subscription.create({
              data: {
                ...subObject,
                community: {
                  connect: {
                    id: communityId,
                  },
                },
                user: {
                  connect: {
                    email: usert.email,
                  },
                },
                transaction: {
                  create: {
                    ...transactionObject,
                    user: { connect: { email: usert.email } },
                  },
                },
              },
            })
          );
        } else if (
          new Date(expiresAt) >
          new Date(existing_sub_map[usert.email].expiresAt)
        ) {
          promises.push(
            prisma.subscription.update({
              where: {
                userId_expertId_communityId: {
                  userId: existing_sub_map[usert.email].id,
                  communityId,
                },
              },
              data: {
                ...subObject,
                transaction: {
                  create: {
                    ...transactionObject,
                    user: { connect: { email: usert.email } },
                  },
                },
              },
            })
          );
        }
      });

    users
      .filter((item) => item.role === "expert")
      .forEach((usert) => {
        if (!existing_sub_map[usert.email]) {
          promises.push(
            prisma.subscription.create({
              data: {
                ...subObject,
                community: {
                  connect: {
                    id: communityId,
                  },
                },
                expert: {
                  connect: {
                    email: usert.email,
                  },
                },
                transaction: {
                  create: {
                    ...transactionObject,
                    expert: {
                      connect: {
                        email: usert.email,
                      },
                    },
                  },
                },
              },
            })
          );
        } else if (
          new Date(expiresAt) >
          new Date(existing_sub_map[usert.email].expiresAt)
        ) {
          promises.push(
            prisma.subscription.update({
              where: {
                userId_expertId_communityId: {
                  expertId: existing_sub_map[usert.email].id,
                  communityId,
                },
              },
              data: {
                ...subObject,
                transaction: {
                  create: {
                    ...transactionObject,
                    expert: { connect: { email: usert.email } },
                  },
                },
              },
            })
          );
        }
      });
    const subs = await prisma.$transaction([...promises]);
    return res.status(200).json(subs);
  } catch (err) {
    console.log(`Error while creating bulk subscription @ ${__filename}`);
    console.log(err);
    next(err);
  }
};
