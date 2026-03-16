const { PrismaClient } = require("@prisma/client");
const { sendEmail } = require("./sendMail");
const moment = require("moment");

const prisma = new PrismaClient();

async function sendReminderEmails() {
  const todaySessionSlots = await prisma.sessionSlot.findMany({
    where: {
      startTime: {
        lte: new Date("2025-03-11T18:29:59.994Z").toISOString(),
        gte: new Date("2025-03-10T18:30:00.995Z").toISOString()
      },
    },
    include: {
      Attendance: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  const userEmails = todaySessionSlots.map((item) => {
    return item.Attendance.user.email;
  });

  await Promise.all(
    userEmails.map((it, idx) => {
      sendEmail({
        content: `Your session starts at ${moment(
          todaySessionSlots[idx].startTime
        ).format("hh:mm:ss a")}`,
        senderUrl: it,
        subject: "Remainder for today's session",
      });
    })
  );
}

module.exports = { sendReminderEmails };
