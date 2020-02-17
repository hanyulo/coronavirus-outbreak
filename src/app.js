import React from 'react';
import styled from 'styled-components';
import ChinaChronological from './components/ChinaChronological';
import PrefecturalChina from './components/PrefecturalChina';
import PrefecturalChinaV2 from './components/PrefecturalChinaV2';

import testData from './data/testData.json';
import coronavirus from './data/virus/coronavirus.json';
import API from './utils/api';
import { extractData } from './utils/blankerl';

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      coronavirusDataPrefecturalLevel: null,
    };
  }

  async componentDidMount() {
    const res = await API.fetchCoronavirusAreaData();
    // const data = filterOutNonChina(res.data.results);
    const data = extractData(res.data.results);
    this.setState({
      coronavirusDataPrefecturalLevel: data,
    });
  }

  render() {
    const { coronavirusDataPrefecturalLevel } = this.state;
    return (
      <Container>
        <Header>Map Demo</Header>
        <Section>
          <div>資料來源：丁香醫生</div>
          <PrefecturalChinaV2
            data={coronavirusDataPrefecturalLevel}
          />
        </Section>
        <Section>
          <div>資料來源：每日頭條（github.com/canghailan）</div>
          <PrefecturalChina
            data={coronavirus}
          />
        </Section>
        <Section>
          <ChinaChronological
            data={testData}
          />
        </Section>
      </Container>
    );
  }
}

export default App;
