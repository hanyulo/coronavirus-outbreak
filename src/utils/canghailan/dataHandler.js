const coronavirous = require('../../data/virus/coronavirus.json');


const getMetaData = () => {
  const timeStamps = Object.keys(coronavirous);
  return {
    firtDate: {
      dateString: coronavirous[timeStamps[0]].dateString,
      timeStamp: timeStamps[0],
    },
    lastDate: {
      dateString: coronavirous[timeStamps[timeStamps.length - 1]].dateString,
      timeStamp: timeStamps[timeStamps.length - 1],
    },
    totalDays: timeStamps.length,
  };
};

const res = getMetaData();
console.log(res);
