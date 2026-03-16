const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");

exports.getActiveSubscription = function (userId, expertId, communityId) {
  return new Promise((resolve, reject) => {
    userId
      ? prisma.subscription
          .findMany({
            where: {
              userId: parseInt(userId),
              communityId: parseInt(communityId),
            },
          })
          .then((res) => {
            if (res.length === 0) {
              resolve({ status: true });
            }
            if (new Date(res[0]?.expiresAt) > new Date()) {
              reject(
                createCustomError({
                  status: 400,
                  message: "User already owns a subscription",
                })
              );
            } else {
              resolve(res[0]);
            }
          })
          .catch((err) => {
            reject(
              createCustomError({
                status: 400,
                message: "An unknown error occured",
              })
            );
            console.log(err);
          })
      : prisma.subscription
          .findMany({
            where: {
              expertId: parseInt(expertId),
              communityId: parseInt(communityId),
            },
          })
          .then((res) => {
            if (res.length === 0) {
              resolve({ status: true });
            }
            if (new Date(res[0]?.expiresAt) > new Date()) {
              reject(
                createCustomError({
                  status: 400,
                  message: "User already owns a subscription",
                })
              );
            } else {
              resolve(res[0]);
            }
          })
          .catch((err) => {
            reject(
              createCustomError({
                status: 400,
                message: "An unknown error occured",
              })
            );
            console.log(err);
          });
  });
};
