import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import geoWorld from '../data/world.topojson';

const Canvas = styled.div`
  max-width: 600px;
  margin: 0 auto;
  margin-top: 20px;
`;

const BarChart = styled.div`
  max-width: 600px;
  min-height: 600px;
  border: 1px solid black;
  > div {
    text-align: right;
    margin-top: 10px;
  }
`;

const Geo = styled.svg`
  width: 600px;
  height: 600px;
`;


const Path = styled.path`

`


class ChinaChronological extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
    this.barchart = null;
    this.geo = null;
  }

  componentDidMount() {
    if (this.barchart) {
      this._drawBarChart();
    }
    if (this.geo) {
      this._drawGeo();
    }
  }

  _drawBarChart() {
    const data = [
      30,
      20,
      10,
      60,
      80,
      90,
    ];
    const max = data.reduce((acc, v) => Math.max(acc, v), 0);
    d3
      .select(this.barchart)
      .selectAll('div')
      .data(data)
      .enter()
      .append('div')
      .style('background-color', 'blue')
      .style('color', 'white')
      .style('width', (d) => `${(d / max) * 100}%`)
      .text((d) => d);
  }

  _drawGeo() {
    const projection = d3
      .geoEquirectangular()
      .translate([300, 300])
      .scale(100)
    const path = d3.geoPath(projection);
    const countries = topojson.feature(geoWorld, geoWorld.objects.countries).features;
    d3
      .select(this.geo)
      .selectAll('path')
      .data(countries)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', '#cccccc')
      .attr('stroke', '#333')
      .attr('stroke-width', '0.5')
      .on('click', () => {
        d3.select(this).attr('fill', 'blue')
      });
  }

  render() {
    return (
      <Canvas>
        <BarChart
          ref={(node) => { this.barchart = node; }}
        />
        <Geo
          ref={(node) => { this.geo = node; }}
        />
      </Canvas>
    );
  }
}

export default ChinaChronological;
