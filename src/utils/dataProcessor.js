// const element = {
//   [timeStamp]: {
//     dateString: '1234',
//     data: [
//       {
//         province: 'xxx',
//         confirmedCount: 123,
//       },
//       {
//         province: 'xxx',
//         confirmedCount: 123,
//       },
//       ...
//     ]
//   }
// }

const countrySet = new Set(['Mainland China', 'Hong Kong', 'Macau']);
const keyTimestampMap = {};
const timeSeriesMap = {};
const milliSecondsInADay = 24 * 60 * 60 * 1000;

const columnKey = {
  province: 0,
  country: 1,
  firstConfirmed: 2,
  dateStart: 5,
};

const dateTimeTuncate = (dateTimeString) => {
  if (dateTimeString && typeof dateTimeString === 'string') {
    try {
      return dateTimeString.split(' ')[0];
    } catch (e) {
      return null;
    }
  }
  return null;
};

const dateStringToTimeStamp = (dateString) => {
  if (dateString && typeof dateString === 'string') {
    try {
      return new Date(dateString).getTime();
    } catch (e) {
      return null;
    }
  }
  return null;
};

const pipe = (...fns) => initialState => fns.reduce((acc, fn) => fn(acc), initialState);

const dateTimeProcessor = pipe(dateTimeTuncate, dateStringToTimeStamp);

const firstRowHandler = (row) => {
  const firstTimestamp = dateTimeProcessor(row[columnKey.dateStart]);
  const lastTimestamp = dateTimeProcessor(row[row.length - 1]);
  const totalDays = ((lastTimestamp - firstTimestamp) / milliSecondsInADay) + 1;
  for (let i = columnKey.dateStart; i < row.length; i += 1) {
    // timeSeriesMap.set(dateTimeProcessor(row[i]), {
    //   dateString: dateTimeTuncate(row[i]),
    //   data: [],
    // });
    keyTimestampMap[i] = {
      timestamp: dateTimeProcessor(row[i]),
      dateString: dateTimeTuncate(row[i]),
    };
  }
  return totalDays;
};

const rowsHandler = (row) => {
  for (let i = columnKey.dateStart; i < row.length; i += 1) {
    const { timestamp, dateString } = keyTimestampMap[i];
    if (!timeSeriesMap[timestamp]) {
      timeSeriesMap[timestamp] = {
        dateString,
        data: {
          [row[columnKey.province]]: +row[i],
        },
      };
    } else {
      const previousData = timeSeriesMap[timestamp];
      timeSeriesMap[timestamp] = {
        ...previousData,
        data: {
          ...previousData.data,
          [row[columnKey.province]]: +row[i],
        },
      };
    }
  }
};


const johnHopkinsTimeSeries = (rows) => {
  let totalDays;
  rows.forEach((row, index) => {
    if (index === 0) {
      firstRowHandler(row);
      totalDays = timeSeriesMap.size;
    } else if (countrySet.has(row[columnKey.country])) {
      rowsHandler(row);
    }
  });
  return timeSeriesMap;
};

module.exports = {
  johnHopkinsTimeSeries,
};
