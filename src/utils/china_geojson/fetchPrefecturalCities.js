const fs = require('fs');
const rimraf = require('rimraf');
const fetch = require('node-fetch');
const path = require('path');

const chinaProvinces = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/china-provinces.json'), 'utf8'));
const urlBase = 'https://geo.datav.aliyun.com/areas/bound';
const targetDir = path.resolve(__dirname, '../../data/china-prefectural-cities');

// if (fs.existsSync(targetDir)) {
//   rimraf.sync(targetDir);
//   fs.mkdirSync(targetDir);
// } else {
//   fs.mkdirSync(targetDir);
// }

function fetchCompiledData() {
  const fileNameKeyValuePair = 'congregated-data-key-value-pair';
  const fileNameGeoJson = 'congregated-data-geo';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }
  if (fs.existsSync(`${targetDir}/${fileNameKeyValuePair}.json`)) {
    rimraf.sync(`${targetDir}/${fileNameKeyValuePair}.json`);
  } else if (fs.existsSync(`${targetDir}/${fileNameGeoJson}.json`)) {
    rimraf.sync(`${targetDir}/${fileNameGeoJson}.json`);
  }

  const promises = [];
  chinaProvinces.features.forEach((d) => {
    const { adcode } = d.properties;
    const promise = new Promise((resolve, reject) => {
      fetch(`${urlBase}/${adcode}_full.json`)
        .then(async response => {
          const data = await response.json();
          resolve({
            adcode,
            data,
          });
        })
        .catch((e) => {
          reject(e);
        });
    });
    promises.push(promise);
  });
  Promise.all(promises)
    .then((data) => {
      const transpiledData = (() => {
        let resObj = {};
        let resArray = {
          type: 'FeatureCollection',
          features: [],
        };
        data.forEach((d) => {
          resObj = {
            ...resObj,
            [d.adcode]: d.data,
          };
          resArray = {
            ...resArray,
            features: [...resArray.features, ...d.data.features],
          };
        });
        return {
          keyValuePair: resObj,
          geoJson: resArray,
        };
      })();
      fs.writeFile(`${targetDir}/${fileNameKeyValuePair}.json`, JSON.stringify(transpiledData.keyValuePair, null, 2), (err) => {
        if (err) {
          console.log(err);
        }
        console.log(`write file ${fileNameKeyValuePair} successfully`);
      });
      fs.writeFile(`${targetDir}/${fileNameGeoJson}.json`, JSON.stringify(transpiledData.geoJson, null, 2), (err) => {
        if (err) {
          console.log(err);
        }
        console.log(`write file ${fileNameGeoJson} successfully`);
      });
    })
    .catch((e) => {
      console.log('e: ', e);
    });
}

function fetchSeperatedData() {
  chinaProvinces.features.forEach((d, index) => {
    const { adcode } = d.properties;
    fetch(`${urlBase}/${adcode}_full.json`)
      .then(async response => {
        const data = await response.json();
        fs.writeFile(`${targetDir}/${adcode}.json`, JSON.stringify(data, null, 2), (err) => {
          if (err) {
            console.log(err);
          }
          console.log('write file successfully');
        });
      })
      .catch(() => {
        throw new Error(`fail to fetch prefectural level cites of ${adcode}`);
      });
  });
}

function main() {
  fetchCompiledData();
}

main();
