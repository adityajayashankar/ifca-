const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getExpertByTagHelper = (tag) => {
  const experts = prisma.expert.findMany({
    where: {
      OR: [
        {
          name: {
            contains: tag,
            mode: "insensitive",
          },
        },
        {
          desc: {
            contains: tag,
            mode: "insensitive",
          },
        },
      ],
    },
    include: { SessionSlots: true },
  });
  return experts;
};
