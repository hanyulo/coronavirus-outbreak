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
  padding: 20px;
`;

const Header = styled.h1`
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin: 50px 0;
`;

const MapContainer = styled.div`
  max-width: 1024px;
  margin: 0 auto;
`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      coronavirusDataPrefecturalLevel: null,
      coronavirusCountryLevel: null,
    };
  }

  async componentDidMount() {
    const res = await API.fetchCoronavirusAreaData();
    // const data = filterOutNonChina(res.data.results);
    const countryRes = await API.fetchChianOverallData();
    const { confirmedCount, deadCount, curedCount } = countryRes;
    const data = extractData(res.data.results);
    this.setState({
      coronavirusDataPrefecturalLevel: data,
      coronavirusCountryLevel: {
        confirmedCount,
        deadCount,
        curedCount,
      },
    });
  }

  render() {
    const { coronavirusDataPrefecturalLevel, coronavirusCountryLevel } = this.state;
    return (
      <Container>
        <Header>Map Demo 2</Header>
        <Section>
          <div>資料來源：丁香醫生</div>
          <MapContainer>
            <PrefecturalChinaV2
              countryData={coronavirusCountryLevel}
              data={coronavirusDataPrefecturalLevel}
            />
          </MapContainer>
        </Section>
        {/*<Section>
          <div>資料來源：每日頭條（github.com/canghailan）</div>
          <PrefecturalChina
            data={coronavirus}
          />
        </Section>
        <Section>
          <ChinaChronological
            data={testData}
          />
      </Section>*/}
      </Container>
    );
  }
}

export default App;
