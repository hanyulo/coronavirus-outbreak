import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import provinces from '../data/china-provinces.json';
// import { fetchPrefecturalCity } from '../utils/api';
import prefectures from '../data/china-prefectural-cities/congregated-data-geo.json';
import { formatNumber } from '../utils';
import Slider from './Slider';

const width = 700;
const mapRatio = 0.58;
const scaleRatio = 0.71;
const height = width * mapRatio;
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854;
const DEFAULT_MAP_COLOR = '#DADADA';
// const BORDER_COLOR = '#333';

const strokeWidth = {
  default: 0.2,
  focus: 0.4,
  howverFocus: 0.4,
};

const strokeColor = {
  default: 'white',
  focus: '#333',
};

const Container = styled.div`
  margin: 0 auto;
  max-width: ${width}px;
  width: 100%;
`;

const CanvasContainer = styled.div`
  max-width: ${width}px;
  box-sizing: content-box;
  position: relative;
  border: 1px solid black;
  overflow: hidden;
  display: flex;
  align-items: center;
  margin: 20px 0;
  background-color: #EEEEEE;
`;

const Map = styled.svg`
  width: 100%;
  height: ${height}px;
`;

const ToolTip = styled.div`
  color: #222;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0px 0px 2px 0px #a6a6a6;
  padding: .5em;
  text-shadow: #f5f5f5 0 1px 0;
  opacity: 0.9;
  position: fixed;
  display: none;
  z-index: 999;
`;

const generateTooltipContent = ({ name, adcode, data }) => {
  const entity = data[adcode];
  const emptyString = '無數據';
  if (!entity) {
    // console.log('has no data for the area - adcode ', adcode);
    return `
      <div>
        目前尚無數據
      </div>
    `;
  }
  const {
    confirmed,
    suspected,
    cured,
    dead,
  } = entity;
  return `
    <div>
      <div>
        ${name}
      </div>
      <div>
        確診：${formatNumber(confirmed)}
      </div>
      <div>
        疑似病例：${formatNumber(suspected)}
      </div>
      <div>
        康復：${formatNumber(cured)}
      </div>
      <div>
        死亡：${formatNumber(dead)}
      </div>
    </div>
  `;
};

const stageColorMap = {
  0: DEFAULT_MAP_COLOR,
  1: '#F5C6E9',
  2: '#D493BC',
  3: '#BC659A',
  4: '#803D79',
  5: '#451458',
  6: '#270048',
};

const getInfectedStageFromCount = (count) => {
  if (count === 0) {
    return 0;
  }
  if (count >= 1 && count <= 10) {
    return 1;
  }
  if (count >= 11 && count <= 20) {
    return 2;
  }
  if (count >= 21 && count <= 100) {
    return 3;
  }
  if (count >= 101 && count <= 1000) {
    return 4;
  }
  if (count >= 1001 && count <= 10000) {
    return 5;
  }
  if (count >= 10001 && count <= 100000) {
    return 6;
  }
  return 0;
};


class PrefecturalChina extends Component {
  constructor(props) {
    super(props);
    this.state = {
      legendStage: 74,
    };
    const { data } = props;
    // sortedTimestamps;
    this.dataKeys = Object.keys(data);
    this.map = null;
    this.canvasContainer = null;
    this.centered = null;
    this.tooltip = null;
    this.isTransitioning = null;
    this.updateLegendStage = this._updateLegendStage.bind(this);
  }

  componentDidMount() {
    d3.select(window).on(`resize.${PrefecturalChina.name}`, () => {
      this._cleanCanvas();
      this._drawChina();
    });
    this._drawChina();
  }

  _updateLegendStage(legendStage) {
    const { data } = this.props;
    // const currentTimestamp = this.dataKeys[legendStage];
    // const { dateString } = data[currentTimestamp];
    this.setState({
      legendStage,
    }, () => {
      this._cleanCanvas();
      this._drawChina();
    });
  }

  _getTransitionStatus() {
    return this.isTransitioning;
  }

  _cleanCanvas() {
    d3
      .select(this.map)
      .selectAll('path')
      .remove();
  }

  _cleanToolTip() {
    this.tooltip.style.display = 'none';
  }

  _zoomOut(d3SelectedMap) {
    this.isTransitioning = true;
    const x = 0;
    const y = 0;
    const scaleValue = 1;
    d3SelectedMap.transition()
      .duration(750)
      .attr('transform', `scale(${scaleValue}) translate(${x}, ${y})`)
      .end()
      .then(() => {
        this.isTransitioning = false;
        this._cleanToolTip();
      })
      .catch((e) => {
        console.log('transition error');
      })
  }

  _zoomIn(d, d3SelectedMap, path) {
    this._cleanToolTip();
    this.isTransitioning = true;
    let x = 0;
    let y = 0;
    let scaleValue = 1;
    const bounds = path.bounds(d);
    const centroidX = (bounds[0][0] + bounds[1][0]) / 2;
    const centroidY = (bounds[0][1] + bounds[1][1]) / 2;
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const { clientWidth, clientHeight } = this.map;
    x = clientWidth / 2 - centroidX;
    y = clientHeight / 2 - centroidY;
    scaleValue = Math.min(clientWidth / dx, clientHeight / dy) * 0.95;
    d3SelectedMap.transition()
      .duration(750)
      .attr('transform', `scale(${scaleValue}) translate(${x}, ${y})`)
      .end()
      .then(() => {
        this.isTransitioning = false;
        this._cleanToolTip();
      })
      .catch((e) => {
        console.log('transition error');
      })
  }

  _cleanOutPrefectures(d, d3SelectedMap) {
    d3SelectedMap
      .selectAll('path.prefecture')
      .filter((prefecture) => prefecture.properties.parent.adcode === this.centered.properties.adcode)
      .style('display', 'none')
      .attr('stroke-width', strokeWidth.default)
      .attr('stroke', strokeColor.default);

    d3SelectedMap
      .selectAll('path.province')
      .filter((province) => province.properties.adcode === this.centered.properties.adcode)
      .attr('stroke-width', strokeWidth.default)
      .attr('stroke', strokeColor.default);
  }

  _onClickPrefecture(d, d3SelectedMap) {
    this._cleanOutPrefectures(d, d3SelectedMap);
    this._zoomOut(d3SelectedMap);
    this.centered = null;
  }

  _onClickProvince(d, d3SelectedMap, path) {
    if (!d || this.centered === d) {
      this.centered = null;
      this._zoomOut(d3SelectedMap);
      d3SelectedMap
        .selectAll('path.prefecture')
        .style('display', 'none');
    } else {
      // const centroid = path.centroid(d);
      if (this.centered) {
        this._cleanOutPrefectures(d, d3SelectedMap);
      }
      // const thePrefecturalCity = prefecturalCities[this.centered.properties.adcode];
      d3SelectedMap
        .selectAll('path.prefecture')
        .filter((prefecture) => prefecture.properties.parent.adcode === d.properties.adcode)
        .style('display', 'block')
        .attr('stroke-width', strokeWidth.focus)
        .attr('stroke', strokeColor.focus);

      d3SelectedMap
        .selectAll('path.province')
        .filter((province) => province.properties.adcode === d.properties.adcode)
        .attr('stroke-width', strokeWidth.focus)
        .attr('stroke', strokeColor.focus);

      this.centered = d;
      this._zoomIn(d, d3SelectedMap, path);
    }
  }

  _colorProcessor(d, isProvince) {
    const { legendStage } = this.state;
    const { data } = this.props;
    const currentTimestamp = this.dataKeys[legendStage];
    const { adcode } = d.properties;
    const { data: extractedData } = data[currentTimestamp]
    const entities = isProvince ? extractedData.provinces : extractedData.cities;
    if (!entities[adcode]) {
      // console.log('adcode: ', adcode)
    }
    const stage = getInfectedStageFromCount((entities[adcode] && entities[adcode].confirmed) || 0);
    return stageColorMap[stage];
  }

  _drawChina() {
    const { clientWidth } = this.canvasContainer;
    const { data } = this.props;
    const { legendStage } = this.state;
    const clientHeight = clientWidth * mapRatio;
    this.canvasContainer.style.height = `${clientHeight + 20}px`;
    this.map.style.height = `${clientHeight}px`;
    const scaleValue = clientWidth * scaleRatio;
    const projection = d3
      .geoMercator()
      .scale(scaleValue)
      .center([centerChinaLongtitude, centerChinaLatitude])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    const map = d3.select(this.map);

    const isProvince = (d) => d.properties.level === 'province';
    const d3SelectedTooltip = d3.select(this.tooltip);

    const _getTransitionStatus = this._getTransitionStatus.bind(this);
    const _dataKeys = this.dataKeys;
    // const _colorProcessor = this._colorProcessor;

// [...provinces.features, ...prefectures.features]
    map
      .selectAll('path')
      .data([...provinces.features, ...prefectures.features])
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', (d) => {
        if (isProvince(d)) {
          return 'province';
        }
        return 'prefecture';
      })
      .attr('data-adcode', (d) => d.properties.adcode)
      .attr('data-parent-adcode', (d) => d.properties.parent.adcode)
      .style('display', (d) => {
        if (isProvince(d)) {
          return 'block';
        }
        return 'none';
      })
      .attr('stroke', strokeColor.default)
      .attr('fill', (d) => this._colorProcessor(d, isProvince(d)))
      .attr('stroke-width', strokeWidth.default)
      .on('click', (d) => {
        if (isProvince(d)) {
          this._onClickProvince(d, map, path);
        } else {
          this._onClickPrefecture(d, map)
        }
      })
      .on('mouseover', function (d) {
        d3
          .select(this)
        d3SelectedTooltip
          .style('display', 'block')
          .html(generateTooltipContent({
            name: d.properties.name,
            adcode: d.properties.adcode,
            data: isProvince(d) ? data[_dataKeys[legendStage]].data.provinces : data[_dataKeys[legendStage]].data.cities,
          }));
      })
      .on('mousemove', (d) => {
        let positionX = d3.event.clientX + 10;
        const positionY = d3.event.clientY;
        const tooltipRect = this.tooltip.getBoundingClientRect();
        if ((positionX + tooltipRect.width) > window.innerWidth) {
          positionX = d3.event.clientX - tooltipRect.width - 10;
        }
        d3SelectedTooltip
          .style('top', `${positionY}px`)
          .style('left', `${positionX}px`)
          .html(generateTooltipContent({
            name: d.properties.name,
            adcode: d.properties.adcode,
            data: isProvince(d) ? data[_dataKeys[legendStage]].data.provinces : data[_dataKeys[legendStage]].data.cities,
          }));
      })
      .on('mouseout', function () {
        if (!_getTransitionStatus()) {
          d3
            .select(this)
          d3SelectedTooltip
            .style('display', 'none');
        }
      });
  }

  render() {
    const { data } = this.props;
    const { legendStage } = this.state;
    return (
      <Container>
        <div>{data[this.dataKeys[legendStage]].dateString}</div>
        <CanvasContainer
          ref={node => { this.canvasContainer = node; }}
        >
          <Map
            ref={node => { this.map = node; }}
          />
          <ToolTip
            ref={(node) => { this.tooltip = node; }}
          />
        </CanvasContainer>
        {/*<Slider
          totalSteps={this.dataKeys.length}
          updateData={this.updateLegendStage}
          startLabel={data[this.dataKeys[0]].dateString}
          endLabel={data[this.dataKeys[this.dataKeys.length - 1]].dateString}
        />*/}
      </Container>
    );
  }
}


export default PrefecturalChina;
