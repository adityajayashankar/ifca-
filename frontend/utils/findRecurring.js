// given: set of dates
// returns: set of future dates
// mode: monthly
// find the same days in the next month

// mode: weekly
// find the same days in the next week

// chosenDates=[{startsAt, endsAt}]
export default function getFutureDates(chosenDates, mode, range) {
  let futureDates = [];
  let tempDates = [];
  let count = range;
  let baseDates = chosenDates;
  while (count) {
    baseDates?.forEach(({ startTime, endTime }) => {
      let dStartsAt = new Date(startTime);
      let dEndsAt = new Date(endTime);
      if (mode === "weekly") {
        let tempStarts = new Date(
          dStartsAt.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        let tempEndsAt = new Date(dEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        futureDates.push({
          startTime: tempStarts.toISOString(),
          endTime: tempEndsAt.toISOString(),
        });
        tempDates.push({ startTime: tempStarts, endTime: tempEndsAt });
      } else {
        let tempStarts = new Date(
          dStartsAt.getMonth() === 11
            ? dStartsAt.getFullYear() + 1
            : dStartsAt.getFullYear(),
          (dStartsAt.getMonth() + 1) % 12,
          dStartsAt.getDate(),
          dStartsAt.getHours(),
          dStartsAt.getMinutes()
        );
        let tempEndsAt = new Date(
          dEndsAt.getMonth() === 11
            ? dEndsAt.getFullYear() + 1
            : dEndsAt.getFullYear(),
          (dEndsAt.getMonth() + 1) % 12,
          dEndsAt.getDate(),
          dEndsAt.getHours(),
          dEndsAt.getMinutes()
        );
        futureDates.push({
          startTime: tempStarts.toISOString(),
          endTime: tempEndsAt.toISOString(),
        });
        tempDates.push({ startTime: tempStarts, endTime: tempEndsAt });
      }
    });
    count--;
    baseDates = JSON.parse(JSON.stringify(tempDates));
    tempDates = [];
  }
  return futureDates;
}

// returns baseSlots
export function decipherBaseSlots(allSlots, isRecurring) {
  // allSorts: sort it by time
  if (isRecurring === "none" || allSlots.length <= 1) {
    return allSlots;
  }
  let base = 1;
  let baseDate = new Date(allSlots[0].startTime);
  if (isRecurring === "weekly") {
    allSlots.every((item, index) => {
      // day same, time same
      let x = new Date(item.startTime);
      if (
        index !== 0 &&
        x.getDay() === baseDate.getDay() &&
        x.getHours() === baseDate.getHours() &&
        x.getMinutes() === baseDate.getMinutes()
      ) {
        return false;
      }
      base++;
      return true;
    });
  } else {
    allSlots.every((item, index) => {
      // date same, day same, time same
      let x = new Date(item.startTime);
      if (
        index !== 0 &&
        x.getDate() === baseDate.getDate() &&
        x.getDay() === baseDate.getDay() &&
        x.getHours() === baseDate.getHours() &&
        x.getMinutes() === baseDate.getMinutes()
      ) {
        return false;
      }
      base++;
      return true;
    });
  }

  return allSlots.slice(0, base - 1);
}
