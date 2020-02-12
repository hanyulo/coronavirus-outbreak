import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import china from '../data/china-provinces.json';

const width = 700;
const mapRatio = 0.58;
const scaleRatio = 0.71;
const height = width * mapRatio;
const centerChinaLongtitude = 104.4898;
const centerChinaLatitude = 37.5854;
const DEFAULT_MAP_COLOR = '#DADADA';
const BORDER_COLOR = '#333';


const Container = styled.div`
  max-width: ${width}px;
  margin: 0 auto;
  box-sizing: content-box;
  position: relative;
  border: 1px solid black;
  overflow: hidden;
  display: flex;
  align-items: center;
`;

const Map = styled.svg`
  width: 100%;
  height: ${height}px;
`;


class PrefecturalChina extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.map = null;
    this.container = null;
    this.centered = null;
  }

  componentDidMount() {
    d3.select(window).on(`resize.${PrefecturalChina.name}`, () => {
      this._cleanCanvas();
      this._drawChina();
    });
    this._drawChina();
  }

  _cleanCanvas() {
    d3
      .select(this.map)
      .selectAll('path')
      .remove();
  }

  _onClickProvince(d, map, path) {
    let x = 0;
    let y = 0;
    let scaleValue = 1;
    if (!d || this.centered === d) {
      this.centered = null;
    } else {
      // const centroid = path.centroid(d);
      this.centered = d;
      const bounds = path.bounds(d);
      const centroidX = (bounds[0][0] + bounds[1][0]) / 2;
      const centroidY = (bounds[0][1] + bounds[1][1]) / 2;
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const { clientWidth, clientHeight } = this.map;
      x = clientWidth / 2 - centroidX;
      y = clientHeight / 2 - centroidY;
      scaleValue = Math.min(clientWidth / dx, clientHeight / dy) * 0.95;
    }
    map.transition()
      .duration(750)
      .attr('transform', `scale(${scaleValue}) translate(${x}, ${y})`);
  }

  _drawChina() {
    const { clientWidth } = this.container;
    const clientHeight = clientWidth * mapRatio;
    this.container.style.height = `${clientHeight + 20}px`;
    this.map.style.height = `${clientHeight}px`;
    const scaleValue = clientWidth * scaleRatio;
    const projection = d3
      .geoMercator()
      .scale(scaleValue)
      .center([centerChinaLongtitude, centerChinaLatitude])
      .translate([clientWidth / 2, clientHeight / 2]);

    const path = d3.geoPath(projection);
    const map = d3.select(this.map);
    map
      .selectAll('path')
      .data(china.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', DEFAULT_MAP_COLOR)
      .attr('stroke', BORDER_COLOR)
      .attr('stroke-width', 0.1)
      .on('click', (d) => {
        this._onClickProvince(d, map, path);
      });
  }

  render() {
    return (
      <Container
        ref={node => { this.container = node; }}
      >
        <Map
          ref={node => { this.map = node; }}
        />
      </Container>
    );
  }
}


export default PrefecturalChina;
