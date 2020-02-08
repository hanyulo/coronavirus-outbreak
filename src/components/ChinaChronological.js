import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import china from '../data/zh-mainland-provinces.json';
import hkMac from '../data/zh-hkg-mac.json';
// import global from '../data/world.topojson';
import Slider from './Slider';

const width = 700;
const mapRatio = 0.58;
const height = width * mapRatio;
const scaleRatio = 0.71;
const DEFAULT_MAP_COLOE = '#C8C8C8';
const BORDER_COLOR = '#333';
const HOVER_COLOR = '#0083CB';
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854

const widthSAR = 130;
const mapRatioSAR = 0.8;
const heightSAR = widthSAR * mapRatioSAR;
const scaleRatioRSA = 55;

const Container = styled.div`
  max-width: ${width}px;
  margin: 0 auto;
  margin-top: 20px;
  border: 1px solid black;
  padding: 20px;
  box-sizing: content-box;
  position: relative;
`;

const SubContainer = styled.div`
  width: 18.5%;
  margin: 0 auto;
  margin-top: 20px;
  padding: 20px;
  box-sizing: content-box;
  position: absolute;
  right: 5%;
  bottom: 26%;
  @media (max-width: 767px) {
    right: 0;
    bottom: 23%;
  }
`;

// const Geo = styled.svg.attrs({
//   viewBox: `${width / 2} ${height / 2} ${width} ${height}`,
// })`
//   margin: 20px auto;
// `;


const Geo = styled.svg`
  margin: 20px auto;
  width: 100%;
  height: ${height}px;
`;

const GeoSAR = styled.svg`
  width: 100%;
  height: ${heightSAR}px;
  position: absolute;
  right: 0;
  top: -20px;
  border: 1px solid black;
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
`;

const Header = styled.div`
  color: #333;
  font-weight: 600;
  font-size: 26px;
`;

const stageColorMap = {
  0: DEFAULT_MAP_COLOE,
  1: '#F5C6E9',
  2: '#D196BC',
  3: '#BE659B',
  4: '#813B7C',
  5: '#451258',
  6: '#2B014B',
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


class ChinaChronological extends Component {
  constructor(props) {
    super(props);
    const { data } = this.props;
    const sortedTimetamps = Object.keys(data);
    const { dateString: startDateString } = data[sortedTimetamps[0]];
    const { dateString: endDateString } = data[sortedTimetamps[sortedTimetamps.length - 1]];
    this.startDate = startDateString;
    this.endDate = endDateString;
    this.state = {
      dateString: startDateString,
      step: 0,
    };
    this.geo = null;
    this.geoSAR = null;
    this.tooltip = null;
    this.colorProcessor = this._colorProcessor.bind(this);
    this.getConfirmedCount = this._getConfirmedCount.bind(this);
    this.updateData = this._updateData.bind(this);
    this.drawChina = this._drawChina.bind(this);
    this.container = null;
    this.subContainer = null;
  }

  componentDidMount() {
    if (this.geo) {
      // TODO: need to remove such listener
      d3.select(window).on('resize', () => {
        this._cleanCanvas();
        this._drawChina();
        this._drawSARs();
      });
      this._drawSARs();
      this._drawChina();
    }
  }

  componentDidUpdate() {
    if (this.geo) {
      this._drawChina();
      this._drawSARs();
    }
  }

  _cleanCanvas() {
    d3
      .select(this.geo)
      .selectAll('path')
      .remove();
    d3
      .select(this.geoSAR)
      .selectAll('path')
      .remove();
  }

  _updateData(step) {
    const { data } = this.props;
    const sortedTimetamps = Object.keys(data);
    const currentTimestamp = sortedTimetamps[step];
    const { dateString } = data[currentTimestamp];
    this.setState({
      step,
      dateString,
    }, () => {
      this._cleanCanvas();
      this._drawChina();
      this._drawSARs();
    });
  }

  _colorProcessor(d) {
    const { step } = this.state;
    const { data } = this.props;
    const sortedTimetamps = Object.keys(data);
    const currentTimestamp = sortedTimetamps[step];
    const provinceName = d.properties.name || d.properties.NAME;
    const { data: provinceCountData, dateString } = data[currentTimestamp];
    const stage = getInfectedStageFromCount(provinceCountData[provinceName]);
    return stageColorMap[stage];
  }

  _getConfirmedCount(d) {
    const { step } = this.state;
    const { data } = this.props;
    const sortedTimetamps = Object.keys(data);
    const currentTimestamp = sortedTimetamps[step];
    const provinceName = d.properties.name || d.properties.NAME;
    const { data: provinceCountData, dateString } = data[currentTimestamp];
    return provinceCountData[provinceName];
  }

  _drawSARs() {
    const { step } = this.state;
    const clientWidth = this.subContainer.clientWidth;
    const clientHeight = clientWidth * mapRatio;
    this.geoSAR.style.height = clientHeight;
    const projection = d3
      .geoMercator()
      .scale(clientWidth * scaleRatioRSA)
      .center([centerChinaLongtitude + 9.45, centerChinaLatitude - 15.25])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    // const countries = topojson.feature(global, global.objects.countries).features;
    const specialAdministrativeRegions = topojson.feature(hkMac, hkMac.objects.layer1).features;
    const tooltip = d3.select(this.tooltip);
    // const tooltipDimension = this.tooltip.getBoundingClientRect();
    const tooltipTrack = this.tooltip;
    const truncateSimplifiedMandarine = str => (str && typeof str === 'string') ? str.split('|')[0] : '';
    const colorProcessor = this.colorProcessor;
    const getConfirmedCount = this.getConfirmedCount;
    d3
      .select(this.geoSAR)
      .selectAll('path')
      .data(specialAdministrativeRegions)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function(d) {
        const color = colorProcessor(d);
        return color;
        // return DEFAULT_MAP_COLOE;
      })
      .attr('stroke', BORDER_COLOR)
      .attr('stroke-width', 0.5)
      .on('mouseover', function (d) {
        d3
          .select(this)
          .attr('stroke-width', 1);
        tooltip.style('display', 'block').html(`
          <div>
            ${d.properties.NAME_LOCAL}
          </div>
          <div>
            確診人數：${getConfirmedCount(d)}
          </div>
        `);
      })
      .on('mousemove', (d) => {
        let positionX = d3.event.pageX + 10;
        const positionY = d3.event.pageY;
        const tooltipRect = tooltipTrack.getBoundingClientRect();
        if ((positionX + tooltipRect.width) > window.innerWidth) {
          positionX = d3.event.pageX - tooltipRect.width - 10;
        }
        tooltip
          .style('top', `${positionY}px`)
          .style('left', `${positionX}px`)
          .html(`
            <div>
              ${truncateSimplifiedMandarine(d.properties.NAME_LOCAL)}
            </div>
            <div>
              確診人數：${getConfirmedCount(d)}
            </div>
          `);
      })
      .on('mouseout', function () {
        d3
          .select(this)
          .attr('stroke-width', 0.5);
        tooltip.style('display', 'none');
      });
  }

  _drawChina() {
    const { step } = this.state;
    const clientWidth = this.container.clientWidth;
    const clientHeight = clientWidth * mapRatio;
    this.geo.style.height = clientHeight;
    const projection = d3
      .geoMercator()
      .scale(clientWidth * scaleRatio)
      .center([centerChinaLongtitude + 9, centerChinaLatitude])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    // const countries = topojson.feature(global, global.objects.countries).features;
    const provinces = topojson.feature(china, china.objects.provinces).features;
    const tooltip = d3.select(this.tooltip);
    const truncateSimplifiedMandarine = str => (str && typeof str === 'string') ? str.split('|')[0] : '';
    const colorProcessor = this.colorProcessor;
    const getConfirmedCount = this.getConfirmedCount;
    d3
      .select(this.geo)
      .selectAll('path')
      .data(provinces)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function(d) {
        const color = colorProcessor(d);
        return color;
      })
      .attr('stroke', BORDER_COLOR)
      .attr('stroke-width', 0.5)
      .on('mouseover', function (d) {
        d3
          .select(this)
          .attr('stroke-width', 1);
        tooltip.style('display', 'block').html(`
          <div>
            ${truncateSimplifiedMandarine(d.properties.name_local)}
          </div>
          <div>
            確診人數：${getConfirmedCount(d)}
          </div>
        `);
      })
      .on('mousemove', (d) => {
        tooltip
          .style('top', `${d3.event.pageY}px`)
          .style('left', `${d3.event.pageX + 10}px`)
          .html(`
            <div>
              ${truncateSimplifiedMandarine(d.properties.name_local)}
            </div>
            <div>
              確診人數：${getConfirmedCount(d)}
            </div>
          `);
      })
      .on('mouseout', function () {
        d3
          .select(this)
          .attr('stroke-width', 0.5);
        tooltip.style('display', 'none');
      });
  }

  render() {
    const { data } = this.props;
    const { dateString } = this.state;
    const sortedTimetamps = Object.keys(data);
    return (
      <div>
        <Container
          ref={(node) => { this.container = node; }}
        >
          <Header>{`日期：${dateString}`}</Header>
          <Geo
            ref={(node) => { this.geo = node; }}
          />
          <SubContainer
            ref={(node) => { this.subContainer = node; }}
          >
            <GeoSAR
              ref={(node) => { this.geoSAR = node; }}
            />
          </SubContainer>
          <Slider
            updateData={this.updateData}
            totalSteps={sortedTimetamps.length}
            startLabel={this.startDate}
            endLabel={this.endDate}
          />
          <ToolTip
            ref={(node) => { this.tooltip = node; }}
          />
        </Container>
      </div>
    );
  }
}



export default ChinaChronological;
