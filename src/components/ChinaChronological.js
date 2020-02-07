import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import cn from '../data/zh-mainland-provinces.json';
// import global from '../data/world.topojson';
import Slider from './Slider';

const width = 700;
const height = 500;
const mapRatio = 0.7;
const DEFAULT_MAP_COLOE = '#C8C8C8';
const BORDER_COLOR = '#333';
const HOVER_COLOR = '#0083CB';

const Canvas = styled.div`
  width: ${width};
  margin: 0 auto;
  margin-top: 20px;
  border: 1px solid black;
`;

const Geo = styled.svg`
  margin: 0 auto;
  width: ${width}px;
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
  position: absolute;
  display: none;
`;

const Header = styled.div`
  color: #333;
  font-weight: 600;
  margin-bottom: 10px;
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
    this.tooltip = null;
    this.colorProcessor = this._colorProcessor.bind(this);
    this.getConfirmedCount = this._getConfirmedCount.bind(this);
    this.updateData = this._updateData.bind(this);
  }

  componentDidMount() {
    if (this.geo) {
      this._drawChina();
    }
  }

  componentDidUpdate() {
    if (this.geo) {
      this._drawChina();
    }
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
      d3
        .select(this.geo)
        .selectAll('path')
        .remove();
      this._drawChina();
    });
  }

  _colorProcessor(d) {
    const { step } = this.state;
    const { data } = this.props;
    const sortedTimetamps = Object.keys(data);
    const currentTimestamp = sortedTimetamps[step];
    const provinceName = d.properties.name;
    const { data: provinceCountData, dateString } = data[currentTimestamp];
    const stage = getInfectedStageFromCount(provinceCountData[provinceName]);
    return stageColorMap[stage];
  }

  _getConfirmedCount(d) {
    const { step } = this.state;
    const { data } = this.props;
    const sortedTimetamps = Object.keys(data);
    const currentTimestamp = sortedTimetamps[step];
    const provinceName = d.properties.name;
    const { data: provinceCountData, dateString } = data[currentTimestamp];
    return provinceCountData[provinceName];
  }

  _drawChina() {
    const { step } = this.state;
    const projection = d3
      .geoMercator()
      .scale(600)
      .center([104.4898, 37.5854])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath(projection);
    // const countries = topojson.feature(global, global.objects.countries).features;
    const provinces = topojson.feature(cn, cn.objects.provinces).features;
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
      <Canvas>
        <Header>{`日期：${dateString}`}</Header>
        <Geo
          ref={(node) => { this.geo = node; }}
        />
        <Slider
          updateData={this.updateData}
          totalSteps={sortedTimetamps.length}
          startLabel={this.startDate}
          endLabel={this.endDate}
        />
        <ToolTip
          ref={(node) => { this.tooltip = node; }}
        />
      </Canvas>
    );
  }
}

export default ChinaChronological;
