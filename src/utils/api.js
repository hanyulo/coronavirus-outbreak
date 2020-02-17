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
};

export default {
  fetchCoronavirusAreaData,
};
