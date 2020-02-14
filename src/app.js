import React from 'react';
import styled from 'styled-components';
import ChinaChronological from './components/ChinaChronological';
import testData from './data/testData.json';
import coronavirous from './data/virus/coronavirus.json';
import PrefecturalChina from './components/PrefecturalChina';

const Container = styled.div`
  padding: 40px;
  background-color: #f2f2f2;
`;

const Header = styled.h1`
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin: 50px 0;
`;

const App = () => (
  <Container>
    <Header>Map Demo</Header>
    <Section>
      <PrefecturalChina
        data={coronavirous}
      />
    </Section>
    <Section>
      <ChinaChronological
        data={testData}
      />
    </Section>
  </Container>
);

export default App;
