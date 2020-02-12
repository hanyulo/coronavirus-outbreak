import React from 'react';
import styled from 'styled-components';
import ChinaChronological from './components/ChinaChronological';
import testData from './data/testData.json';
import PrefecturalChina from './components/PrefecturalChina';


const Header = styled.h1`
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin: 40px 0;
`;

const App = () => (
  <div>
    <Header>Map Demo</Header>
    <Section>
      <ChinaChronological
        data={testData}
      />
    </Section>
    <Section>
      <PrefecturalChina />
    </Section>
  </div>
);

export default App;
