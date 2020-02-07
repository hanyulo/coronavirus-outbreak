import React from 'react';
import ChinaChronological from './components/ChinaChronological';
import testData from './data/testData.json';



const App = () => (
  <div>
    <ChinaChronological
      data={testData}
    />
  </div>
);

export default App;
