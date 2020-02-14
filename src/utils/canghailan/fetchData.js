const fs = require('fs');
const rimraf = require('rimraf');
const fetch = require('node-fetch');
const path = require('path');
const url = 'https://raw.githubusercontent.com/canghailan/Wuhan-2019-nCoV/master/Wuhan-2019-nCoV.json';
const targetDir = path.resolve(__dirname, '../../data/virus');
const fileName = 'coronavirus';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}
if (fs.existsSync(`${targetDir}/${fileName}.json`)) {
  rimraf.sync(`${targetDir}/${fileName}.json`);
}


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

const generateData = ({
  oldData = {
    countries: {},
    provinces: {},
    cities: {},
  },
  entity,
}) => {
  const {
    countryCode,
    provinceCode,
    cityCode,
    province,
    city,
  } = entity;
  let res = {};
  if (countryCode && !provinceCode && !cityCode) {
    res = {
      ...oldData,
      countries: {
        ...oldData.countries,
        [entity.countryCode]: entity,
      },
    };
  } else if ((countryCode && provinceCode && !cityCode) && (province && !city)) {
    res = {
      ...oldData,
      provinces: {
        ...oldData.provinces,
        [entity.provinceCode]: entity,
      },
    };
  } else if ((countryCode && provinceCode && cityCode) && city) {
    res = {
      ...oldData,
      cities: {
        ...oldData.cities,
        [entity.cityCode]: entity,
      },
    };
  } else {
    res = {
      ...oldData,
    };
  }
  return res;
};


function dataProcessor(data) {
  let res = {};
  data.forEach((entity, index) => {
    const targetTimeStamp = dateStringToTimeStamp(entity.date);
    if (res[targetTimeStamp]) {
      res = {
        ...res,
        [targetTimeStamp]: {
          dateString: entity.date,
          data: generateData({
            oldData: res[targetTimeStamp].data,
            entity,
          }),
        },
      };
    } else {
      res = {
        ...res,
        [targetTimeStamp]: {
          dateString: entity.date,
          data: generateData({ entity }),
        },
      };
    }
  });
  return res;
}

function fetchData() {
  fetch(url)
    .then(async response => {
      const data = await response.json();
      dataProcessor(data);
      fs.writeFile(`${targetDir}/${fileName}.json`, JSON.stringify(dataProcessor(data), null, 2), (err) => {
        if (err) {
          console.log(err);
        }
        console.log(`write file ${fileName} successfully`);
      });
    })
    .catch((e) => {
      console.log('fail to fetch data from github account of canghailan');
      console.log('reason: ', e);
    });
}


function fetchRawData() {
  fetch(url)
    .then(async response => {
      const data = await response.json();
      dataProcessor(data);
      fs.writeFile(`${targetDir}/${fileName}_raw.json`, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          console.log(err);
        }
        console.log(`write file ${fileName}_raw successfully`);
      });
    })
    .catch(() => {
      console.log('fail to fetch data from github account of canghailan');
    });
}

(function main() {
  fetchData();
})();
