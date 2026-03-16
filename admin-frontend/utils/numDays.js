// export const numDays = (createdAt) => {
//   const today = new Date();
//   const createdOn = new Date(createdAt);
//   const msInDay = 24 * 60 * 60 * 1000;

//   //   createdOn.setHours(0, 0, 0, 0);
//   //   today.setHours(0, 0, 0, 0);
//   const diff = today;
//   console.log(diff);
//   return `7 days`;
//   //   if (diff >= 365) {
//   //     // return num years
//   //     return `${today.getFullYear() - createdOn.getFullYear()} y`;
//   //   } else if (diff === 0) {
//   //     // check in hours/minutes
//   //     return `recently posted`;
//   //   } else if (diff <= 30) {
//   //     // return num days
//   //     return `${diff} days`;
//   //   } else {
//   //     // return num months
//   //     return `${today.getMonth() - createdOn.getMonth()} mo`;
//   //   }
// };

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getFormattedDate(
  date,
  prefomattedDate = false,
  hideYear = false
) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  let minutes = date.getMinutes();

  if (minutes < 10) {
    // Adding leading zero to minutes
    minutes = `0${minutes}`;
  }

  if (prefomattedDate) {
    // Today at 10:20
    // Yesterday at 10:20
    return `${prefomattedDate} at ${hours}:${minutes}`;
  }

  if (hideYear) {
    // 10. January at 10:20
    return `${day}. ${month} at ${hours}:${minutes}`;
  }

  // 10. January 2017. at 10:20
  return `${day}. ${month} ${year}. at ${hours}:${minutes}`;
}

// --- Main function
export const numDays = (dateParam) => {
  //   if (!dateParam) {
  //     return null;
  //   }

  const date = new Date(dateParam);
  const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
  const today = new Date();
  const yesterday = new Date(today - DAY_IN_MS);
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getFullYear() === date.getFullYear();

  if (seconds < 5) {
    return "now";
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (seconds < 90) {
    return "about a minute ago";
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (isToday) {
    return getFormattedDate(date, "Today"); // Today at 10:20
  } else if (isYesterday) {
    return getFormattedDate(date, "Yesterday"); // Yesterday at 10:20
  } else if (isThisYear) {
    return getFormattedDate(date, false, true); // 10. January at 10:20
  }

  return getFormattedDate(date); // 10. January 2017. at 10:20
};
