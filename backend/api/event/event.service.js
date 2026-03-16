exports.getEventStdFormat = function (allEvents) {
  const today = new Date();
  let events = [],
    completedEvents = [];
  allEvents?.forEach((item) => {
    if (new Date(item.endsAt) >= today) {
      events.push(item);
    } else {
      completedEvents.push(item);
    }
    return { events, completedEvents };
  });
};
