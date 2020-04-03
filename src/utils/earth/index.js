import { formatNumber } from '../index';
import countriesMap from '../../data/countries-em-map.json';

const excpetionMap = {
  'United States of America': 'us',
  'S. Sudan': 'south sudan',
  'Burma': 'myanmar',
  'Taiwan': 'taiwan*',
  'Dem. Rep. Congo': 'congo (kinshasa)',
  'Congo': 'congo (brazzaville)',
  "Côte d'Ivoire": "cote d'ivoire",
  'Central African Rep.': 'central african republic',
  'Bosnia and Herz.': 'bosnia and herzegovina',
  'Macedonia': 'north macedonia',
  'Eq. Guinea': 'equatorial guinea',
  'Dominican Rep.': 'dominican republic',
};

const exceptoinMapForData = {
  'south korea': 'korea, south',
  'myanmar': 'burma',
};

const getTooltipContent = ({
  data,
  propertyName,
}) => {
  if (data) {
    const targetName = excpetionMap[propertyName] || propertyName.toLowerCase();
    const dataEntity = data[exceptoinMapForData[targetName] || targetName];
    const name = countriesMap[targetName] || targetName;
    const confirmed = dataEntity ? formatNumber(dataEntity.confirmed) : 0;
    if (!name) {
      console.log('propertyName: ', propertyName)
    }
    if (!dataEntity) {
      console.log('propertyName: ', propertyName)
      console.log('targetName: ', targetName)
    }
    return {
      name: name || propertyName,
      confirmed,
    };
  }
  const targetName = excpetionMap[propertyName] || propertyName.toLowerCase();
  const name = countriesMap[targetName];
  return {
    name: name || propertyName,
    confirmed: 'N/A',
  };
};

const getConfirmedCount = ({
  data,
  propertyName,
}) => {
  if (data) {
    const targetName = excpetionMap[propertyName] || propertyName.toLowerCase();
    const dataEntity = data[exceptoinMapForData[targetName] || targetName];
    return dataEntity ? dataEntity.confirmed : null;
  }
  return 0;
};

export {
  getTooltipContent,
  getConfirmedCount,
};
