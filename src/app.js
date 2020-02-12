import React from 'react';
import styled from 'styled-components';
import ChinaChronological from './components/ChinaChronological';
import testData from './data/testData.json';


const Header = styled.h1`
  margin-bottom: 20px;
`;

const App = () => (
  <div>
    <Header>Map Demo</Header>
    <ChinaChronological
      data={testData}
    />
  </div>
);

export default App;
