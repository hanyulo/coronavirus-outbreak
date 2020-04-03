import config from '../../config/config';

const { coronavirusAPIOrigin, coronavirusAPIPath } = config;

const asyncResolver = async (promise) => {
  const res = {
    data: null,
    error: null,
  };
  try {
    const response = await promise;
    res.data = await response.json();
    return res;
  } catch (e) {
    res.error = e;
    return res;
  }
};

async function fetchCoronavirusAreaData() {
  const result = await asyncResolver(fetch(`${coronavirusAPIOrigin}/${coronavirusAPIPath}/area?latest=1`));
  return result;
}

async function fetchChianOverallData() {
  const result = await asyncResolver(fetch(`${coronavirusAPIOrigin}/${coronavirusAPIPath}/overall`));
  return result.data.results[0];
}

async function fetchLatestDate() {
  const url = 'https://tpts-public.s3-ap-southeast-1.amazonaws.com/latest-coronavirus-stats.json';
  const result = await asyncResolver(fetch(url));
  if (result && !result.error) {
    return result.data;
  }
  return null;
}

export default {
  fetchCoronavirusAreaData,
  fetchChianOverallData,
  fetchLatestDate,
};
