const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
exports.getPostByTagHelper = function (tag) {
  let posts = prisma.post.findMany({
    where: {
      OR: [
        {
          content: {
            contains: tag,
            mode: "insensitive",
          },
        },
        {
          title: {
            contains: tag,
            mode: "insensitive",
          },
        },
      ],
    },
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
      },
    },
  });
  return posts;
};

// userPolls:[{optionId:pollOptionsId, postId, unifiedUserId}]
const groupUserPollsByOption = function (userPolls) {
  let resultObj = {}; // key: pollOptionsId, value: _count
  userPolls?.forEach((item) => {
    if (!resultObj[item.pollOptionsId]) {
      resultObj[item.pollOptionsId] = 1;
    } else {
      resultObj[item.pollOptionsId]++;
    }
  });
  return resultObj;
};

const joinPollOptionVotes = function (votes, options) {
  let resultObj = {}; // key: optionId value:{optionId, text:option, votes}
  options?.forEach((item) => {
    resultObj[item.id] = {
      optionId: item.id,
      text: item.option,
      votes: votes[item.id] || 0,
    };
  });
  return Object.values(resultObj);
};
// returns [{optionId, votes: number of user Poll option select, text:option}]
exports.getPollVotesHelper = function (postId) {
  return new Promise((resolve, reject) => {
    prisma.post
      .findUnique({
        where: {
          id: postId,
        },
        include: {
          PollOptions: true,
          UserPollOptionSelect: true,
        },
      })
      .then((post) => {
        let votes = groupUserPollsByOption(post.UserPollOptionSelect);
        resolve(joinPollOptionVotes(votes, post.PollOptions));
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.getPollVotesHelperWithoutFind = function (post) {
  let votes = groupUserPollsByOption(post.UserPollOptionSelect);
  return joinPollOptionVotes(votes, post.PollOptions);
};
