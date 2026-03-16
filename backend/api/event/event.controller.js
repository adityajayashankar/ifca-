const { PrismaClient } = require("@prisma/client");
const { createCustomError } = require("../../middleware/errorHandling");
const { findEventByIdHelper } = require("../services/getById");
const { getEventStdFormat } = require("./event.service");
const prisma = new PrismaClient();

// create event
// req.body={name,desc,price,bannerImgs,infoImgs,startsAt,endsAt}
exports.createEvent = async function (req, res, next) {
  try {
    const createdEvent = await prisma.event.create({
      data: req.body,
    });

    return res.status(200).json({ event: createdEvent });
  } catch (error) {
    console.log(`Error while creating an event @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// view all events
exports.viewAllEvents = async function (req, res, next) {
  try {
    const allEvents = await prisma.event.findMany({
      where: {
        isArchived: false,
      },
    });
    const { events, completedEvents } = getEventStdFormat(allEvents);
    return res.status(200).json({ events, completedEvents });
  } catch (error) {
    console.log(`Error fetching all events @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// view all events
exports.viewAllEventsIncludingArchived = async function (req, res, next) {
  try {
    const today = new Date();
    const allEvents = await prisma.event.findMany({});
    let events = [],
      completedEvents = [];
    allEvents?.forEach((item) => {
      if (new Date(item.endsAt) >= today) {
        events.push(item);
      } else {
        completedEvents.push(item);
      }
    });
    return res.status(200).json({ events, completedEvents });
  } catch (error) {
    console.log(`Error fetching all events including archived @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// view event=>event details+sessions
exports.viewEventById = async function (req, res, next) {
  let { eventId } = req.params;
  try {
    const event = await findEventByIdHelper(eventId);
    return res.status(200).json({ event });
  } catch (error) {
    console.log(`Error fetching event by Id ${eventId} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// update event details
// req.body={name,desc,price}
exports.updateEventById = async function (req, res, next) {
  let { eventId } = req.params;
  try {
    await findEventByIdHelper(eventId);
    const event = await prisma.event.update({
      where: {
        id: parseInt(eventId),
      },
      data: req.body,
    });
    return res.status(200).json({ event });
  } catch (error) {
    console.log(`Error updating event by Id ${eventId} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// delete event
exports.deleteEventById = async function (req, res, next) {
  let { eventId } = req.params;
  try {
    await findEventByIdHelper(eventId);
    const event = await prisma.event.delete({
      where: {
        id: parseInt(eventId),
      },
    });
    return res.status(200).json({ event });
  } catch (error) {
    console.log(`Error deleting event by Id ${eventId} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// buy event => for person
// req.body={transaction:{amount,transactionId,paymentId,userId?,expertId?},paymentCompleted}
exports.buyEventPass = async function (req, res, next) {
  let { eventId } = req.params;
  try {
    const event = await findEventByIdHelper(eventId);
    const userId = req.user.unifiedUserId;
    const { transaction, paymentCompleted } = req.body;
    if (paymentCompleted) {
      const createdAttendance = await prisma.eventAttendance.create({
        data: {
          unifiedUser: {
            connect: {
              id: parseInt(userId),
            },
          },
          event: {
            connect: {
              id: event.id,
            },
          },
          paymentCompleted: true,
        },
      });
      return res.status(200).json({ eventAttendance: createdAttendance });
    } else {
      const createdAttendance = await prisma.eventAttendance.create({
        data: {
          unifiedUser: {
            connect: {
              id: parseInt(userId),
            },
          },
          event: {
            connect: {
              id: event.id,
            },
          },
          transaction: {
            create: transaction,
          },
        },
      });

      return res.status(200).json({ eventAttendance: createdAttendance });
    }
  } catch (error) {
    console.log(`Error while adding user to event @ ${__filename}`);
    console.log(error);
    next(error);
  }
};
