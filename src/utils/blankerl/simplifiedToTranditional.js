const fs = require('fs');
const { cjst } = require('./cjst');
const path = require('path');

const provinceRawData = fs.readFileSync(path.resolve(__dirname, '../../data/china-provinces.json'));
const prefectureRawData = fs.readFileSync(path.resolve(__dirname, '../../data/china-prefectural-cities/congregated-data-geo.json'));


const provinces = JSON.parse(provinceRawData);
const prefectures = JSON.parse(prefectureRawData);

const newProvinces = { ...provinces };
const newPrefectures = { ...prefectures };

const targetDirProvince = path.resolve(__dirname, '../../data');
const fileNameProvince = 'china-provinces-tranditional';
const targetDirPrefecture = path.resolve(__dirname, '../../data/china-prefectural-cities');
const fileNamePrefecture = 'congregated-data-geo-tranditional';


newProvinces.features.forEach((province, index) => {
  let newName = cjst.simplifiedToTraditional(province.properties.name);
  newNam = newName.replace('甯', '寧');
  province.properties.name = newNam;
});

newPrefectures.features.forEach((prefecture, index) => {
  let newName = cjst.simplifiedToTraditional(prefecture.properties.name);
  newNam = newName.replace('甯', '寧');
  prefecture.properties.name = newNam;
});

fs.writeFile(`${targetDirProvince}/${fileNameProvince}.json`, JSON.stringify(newProvinces, null, 2), (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`write file ${fileNameProvince} successfully`);
});

fs.writeFile(`${targetDirPrefecture}/${fileNamePrefecture}.json`, JSON.stringify(newPrefectures, null, 2), (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`write file ${fileNamePrefecture} successfully`);
});
