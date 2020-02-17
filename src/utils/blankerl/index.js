const filterOutNonChina = (data) => data.filter((entity) => entity.countryEnglishName === 'China');

const formatData = (data) => {
  if (Array.isArray(data) && data.length !== 0) {
    const latestUpdatedTime = data[0].updateTime;
    const formatedData = {};
    data.forEach((province) => {
      let cities = null;
      if (province.cities && Array.isArray(province.cities)) {
        cities = (() => {
          const tmpCities = {};
          province.cities.forEach((city) => {
            tmpCities[city.locationId] = city;
          });
          return tmpCities;
        })();
      }
      formatedData[province.locationId] = {
        ...province.locationId,
        cities,
      };
    });
    return {
      latestUpdatedTime,
      data: formatedData,
    };
  }
  return null;
};

const formatDataNormalization = (data) => {
  if (Array.isArray(data) && data.length !== 0) {
    const latestUpdatedTimeStamp = data[0].updateTime;
    const provincesData = {};
    let citiesData = {};
    data.forEach((province) => {
      const cityIds = [];
      let tmpCitiesData = {};
      if (province.cities && Array.isArray(province.cities)) {
        tmpCitiesData = (() => {
          const tmpCities = {};
          let exceptionIndex = 0;
          province.cities.forEach((city) => {
            let { locationId } = city;
            if (city.locationId === 0 || city.locationId === -1) {
              locationId = `${province.locationId}/${exceptionIndex}`;
              exceptionIndex += 1;
            }
            cityIds.push(locationId);
            tmpCities[locationId] = city;
          });
          return tmpCities;
        })();
        citiesData = {
          ...citiesData,
          ...tmpCitiesData,
        };
      }
      provincesData[province.locationId] = {
        ...province,
        cities: cityIds,
      };
    });
    return {
      latestUpdatedTimeStamp,
      provinces: provincesData,
      cities: citiesData,
    };
  }
  return null;
};

const pipe = (...fns) => (intialState) => fns.reduce((acc, fn) => fn(acc), intialState);

const extractData = pipe(filterOutNonChina, formatDataNormalization);


export {
  filterOutNonChina,
  formatData,
  extractData,
};
