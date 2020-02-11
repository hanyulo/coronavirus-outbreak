import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import china from '../data/zh-mainland-provinces.json';
import hongKong from '../data/hong-kong.json';
import macau from '../data/macau.json';
import Slider from './Slider';
import { formatNumber } from '../utils';


const mapLegends = ['0', '1 - 10', '11 - 20', '21 - 100', '100 +', '1000 +', '10,000 +'];

const width = 700;
const mapRatio = 0.58;
const height = width * mapRatio;
const scaleRatio = 0.71;
const DEFAULT_MAP_COLOR = '#DADADA';
const BORDER_COLOR = '#333';
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854;

const widthHongKong = 130;
const mapRatioHongKong = 0.73;
const heightSAR = widthHongKong * mapRatioHongKong;
const scaleRatioHongKong = 70;


const scaleRatioMacau = 200;


const mobileBreakPoint = '600px';

const Container = styled.div`
  max-width: ${width}px;
  margin: 0 auto;
  box-sizing: content-box;
  position: relative;
`;

const HongContainer = styled.div`
  width: 16%;
  box-sizing: content-box;
  position: absolute;
  right: 6%;
  bottom: 31%;
  border: 1px solid black;
  border-radius: 5px;
  text-align: center;
  @media (max-width: ${mobileBreakPoint}) {
    bottom: 28%;
    right: 8%;
  }
`;

const MacauContainer = styled.div`
  width: 16%;
  box-sizing: content-box;
  position: absolute;
  right: 6%;
  bottom: 10%;
  border: 1px solid black;
  border-radius: 5px;
  text-align: center;
  @media (max-width: ${mobileBreakPoint}) {
    bottom: 12%;
    right: 8%;
  }
`;

const Geo = styled.svg`
  margin: 20px auto;
  width: 100%;
  height: ${height}px;
  @media (max-width: ${mobileBreakPoint}) {
    margin-bottom: 40px;
  }
`;

const GeoHongKong = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
  left: 0;
`;

const GeoMacau = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
  left: 0;
`;

const LocationLabel = styled.div`
  position: absolute;
  bottom: 10%;
  right: 0;
  left: 0;
  width: 100%;
  text-align:center;
  font-size: 18px;
  @media (max-width: 600px) {
    font-size: 13px;
  }
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

const NumericMapLegend = styled.div`
  display: grid;
  max-width: 70%;
  grid-template-columns: auto auto auto auto;
  margin: 20px 0 0 0;
`;

const Legend = styled.div`
  white-space: nowrap;
  padding: 5px 0 5px 0;
  display: flex;
  align-items: center;
`;

const ColorIcon = styled.div`
  width: 15px;
  height: 15px;
  border: 1px solid white;
  background-color: ${props => props.backgrounColor || 'white'};
  border-radius: 3px;
  margin-right: 7px;
`;

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
    this.geoHongKong = null;
    this.geoMacau = null;
    this.tooltip = null;
    this.colorProcessor = this._colorProcessor.bind(this);
    this.getConfirmedCount = this._getConfirmedCount.bind(this);
    this.updateData = this._updateData.bind(this);
    this.drawChina = this._drawChina.bind(this);
    this.container = null;
    this.hongKongContainer = null;
    this.macauContainer = null;
  }

  componentDidMount() {
    if (this.geo) {
      // TODO: need to remove such listener
      d3.select(window).on('resize', () => {
        this._cleanCanvas();
        this._drawChina();
        this._drawHongKong();
        this._drawMacau();
      });
      this._drawHongKong();
      this._drawChina();
      this._drawMacau();
    }
  }

  componentDidUpdate() {
    if (this.geo) {
      this._drawChina();
      this._drawHongKong();
      this._drawMacau();
    }
  }

  _cleanCanvas() {
    d3
      .select(this.geo)
      .selectAll('path')
      .remove();
    d3
      .select(this.geoHongKong)
      .selectAll('path')
      .remove();
    d3
      .select(this.geoMacau)
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
      this._drawHongKong();
      this._drawMacau();
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

  _drawMacau() {
    const { step } = this.state;
    const clientWidth = this.macauContainer.clientWidth;
    const clientHeight = clientWidth * mapRatioHongKong;
    this.macauContainer.style.height = clientHeight + (clientHeight * 0.3);
    const projection = d3
      .geoMercator()
      .scale(clientWidth * scaleRatioMacau)
      .center([centerChinaLongtitude + 9.06, centerChinaLatitude - 15.43])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    // const countries = topojson.feature(global, global.objects.countries).features;
    const specialAdministrativeRegions = topojson.feature(macau, macau.objects.layer1).features;
    const tooltip = d3.select(this.tooltip);
    // const tooltipDimension = this.tooltip.getBoundingClientRect();
    const tooltipTrack = this.tooltip;
    const truncateSimplifiedMandarine = str => (str && typeof str === 'string') ? str.split('|')[0] : '';
    const colorProcessor = this.colorProcessor;
    const getConfirmedCount = this.getConfirmedCount;
    d3
      .select(this.geoMacau)
      .selectAll('path')
      .data(specialAdministrativeRegions)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function(d) {
        const color = colorProcessor(d);
        return color;
        // return DEFAULT_MAP_COLOR;
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
            確診人數：${formatNumber(getConfirmedCount(d))}
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
              確診人數：${formatNumber(getConfirmedCount(d))}
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

  _drawHongKong() {
    const { step } = this.state;
    const clientWidth = this.hongKongContainer.clientWidth;
    const clientHeight = clientWidth * mapRatioHongKong;
    this.hongKongContainer.style.height = clientHeight + (clientHeight * 0.3);
    const projection = d3
      .geoMercator()
      .scale(clientWidth * scaleRatioHongKong)
      .center([centerChinaLongtitude + 9.63, centerChinaLatitude - 15.25])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    // const countries = topojson.feature(global, global.objects.countries).features;
    const specialAdministrativeRegions = topojson.feature(hongKong, hongKong.objects.layer1).features;
    const tooltip = d3.select(this.tooltip);
    // const tooltipDimension = this.tooltip.getBoundingClientRect();
    const tooltipTrack = this.tooltip;
    const truncateSimplifiedMandarine = str => (str && typeof str === 'string') ? str.split('|')[0] : '';
    const colorProcessor = this.colorProcessor;
    const getConfirmedCount = this.getConfirmedCount;
    d3
      .select(this.geoHongKong)
      .selectAll('path')
      .data(specialAdministrativeRegions)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function(d) {
        const color = colorProcessor(d);
        return color;
        // return DEFAULT_MAP_COLOR;
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
            確診人數：${formatNumber(getConfirmedCount(d))}
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
              確診人數：${formatNumber(getConfirmedCount(d))}
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
      .center([centerChinaLongtitude + 4, centerChinaLatitude])
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
            確診人數：${formatNumber(getConfirmedCount(d))}
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
              確診人數：${formatNumber(getConfirmedCount(d))}
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

  _renderLegend() {
    const Legends = mapLegends.map((label, index) => {
      return (
        <Legend
          key={`${index}_${label}`}
        >
          <ColorIcon
            backgrounColor={stageColorMap[index]}
          />
          <span>{label}</span>
        </Legend>
      );
    });
    return (
      <NumericMapLegend>
        {Legends}
      </NumericMapLegend>
    );
  }

  render() {
    const { data } = this.props;
    const { dateString } = this.state;
    const sortedTimetamps = Object.keys(data);
    const [month, day] = dateString.split('/');
    return (
      <Container
        ref={(node) => { this.container = node; }}
      >
        <Header>{`${month}月${day}日確診人數`}</Header>
        {this._renderLegend()}
        <Geo
          ref={(node) => { this.geo = node; }}
        />
        <HongContainer
          ref={(node) => { this.hongKongContainer = node; }}
        >
          <GeoHongKong
            ref={(node) => { this.geoHongKong = node; }}
          />
          <LocationLabel>香港</LocationLabel>
        </HongContainer>
        <MacauContainer
          ref={(node) => { this.macauContainer = node; }}
        >
          <GeoMacau
            ref={(node) => { this.geoMacau = node; }}
          />
          <LocationLabel>澳門</LocationLabel>
        </MacauContainer>
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
    );
  }
}

export default ChinaChronological;
