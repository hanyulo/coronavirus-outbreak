# coronavirus-outbreak
This is data visualization react-component-package for visualizing covid-19 outbreak. The package is mainly for Public Television Service at Taiwan.


## How to use it

#### Latest
* version 3.0.4

```js
import PrefecturalChina from coronavirus-outbreak/PrefecturalChina;
import ChinaChronological from coronavirus-outbreak/ChinaChronological;
import Earth from coronavirus-outbreak/Earth;


return (
  <div>
    <Earth
      data={latestData}
    />
    <PrefecturalChinaV2
      countryData={coronavirusCountryLevel}
      data={coronavirusDataPrefecturalLevel}
    />
    <ChinaChronological
      data={data}
    />
  </div>
)


```

#### Data Structure

* Earth
    * get `Latest` data and translate it to the following format

```json
// ename: country name in english
// name: country name in mandarine
// confirmed: number of confirmed covid-19
[
  {
    "[enmae]": {
      "cnofirmed": "Number",
      "name": "String",
    }
  }
  ...
]
```

* ChinaChronological
    * just pour the `Time Series` data into the component.

#### Obsolete

* `npm install coronavirus-outbreak`
* version 1.0.3
    * `import [whatever you want] from 'coronavirus-outbreak'`
* version 2.0.0
    * `import { ChinaProvince, ChinaPrefectural } from 'coronavirus-outbreak'`
* version 3.0.0
    * `import [whatever you want] from 'coronavirus-outbreak'`


## [Related Data]((https://github.com/hanyulo/coronavirus-data-hub)
* [Time Series](https://tpts-public.s3-ap-southeast-1.amazonaws.com/china-coronavirus-timeseries.json)
* [Latest](https://tpts-public.s3-ap-southeast-1.amazonaws.com/latest-coronavirus-stats.json)


### Development
* port number: 3000
* command `npm run start:dev`

### Production
* command `npm run build`
